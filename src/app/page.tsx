'use client';

import { useState, useCallback } from 'react';
import { MapOverlay } from '@/components/MapOverlay';
import { ControlPanel } from '@/components/ControlPanel';
import type { RouteData, DetourSpot, DetourRoute } from '@/types';
import type { DetourSearchResponse, SearchRequest } from '@/types/api';

// デフォルトの出発地・目的地（東京駅→上野駅）
const defaultOrigin = { lat: 35.681236, lng: 139.767125 };
const defaultDestination = { lat: 35.713768, lng: 139.777254 };
const defaultOriginName = '東京駅';
const defaultDestinationName = '上野駅';

export default function Home() {
    const [routeData, setRouteData] = useState<RouteData>({
        origin: { id: 'origin', name: defaultOriginName, coordinates: defaultOrigin },
        destination: { id: 'destination', name: defaultDestinationName, coordinates: defaultDestination },
        baseTravelTimeMin: 0,
        path: [defaultOrigin, defaultDestination],
    });

    const [availableSpots, setAvailableSpots] = useState<DetourSpot[]>([]);
    const [selectedSpot, setSelectedSpot] = useState<DetourSpot | null>(null);
    const [activeDetourRoute, setActiveDetourRoute] = useState<DetourRoute | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isGpsLoading, setIsGpsLoading] = useState(false);
    const [pendingOriginName, setPendingOriginName] = useState(defaultOriginName);
    const [pendingDestName, setPendingDestName] = useState(defaultDestinationName);

    // ---------------------------------------------------------------------------
    // GPS現在地取得
    // ---------------------------------------------------------------------------
    const handleGpsRequest = useCallback(() => {
        if (!navigator.geolocation) {
            alert('このブラウザはGeolocationをサポートしていません。');
            return;
        }
        setIsGpsLoading(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                const gpsName = `現在地 (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
                setPendingOriginName(gpsName);
                setRouteData(prev => ({
                    ...prev,
                    origin: {
                        id: 'origin',
                        name: gpsName,
                        coordinates: { lat: latitude, lng: longitude },
                    },
                    path: [{ lat: latitude, lng: longitude }, prev.destination.coordinates],
                }));
                setIsGpsLoading(false);
            },
            (err) => {
                alert(`位置情報の取得に失敗しました: ${err.message}`);
                setIsGpsLoading(false);
            }
        );
    }, []);

    // ---------------------------------------------------------------------------
    // 目的地の変更（文字入力 → Geocoding (簡易実装: 変更した名前をStateに持つだけ)）
    // 実際のジオコーディングは検索ボタン押下時にBFFに送ります
    // ---------------------------------------------------------------------------
    const handleDestinationChange = useCallback((name: string) => {
        setPendingDestName(name);
    }, []);

    // ---------------------------------------------------------------------------
    // 出発地の変更（テキスト入力→Geocoding）
    // ---------------------------------------------------------------------------
    const handleOriginChange = useCallback((name: string) => {
        setPendingOriginName(name);
    }, []);

    // ---------------------------------------------------------------------------
    // 検索実行（BFF POST /api/detour）
    // ---------------------------------------------------------------------------
    const handleSearch = async (availableTimeMin: number, category: string, travelMode: string) => {
        setIsLoading(true);
        setAvailableSpots([]);
        setSelectedSpot(null);
        setActiveDetourRoute(null);

        // 出発地名が変わっていたら Geocoding API で座標を取得
        let originCoords = routeData.origin.coordinates;
        if (pendingOriginName !== routeData.origin.name && pendingOriginName.trim()) {
            try {
                const geoRes = await fetch(`/api/geocode?address=${encodeURIComponent(pendingOriginName)}`);
                if (geoRes.ok) {
                    const geoData = await geoRes.json();
                    originCoords = geoData.location;
                    setRouteData(prev => ({
                        ...prev,
                        origin: { id: 'origin', name: pendingOriginName, coordinates: originCoords },
                    }));
                }
            } catch {
                console.warn('Origin geocoding failed');
            }
        }

        // 目的地名が変わっていたら Geocoding API で座標を判定
        let destCoords = routeData.destination.coordinates;
        if (pendingDestName !== routeData.destination.name) {
            try {
                const geoRes = await fetch(
                    `/api/geocode?address=${encodeURIComponent(pendingDestName)}`
                );
                if (geoRes.ok) {
                    const geoData = await geoRes.json();
                    destCoords = geoData.location;
                    setRouteData(prev => ({
                        ...prev,
                        destination: {
                            id: 'destination',
                            name: pendingDestName,
                            coordinates: destCoords,
                        },
                    }));
                }
            } catch {
                console.warn('Geocoding failed, using previous destination coordinates');
            }
        }

        const requestBody: SearchRequest = {
            origin: originCoords,
            destination: destCoords,
            availableTimeMin,
            category,
            travelMode: travelMode as any,
        };

        try {
            const res = await fetch('/api/detour', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            });

            if (!res.ok) {
                const errBody = await res.json().catch(() => ({}));
                throw new Error(errBody.error || `HTTP ${res.status}`);
            }

            const data: DetourSearchResponse = await res.json();

            setRouteData(prev => ({
                ...prev,
                baseTravelTimeMin: data.baseRoute.travelTimeMin,
                path: data.baseRoute.path,
            }));

            const spots: (DetourSpot & { routePath?: { lat: number; lng: number }[] })[] =
                data.candidates.map(c => ({
                    id: c.spotInfo.placeId,
                    name: c.spotInfo.name,
                    coordinates: c.spotInfo.location,
                    type: c.spotInfo.type as any,
                    description: '',
                    rating: c.spotInfo.rating,
                    imageUrl: c.spotInfo.photoUrl,
                    addedTravelTimeMin: c.timeCalculation.addedTravelTimeMin,
                    recommendedStayTimeMin: c.timeCalculation.availableStayTimeMin,
                    routePath: c.routeGeometry.path,
                }));

            setAvailableSpots(spots as any);

        } catch (error) {
            console.error('API Search Error:', error);
            alert('ルートの検索中にエラーが発生しました。APIキーや通信状況をご確認ください。');
        } finally {
            setIsLoading(false);
        }
    };

    // ---------------------------------------------------------------------------
    // スポット選択
    // ---------------------------------------------------------------------------
    const handleSpotSelect = useCallback((spot: any) => {
        if (!spot) {
            setSelectedSpot(null);
            setActiveDetourRoute(null);
            return;
        }
        setSelectedSpot(spot);
        setActiveDetourRoute({
            spotId: spot.id,
            totalTravelTimeMin: routeData.baseTravelTimeMin + spot.addedTravelTimeMin,
            path: spot.routePath,
        });
    }, [routeData.baseTravelTimeMin]);

    // ---------------------------------------------------------------------------
    // リセット
    // ---------------------------------------------------------------------------
    const handleClear = useCallback(() => {
        setAvailableSpots([]);
        setSelectedSpot(null);
        setActiveDetourRoute(null);
        setRouteData(prev => ({
            ...prev,
            path: [prev.origin.coordinates, prev.destination.coordinates],
        }));
    }, []);

    return (
        <main className="w-full h-screen relative overflow-hidden">
            <MapOverlay
                routeData={routeData}
                detourSpots={availableSpots}
                selectedSpot={selectedSpot}
                detourRoute={activeDetourRoute}
                onSpotSelect={handleSpotSelect}
            />

            <ControlPanel
                originName={pendingOriginName}
                destinationName={pendingDestName}
                availableSpots={availableSpots}
                selectedSpot={selectedSpot}
                detourRoute={activeDetourRoute}
                isLoading={isLoading}
                isGpsLoading={isGpsLoading}
                onSearch={handleSearch}
                onClear={handleClear}
                onSpotSelect={handleSpotSelect}
                onGpsRequest={handleGpsRequest}
                onOriginChange={handleOriginChange}
                onDestinationChange={handleDestinationChange}
            />
        </main>
    );
}
