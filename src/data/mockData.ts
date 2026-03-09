import type { RouteData, DetourSpot, DetourRoute } from '../types';

export const mockRouteData: RouteData = {
    origin: {
        id: 'origin',
        name: '東京駅',
        coordinates: { lat: 35.681236, lng: 139.767125 },
    },
    destination: {
        id: 'destination',
        name: '上野駅',
        coordinates: { lat: 35.713768, lng: 139.777254 },
    },
    baseTravelTimeMin: 15,
    path: [
        { lat: 35.681236, lng: 139.767125 },
        { lat: 35.694318, lng: 139.770281 },
        { lat: 35.702069, lng: 139.774591 },
        { lat: 35.707328, lng: 139.774358 },
        { lat: 35.713768, lng: 139.777254 },
    ],
};

export const mockDetourSpots: DetourSpot[] = [
    {
        id: 'spot-1',
        name: 'ブルーボトルコーヒー 神田万世橋',
        coordinates: { lat: 35.697479, lng: 139.769931 },
        type: 'cafe',
        description: '川沿いの赤レンガアーチが美しいリノベーションカフェ。',
        rating: 4.5,
        imageUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=400&q=80',
        addedTravelTimeMin: 5,
        recommendedStayTimeMin: 30,
    },
    {
        id: 'spot-2',
        name: '上野恩賜公園 不忍池',
        coordinates: { lat: 35.711812, lng: 139.770959 },
        type: 'sightseeing',
        description: '広大な敷地を誇る上野公園内の美しい池。',
        rating: 4.8,
        imageUrl: 'https://images.unsplash.com/photo-1596714561848-bc368d49a3fc?auto=format&fit=crop&w=400&q=80',
        addedTravelTimeMin: 12,
        recommendedStayTimeMin: 45,
    },
];

export const mockDetourRoutes: Record<string, DetourRoute> = {
    'spot-1': {
        spotId: 'spot-1',
        totalTravelTimeMin: 20,
        path: [
            { lat: 35.681236, lng: 139.767125 },
            { lat: 35.697479, lng: 139.769931 },
            { lat: 35.713768, lng: 139.777254 },
        ],
    },
    'spot-2': {
        spotId: 'spot-2',
        totalTravelTimeMin: 27,
        path: [
            { lat: 35.681236, lng: 139.767125 },
            { lat: 35.711812, lng: 139.770959 },
            { lat: 35.713768, lng: 139.777254 },
        ],
    },
};
