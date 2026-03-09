'use client';

import React, { useState } from 'react';
import type { DetourSpot, DetourRoute } from '../types';
import { MapPin, Navigation, Clock, Search, Coffee, Map as MapIcon, ShoppingBag, Utensils, Locate, Star, X, Car, PersonStanding, Train } from 'lucide-react';

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
    const [originInput, setOriginInput] = useState(originName);
    const [destInput, setDestInput] = useState(destinationName);

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
        <div className="absolute top-6 left-6 w-96 z-[1000] flex flex-col gap-3 max-h-[calc(100vh-48px)] overflow-y-auto">

            {/* --- Search Panel --- */}
            <div className="glass-panel p-5 animate-slide-in">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-800" style={{ fontFamily: 'var(--font-outfit)' }}>
                    <Navigation size={20} className="text-[#6366f1]" />
                    寄り道ルートメーカー
                </h2>

                <div className="space-y-3">
                    {/* 現在地 */}
                    <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500 z-10">
                            <MapPin size={18} />
                        </div>
                        <input
                            type="text"
                            value={originInput}
                            onChange={(e) => {
                                setOriginInput(e.target.value);
                                onOriginChange(e.target.value);
                            }}
                            placeholder="出発地を入力..."
                            className="input-field pl-9 pr-12 text-sm w-full"
                        />
                        <button
                            onClick={() => {
                                setOriginInput('');
                                onGpsRequest();
                            }}
                            disabled={isGpsLoading}
                            title="GPSで現在地を取得"
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 transition-colors disabled:opacity-50"
                        >
                            {isGpsLoading
                                ? <div className="animate-spin h-4 w-4 border-2 border-blue-400 border-t-transparent rounded-full" />
                                : <Locate size={16} />
                            }
                        </button>
                    </div>

                    {/* 目的地 */}
                    <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-red-400 z-10">
                            <Navigation size={18} />
                        </div>
                        <input
                            type="text"
                            value={destInput}
                            onChange={(e) => {
                                setDestInput(e.target.value);
                                onDestinationChange(e.target.value);
                            }}
                            placeholder="目的地を入力..."
                            className="input-field pl-9 text-sm w-full"
                        />
                    </div>

                    {/* カテゴリ選択 */}
                    <div>
                        <p className="text-xs text-gray-500 font-semibold mb-1.5">スポットの種類</p>
                        <div className="grid grid-cols-4 gap-1.5">
                            {CATEGORIES.map((cat) => (
                                <button
                                    key={cat.value}
                                    onClick={() => setCategory(cat.value)}
                                    className={`flex flex-col items-center gap-1 p-2 rounded-xl text-xs font-semibold border transition-all duration-200 ${category === cat.value
                                        ? 'bg-[#6366f1] text-white border-[#6366f1] shadow-md shadow-indigo-200'
                                        : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    {cat.icon}
                                    {cat.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 移動手段選択 */}
                    <div>
                        <p className="text-xs text-gray-500 font-semibold mb-1.5">移動手段</p>
                        <div className="flex gap-2">
                            {[
                                { value: 'DRIVE', label: '車', icon: <Car size={16} /> },
                                { value: 'WALK', label: '徒歩', icon: <PersonStanding size={16} /> },
                            ].map((mode) => (
                                <button
                                    key={mode.value}
                                    onClick={() => setTravelMode(mode.value as TravelMode)}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold border transition-all duration-200 ${travelMode === mode.value
                                        ? 'bg-gray-800 text-white border-gray-800 shadow-md'
                                        : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    {mode.icon}
                                    {mode.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 空き時間スライダー */}
                    <div className="pt-1">
                        <div className="flex justify-between items-center mb-1.5">
                            <span className="text-xs font-semibold text-gray-600 flex items-center gap-1">
                                <Clock size={14} /> 空き時間
                            </span>
                            <span className="text-base font-bold text-[#6366f1]">{availableTime} 分</span>
                        </div>
                        <input
                            type="range"
                            min="15"
                            max="180"
                            step="15"
                            value={availableTime}
                            onChange={(e) => setAvailableTime(Number(e.target.value))}
                            className="w-full accent-[#6366f1]"
                        />
                        <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                            <span>15分</span>
                            <span>3時間</span>
                        </div>
                    </div>

                    {/* 検索ボタン / リセットボタン */}
                    {!hasSearched ? (
                        <button
                            onClick={handleSearch}
                            disabled={isLoading}
                            className={`btn-primary w-full flex justify-center items-center gap-2 mt-1 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {isLoading ? (
                                <><div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> 検索中...</>
                            ) : (
                                <><Search size={18} /> 寄り道スポットを検索</>
                            )}
                        </button>
                    ) : (
                        <button onClick={handleClear} className="w-full py-2.5 rounded-xl border-2 border-dashed border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-700 font-semibold transition-colors mt-1 flex items-center justify-center gap-1.5 text-sm">
                            <X size={16} /> 条件をリセット
                        </button>
                    )}
                </div>
            </div>

            {/* --- ローディングスケルトン --- */}
            {isLoading && (
                <div className="glass-panel p-4 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex gap-3 mb-3">
                            <div className="w-12 h-12 rounded-lg bg-gray-200 shrink-0" />
                            <div className="flex-1 space-y-2">
                                <div className="h-3 bg-gray-200 rounded w-3/4" />
                                <div className="h-3 bg-gray-100 rounded w-1/2" />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* --- 選択スポットの詳細 --- */}
            {hasSearched && selectedSpot && detourRoute && !isLoading && (
                <div className="glass-panel border-l-4 border-l-emerald-500 p-5 animate-slide-in shadow-xl">
                    <div className="flex justify-between items-start mb-3">
                        <h3 className="font-bold text-base text-gray-800 leading-tight">{selectedSpot.name}</h3>
                        <button onClick={() => onSpotSelect(null as any)} className="text-gray-400 hover:text-gray-600 ml-2 shrink-0">
                            <X size={16} />
                        </button>
                    </div>

                    <img
                        src={selectedSpot.imageUrl}
                        alt={selectedSpot.name}
                        className="w-full h-28 object-cover rounded-lg mb-3"
                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=400&q=80'; }}
                    />

                    <div className="flex items-center gap-1 text-amber-500 mb-3">
                        <Star size={14} className="fill-current" />
                        <span className="text-sm font-semibold">{selectedSpot.rating.toFixed(1)}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div className="bg-emerald-50 p-3 rounded-xl text-center">
                            <span className="block text-xs text-emerald-600 mb-0.5">滞在可能時間</span>
                            <span className="text-2xl font-bold text-emerald-700">{selectedSpot.recommendedStayTimeMin}</span>
                            <span className="text-xs text-emerald-600"> 分</span>
                        </div>
                        <div className="bg-indigo-50 p-3 rounded-xl text-center">
                            <span className="block text-xs text-indigo-600 mb-0.5">追加移動時間</span>
                            <span className="text-2xl font-bold text-indigo-700">+{selectedSpot.addedTravelTimeMin}</span>
                            <span className="text-xs text-indigo-600"> 分</span>
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2 text-center">目的地には予定通り着きます ✓</p>
                </div>
            )}

            {/* --- 検索結果リスト --- */}
            {hasSearched && !selectedSpot && !isLoading && (
                <div className="glass-panel p-4 animate-slide-in">
                    <h3 className="font-semibold text-xs text-gray-500 uppercase tracking-wider mb-3">
                        条件にあうスポット（{availableSpots.length}件）
                    </h3>
                    {availableSpots.length > 0 ? (
                        <div className="space-y-2">
                            {availableSpots.map(spot => (
                                <div
                                    key={spot.id}
                                    onClick={() => onSpotSelect(spot)}
                                    className="flex gap-3 p-3 rounded-xl hover:bg-indigo-50 transition-colors cursor-pointer border border-transparent hover:border-indigo-100 group"
                                >
                                    <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center shrink-0 group-hover:bg-white transition-colors">
                                        {getSpotIcon(spot.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-sm text-gray-800 truncate">{spot.name}</h4>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-xs text-gray-500 flex items-center gap-0.5">
                                                <Clock size={11} /> +{spot.addedTravelTimeMin}分
                                            </span>
                                            <span className="text-xs text-emerald-600 font-semibold">
                                                滞在{spot.recommendedStayTimeMin}分可
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-0.5 text-amber-500 shrink-0">
                                        <Star size={12} className="fill-current" />
                                        <span className="text-xs font-semibold">{spot.rating.toFixed(1)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-6">
                            <p className="text-sm text-gray-500">条件に合うスポットが見つかりませんでした</p>
                            <p className="text-xs text-gray-400 mt-1">空き時間を増やすか、他の種類をお試しください</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
