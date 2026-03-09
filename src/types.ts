export type SpotType = 'cafe' | 'sightseeing' | 'shop';

export interface Location {
    id: string;
    name: string;
    coordinates: { lat: number; lng: number };
}

export interface DetourSpot extends Location {
    type: SpotType;
    description: string;
    rating: number;
    imageUrl: string;
    addedTravelTimeMin: number;
    recommendedStayTimeMin: number;
}

export interface RouteData {
    baseTravelTimeMin: number;
    origin: Location;
    destination: Location;
    path: { lat: number; lng: number }[];
}

export interface DetourRoute {
    spotId: string;
    totalTravelTimeMin: number;
    path: { lat: number; lng: number }[];
}
