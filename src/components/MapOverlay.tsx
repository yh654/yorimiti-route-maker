'use client';

import {
    APIProvider,
    Map,
    Marker,
    useMap,
} from '@vis.gl/react-google-maps';
import { useEffect } from 'react';
import type { RouteData, DetourSpot, DetourRoute } from '../types';

interface MapOverlayProps {
    routeData: RouteData;
    detourSpots: DetourSpot[];
    selectedSpot: DetourSpot | null;
    detourRoute: DetourRoute | null;
    onSpotSelect: (spot: DetourSpot) => void;
}

// ルート描画用コンポーネント（useEffect内でgoogle参照）
const Polyline = ({ path, color }: { path: { lat: number; lng: number }[], color: string }) => {
    const map = useMap();
    useEffect(() => {
        if (!map || typeof google === 'undefined') return;
        const line = new google.maps.Polyline({
            path,
            geodesic: true,
            strokeColor: color,
            strokeOpacity: 0.85,
            strokeWeight: 6,
        });
        line.setMap(map);
        return () => line.setMap(null);
    }, [map, path, color]);
    return null;
};

// 全マーカーが収まるよう地図の表示範囲を自動調整するコンポーネント
const MapAutoFit = ({
    points,
    enabled,
}: {
    points: { lat: number; lng: number }[];
    enabled: boolean;
}) => {
    const map = useMap();
    useEffect(() => {
        if (!map || !enabled || points.length === 0 || typeof google === 'undefined') return;
        const bounds = new google.maps.LatLngBounds();
        points.forEach((p) => bounds.extend(p));

        // 画面幅に応じて余白を計算
        const isMobile = window.innerWidth < 640;
        const padding = isMobile
            ? { top: 60, right: 40, bottom: 280, left: 40 } // スマホ: 下のパネル分を空ける
            : { top: 80, right: 80, bottom: 80, left: 440 }; // デスクトップ: 左のパネル分を空ける

        map.fitBounds(bounds, padding);
    }, [map, enabled, points]);
    return null;
};

export const MapOverlay = ({
    routeData,
    detourSpots,
    selectedSpot,
    detourRoute,
    onSpotSelect,
}: MapOverlayProps) => {
    const activePath = detourRoute ? detourRoute.path : routeData.path;

    // AutoFit に渡す全ポイント（出発地・目的地・スポット候補）
    const allPoints = [
        routeData.origin.coordinates,
        routeData.destination.coordinates,
        ...detourSpots.map((s) => s.coordinates),
    ];

    const shouldFit = detourSpots.length > 0 || !!detourRoute;

    return (
        <div className="w-full h-full absolute inset-0 z-0 bg-gray-100">
            <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}>
                <Map
                    defaultCenter={routeData.origin.coordinates}
                    defaultZoom={14}
                    gestureHandling={'greedy'}
                    disableDefaultUI={false}
                    zoomControl={true}
                    mapId={'bf51a910020faedc'}
                >
                    {/* 表示範囲の自動調整 */}
                    <MapAutoFit points={allPoints} enabled={shouldFit} />

                    {/* 出発地マーカー */}
                    <Marker
                        position={routeData.origin.coordinates}
                        label={{ text: '出発', color: 'white', fontWeight: 'bold', fontSize: '11px' }}
                    />

                    {/* 目的地マーカー */}
                    <Marker
                        position={routeData.destination.coordinates}
                        label={{ text: 'GOAL', color: 'white', fontWeight: 'bold', fontSize: '11px' }}
                    />

                    {/* ルート描画 */}
                    <Polyline
                        path={activePath}
                        color={detourRoute ? '#6366f1' : '#94a3b8'}
                    />

                    {/* スポットマーカー */}
                    {detourSpots.map((spot) => (
                        <Marker
                            key={spot.id}
                            position={spot.coordinates}
                            onClick={() => onSpotSelect(spot)}
                            opacity={selectedSpot && selectedSpot.id !== spot.id ? 0.45 : 1}
                            label={{
                                text: '★',
                                color: selectedSpot?.id === spot.id ? '#6366f1' : '#ec4899',
                                fontSize: '14px',
                            }}
                        />
                    ))}
                </Map>
            </APIProvider>
        </div>
    );
};
