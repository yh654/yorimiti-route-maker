import { NextResponse } from 'next/server';
import type { SearchRequest, DetourSearchResponse, DetourCandidate } from '@/types/api';

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

// -----------------------------------------------------------------------------
// Helper: Routes API (New) でルートを取得
// POST https://routes.googleapis.com/directions/v2:computeRoutes
// -----------------------------------------------------------------------------
async function computeRoute(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
    waypoint?: { lat: number; lng: number },
    travelMode: string = 'DRIVE'
): Promise<{ travelTimeMin: number; path: { lat: number; lng: number }[] } | null> {
    const body: any = {
        origin: { location: { latLng: { latitude: origin.lat, longitude: origin.lng } } },
        destination: { location: { latLng: { latitude: destination.lat, longitude: destination.lng } } },
        travelMode: travelMode,
        computeAlternativeRoutes: false,
        languageCode: 'ja',
        units: 'METRIC',
        routeModifiers: { avoidTolls: false },
    };

    if (waypoint) {
        body.intermediates = [{
            via: true,
            location: { latLng: { latitude: waypoint.lat, longitude: waypoint.lng } },
        }];
    }

    const res = await fetch(
        'https://routes.googleapis.com/directions/v2:computeRoutes',
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': API_KEY,
                'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline',
            },
            body: JSON.stringify(body),
        }
    );

    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Routes API error: ${errText}`);
    }

    const data = await res.json();
    if (!data.routes || data.routes.length === 0) {
        console.warn(`[computeRoute] No routes found for ${travelMode} from (${origin.lat},${origin.lng}) to (${destination.lat},${destination.lng})`);
        return null;
    }

    const route = data.routes[0];
    const travelTimeMin = Math.ceil(Number(route.duration.replace('s', '')) / 60);
    const path = decodePolyline(route.polyline.encodedPolyline);

    return { travelTimeMin, path };
}

// -----------------------------------------------------------------------------
// Helper: Places API (New) でスポット検索
// POST https://places.googleapis.com/v1/places:searchNearby
// -----------------------------------------------------------------------------
async function searchNearbyPlaces(
    center: { lat: number; lng: number },
    radiusMeters: number,
    type: string
): Promise<any[]> {
    const body = {
        locationRestriction: {
            circle: {
                center: { latitude: center.lat, longitude: center.lng },
                radius: radiusMeters,
            },
        },
        includedTypes: [type],
        maxResultCount: 10,
        languageCode: 'ja',
        rankPreference: 'POPULARITY',
    };

    const res = await fetch(
        'https://places.googleapis.com/v1/places:searchNearby',
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': API_KEY,
                'X-Goog-FieldMask': 'places.id,places.displayName,places.location,places.rating,places.photos',
            },
            body: JSON.stringify(body),
        }
    );

    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Places API error: ${errText}`);
    }

    const data = await res.json();
    return data.places || [];
}

// -----------------------------------------------------------------------------
// Helper: Polyline デコーダー
// -----------------------------------------------------------------------------
function decodePolyline(encoded: string): { lat: number; lng: number }[] {
    const points: { lat: number; lng: number }[] = [];
    let index = 0;
    const len = encoded.length;
    let lat = 0;
    let lng = 0;

    while (index < len) {
        let b, shift = 0, result = 0;
        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        lat += (result & 1) !== 0 ? ~(result >> 1) : result >> 1;

        shift = 0;
        result = 0;
        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        lng += (result & 1) !== 0 ? ~(result >> 1) : result >> 1;

        points.push({ lat: lat / 1e5, lng: lng / 1e5 });
    }
    return points;
}

// -----------------------------------------------------------------------------
// POST /api/detour
// -----------------------------------------------------------------------------
export async function POST(request: Request) {
    try {
        const body: SearchRequest = await request.json();
        const { origin, destination, availableTimeMin, category, travelMode = 'DRIVE' } = body;

        if (!API_KEY) {
            return NextResponse.json({ error: 'API key is missing' }, { status: 500 });
        }

        // 1. 基本ルートを取得
        const baseRoute = await computeRoute(origin, destination, undefined, travelMode);
        if (!baseRoute) {
            return NextResponse.json({ error: 'Base route not found' }, { status: 404 });
        }

        const { travelTimeMin: baseTravelTimeMin, path: basePath } = baseRoute;

        // 2. ルート中間点の近くにあるスポットを検索
        const middleIndex = Math.floor(basePath.length / 2);
        const searchCenter = basePath[middleIndex] || origin;

        const places = await searchNearbyPlaces(searchCenter, 3000, category || 'cafe');

        // 評価の高い上位3件に絞る
        const topPlaces = places
            .filter((p) => p.rating && p.rating >= 3.5)
            .sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0))
            .slice(0, 3);

        // 3. 各スポット経由の寄り道ルートを並列計算
        const candidates: DetourCandidate[] = [];

        await Promise.all(
            topPlaces.map(async (place: any) => {
                const spotLoc = place.location;
                if (!spotLoc) return;

                const waypoint = { lat: spotLoc.latitude, lng: spotLoc.longitude };
                const detourRoute = await computeRoute(origin, destination, waypoint, travelMode);

                if (!detourRoute) return;

                const { travelTimeMin: totalTravelTimeMin, path } = detourRoute;
                const addedTravelTimeMin = totalTravelTimeMin - baseTravelTimeMin;
                const availableStayTimeMin = availableTimeMin - addedTravelTimeMin;

                if (availableStayTimeMin >= 15) {
                    // 写真URLの構築 (Places API New の形式)
                    const photoRef = place.photos?.[0]?.name;
                    const photoUrl = photoRef
                        ? `https://places.googleapis.com/v1/${photoRef}/media?maxWidthPx=400&key=${API_KEY}`
                        : 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=400&q=80';

                    candidates.push({
                        spotInfo: {
                            placeId: place.id || '',
                            name: place.displayName?.text || 'Unknown',
                            location: waypoint,
                            type: category || 'cafe',
                            rating: place.rating || 0,
                            photoUrl,
                        },
                        timeCalculation: { addedTravelTimeMin, availableStayTimeMin, totalTravelTimeMin },
                        routeGeometry: { path },
                    });
                }
            })
        );

        const response: DetourSearchResponse = {
            baseRoute: { travelTimeMin: baseTravelTimeMin, path: basePath },
            candidates: candidates.sort(
                (a, b) => b.timeCalculation.availableStayTimeMin - a.timeCalculation.availableStayTimeMin
            ),
        };

        return NextResponse.json(response);

    } catch (error: any) {
        // Google Maps API エラーの詳細をログに出力し、フロントへ忔帰
        const apiError = error?.response?.data;
        const message = apiError
            ? `Google Maps API Error: ${apiError.error_message || JSON.stringify(apiError.status)}`
            : String(error?.message || error);

        console.error('[BFF /api/detour] Error:', message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
