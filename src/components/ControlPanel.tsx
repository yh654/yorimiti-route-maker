'use client';

import React, { useState } from 'react';
import type { DetourSpot, DetourRoute } from '../types';
import { MapPin, Navigation, Clock, Search, Coffee, Map as MapIcon, ShoppingBag, Utensils, Locate, Star, X, Car, PersonStanding, ChevronDown, ChevronUp } from 'lucide-react';

type SpotCategory = 'cafe' | 'tourist_attraction' | 'restaurant' | 'shopping_mall';
type TravelMode = 'DRIVE' | 'WALK';

interface ControlPanelProps {
    originName: string;
    destinationName: string;
    availableSpots: DetourSpot[];
    selectedSpot: DetourSpot | null;
    detourRoute: DetourRoute | null;
    isLoading?: boolean;
    onSearch: (availableTimeMin: number, category: SpotCategory, travelMode: TravelMode) => void;
    onClear: () => void;
    onSpotSelect: (spot: DetourSpot) => void;
    onGpsRequest: () => void;
    onOriginChange: (name: string) => void;
    onDestinationChange: (name: string) => void;
    isGpsLoading?: boolean;
}

const getSpotIcon = (type: string) => {
    switch (type) {
        case 'cafe': return <Coffee size={18} className="text-[#ec4899]" />;
        case 'tourist_attraction': return <MapIcon size={18} className="text-[#6366f1]" />;
        case 'restaurant': return <Utensils size={18} className="text-[#f59e0b]" />;
        case 'shopping_mall': return <ShoppingBag size={18} className="text-[#10b981]" />;
        default: return <MapPin size={18} />;
    }
};

const CATEGORIES: { value: SpotCategory; label: string; icon: React.ReactNode }[] = [
    { value: 'cafe', label: 'カフェ', icon: <Coffee size={14} /> },
    { value: 'tourist_attraction', label: '観光', icon: <MapIcon size={14} /> },
    { value: 'restaurant', label: '食事', icon: <Utensils size={14} /> },
    { value: 'shopping_mall', label: 'ショッピング', icon: <ShoppingBag size={14} /> },
];

export const ControlPanel: React.FC<ControlPanelProps> = ({
    originName,
    destinationName,
    availableSpots,
    selectedSpot,
    detourRoute,
    isLoading = false,
    onSearch,
    onClear,
    onSpotSelect,
    onGpsRequest,
    onOriginChange,
    onDestinationChange,
    isGpsLoading = false,
}) => {
    const [availableTime, setAvailableTime] = useState<number>(60);
    const [category, setCategory] = useState<SpotCategory>('cafe');
    const [travelMode, setTravelMode] = useState<TravelMode>('DRIVE');
    const [hasSearched, setHasSearched] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);

    const handleSearch = () => {
        setHasSearched(true);
        onSearch(availableTime, category, travelMode);
    };

    const handleClear = () => {
        setHasSearched(false);
        setAvailableTime(60);
        setCategory('cafe');
        setTravelMode('DRIVE');
        onClear();
    };

    return (
        <div
            className={`
                fixed transition-all duration-500 cubic-bezier(0.16, 1, 0.3, 1) z-[1000] flex flex-col gap-2 
                bottom-4 left-0 w-full px-4 
                sm:absolute sm:bottom-auto sm:top-6 sm:left-6 sm:w-96 sm:px-0 sm:bottom-0 sm:mb-0 sm:max-h-[calc(100vh-48px)]
                ${isCollapsed ? 'translate-y-[calc(100%-52px)] cursor-pointer' : 'translate-y-0'}
            `}
            onClick={() => isCollapsed && setIsCollapsed(false)}
        >
            {/* モバイル用開閉ハンドル */}
            <div
                className="sm:hidden flex justify-center p-2 bg-white/95 backdrop-blur-md rounded-t-3xl border-t border-white/50 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] cursor-pointer active:bg-gray-50"
                onClick={(e) => { e.stopPropagation(); setIsCollapsed(!isCollapsed); }}
            >
                <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
            </div>

            <div className={`
                glass-panel p-4 sm:p-5 overflow-y-auto sm:max-h-none
                rounded-none sm:rounded-[24px]
                ${isCollapsed ? 'pointer-events-none' : 'pointer-events-auto'}
            `}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2 text-gray-800" style={{ fontFamily: 'var(--font-outfit)' }}>
                        <Navigation size={20} className="text-[#6366f1]" />
                        よりみちルート
                    </h2>
                    <button
                        onClick={(e) => { e.stopPropagation(); setIsCollapsed(!isCollapsed); }}
                        className="sm:hidden p-1 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 transition-colors"
                    >
                        {isCollapsed ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                </div>

                <div className="space-y-3">
                    {/* 地点入力 */}
                    <div className="space-y-2">
                        <div className="relative">
                            <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500 pointer-events-none" />
                            <input
                                type="text"
                                value={originName}
                                onChange={(e) => onOriginChange(e.target.value)}
                                placeholder="出発地を入力..."
                                className="input-field pl-9 pr-10 py-2 sm:py-2.5 text-sm"
                            />
                            <button
                                onClick={(e) => { e.stopPropagation(); onGpsRequest(); }}
                                disabled={isGpsLoading}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors z-20"
                            >
                                {isGpsLoading ? <div className="animate-spin h-4 w-4 border-2 border-blue-400 border-t-transparent rounded-full" /> : <Locate size={18} />}
                            </button>
                        </div>
                        <div className="relative">
                            <Navigation size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-red-400 pointer-events-none" />
                            <input
                                type="text"
                                value={destinationName}
                                onChange={(e) => onDestinationChange(e.target.value)}
                                placeholder="目的地を入力..."
                                className="input-field pl-9 py-2 sm:py-2.5 text-sm"
                            />
                        </div>
                    </div>

                    {/* 条件設定 */}
                    <div className="grid grid-cols-1 sm:grid-cols-1 gap-4 pt-1">
                        <div>
                            <p className="text-[10px] sm:text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">寄り道カテゴリ</p>
                            <div className="grid grid-cols-4 gap-1.5">
                                {CATEGORIES.map((cat) => (
                                    <button
                                        key={cat.value}
                                        onClick={() => setCategory(cat.value)}
                                        className={`flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] sm:text-xs font-bold border transition-all ${category === cat.value
                                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-200'
                                            : 'bg-white text-gray-500 border-gray-100'
                                            }`}
                                    >
                                        {cat.icon}
                                        {cat.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <p className="text-[10px] sm:text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">移動手段</p>
                            <div className="flex gap-2">
                                {[
                                    { value: 'DRIVE', label: '車', icon: <Car size={16} /> },
                                    { value: 'WALK', label: '徒歩', icon: <PersonStanding size={16} /> },
                                ].map((mode) => (
                                    <button
                                        key={mode.value}
                                        onClick={() => setTravelMode(mode.value as TravelMode)}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold border transition-all ${travelMode === mode.value
                                            ? 'bg-gray-800 text-white border-gray-800 shadow-md'
                                            : 'bg-white text-gray-500 border-gray-100'
                                            }`}
                                    >
                                        {mode.icon}
                                        {mode.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* スライダー */}
                    <div className="bg-gray-50 p-3 rounded-2xl">
                        <div className="flex justify-between mb-1.5">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                                <Clock size={14} /> 空き時間
                            </span>
                            <span className="text-sm font-black text-indigo-600">{availableTime}分</span>
                        </div>
                        <input
                            type="range" min="15" max="180" step="15"
                            value={availableTime}
                            onChange={(e) => setAvailableTime(parseInt(e.target.value))}
                            className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                    </div>

                    {!hasSearched ? (
                        <button
                            onClick={handleSearch}
                            disabled={isLoading || !destinationName}
                            className="w-full btn-primary py-3.5 flex items-center justify-center gap-2 group disabled:opacity-50"
                        >
                            {isLoading ? <div className="animate-spin h-5 w-5 border-3 border-white border-t-transparent rounded-full" /> : <Search size={20} />}
                            <span className="font-black">寄り道スポットを探す</span>
                        </button>
                    ) : (
                        <button onClick={handleClear} className="w-full py-3 bg-white text-gray-500 border-2 border-dashed border-gray-200 rounded-2xl font-bold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 text-sm">
                            <X size={18} /> 条件をリセット
                        </button>
                    )}
                </div>
            </div>

            {/* スポット一覧（モバイルは横スクロール、デスクトップは縦リスト） */}
            {hasSearched && availableSpots.length > 0 && !isCollapsed && (
                <div className="px-4 sm:px-0">
                    <div className="glass-panel p-4 flex flex-col gap-3 animate-slide-in mb-6 sm:mb-0">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <Star size={14} className="text-amber-400 fill-amber-400" />
                                見つかったスポット ({availableSpots.length})
                            </h3>
                        </div>
                        <div className="flex sm:flex-col gap-3 overflow-x-auto sm:overflow-x-visible pb-2 sm:pb-0 scrollbar-hide">
                            {availableSpots.map((spot) => (
                                <button
                                    key={spot.id}
                                    onClick={() => {
                                        onSpotSelect(spot);
                                        if (window.innerWidth < 640) setIsCollapsed(true);
                                    }}
                                    className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition-all duration-200 min-w-[280px] sm:min-w-0 ${selectedSpot?.id === spot.id
                                        ? 'bg-indigo-50 border-indigo-600 shadow-sm'
                                        : 'bg-white border-gray-100 hover:border-gray-200'
                                        }`}
                                >
                                    <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 relative">
                                        <img src={spot.imageUrl} alt={spot.name} className="w-full h-full object-cover" />
                                        <div className="absolute top-1 left-1 bg-white/90 p-1 rounded-lg">
                                            {getSpotIcon(spot.type)}
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-gray-800 text-sm truncate">{spot.name}</h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <div className="flex items-center gap-0.5 text-amber-500">
                                                <Star size={12} fill="currentColor" />
                                                <span className="text-[11px] font-black">{spot.rating.toFixed(1)}</span>
                                            </div>
                                            <span className="text-[10px] text-gray-400 font-bold">追加移動: {spot.addedTravelTimeMin}分</span>
                                        </div>
                                        <p className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full inline-block mt-1">
                                            滞在 {spot.recommendedStayTimeMin}分可
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ルート詳細詳細（デスクトップ・モバイル共通） */}
            {hasSearched && selectedSpot && detourRoute && !isLoading && (
                <div className="px-4 pb-10 sm:px-0 sm:pb-0">
                    <div className="glass-panel p-5 border-t-4 border-t-indigo-500 animate-slide-in shadow-2xl">
                        <div className="flex justify-between items-start mb-4">
                            <div className="min-w-0">
                                <h3 className="font-black text-gray-800 text-lg leading-tight truncate">{selectedSpot.name}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold">
                                        {detourRoute.totalTravelTimeMin}分
                                    </span>
                                    <span className="text-xs text-gray-400">経由ルート案</span>
                                </div>
                            </div>
                            <button onClick={() => onSpotSelect(null as any)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-3 mb-2">
                            <div className="bg-emerald-50 p-3 rounded-2xl">
                                <span className="block text-[10px] font-bold text-emerald-600 uppercase mb-1">滞在時間</span>
                                <span className="text-xl font-black text-emerald-800">{selectedSpot.recommendedStayTimeMin}分</span>
                            </div>
                            <div className="bg-amber-50 p-3 rounded-2xl">
                                <span className="block text-[10px] font-bold text-amber-600 uppercase mb-1">スポット評価</span>
                                <div className="flex items-center gap-1">
                                    <Star size={16} className="text-amber-500 fill-amber-500" />
                                    <span className="text-xl font-black text-amber-800">{selectedSpot.rating.toFixed(1)}</span>
                                </div>
                            </div>
                        </div>
                        <button className="w-full btn-primary mt-2 py-3 flex items-center justify-center gap-2"
                            onClick={() => {
                                const url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(originName)}&destination=${encodeURIComponent(destinationName)}&waypoints=${encodeURIComponent(selectedSpot.name)}&travelmode=${travelMode === 'DRIVE' ? 'driving' : 'walking'}`;
                                window.open(url, '_blank');
                            }}
                        >
                            <Navigation size={20} />
                            <span>Googleマップで案内</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
