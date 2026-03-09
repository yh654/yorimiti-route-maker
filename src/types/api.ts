export interface SearchRequest {
    origin: { lat: number; lng: number };
    destination: { lat: number; lng: number };
    availableTimeMin: number;
    category?: string;
    travelMode?: 'DRIVE' | 'WALK';
}

export interface DetourCandidate {
    spotInfo: {
        placeId: string;
        name: string;
        location: { lat: number; lng: number };
        type: string;
        rating: number;
        photoUrl: string;
    };
    timeCalculation: {
        addedTravelTimeMin: number;
        availableStayTimeMin: number;
        totalTravelTimeMin: number;
    };
    routeGeometry: {
        path: { lat: number; lng: number }[];
    };
}

export interface DetourSearchResponse {
    baseRoute: {
        travelTimeMin: number;
        path: { lat: number; lng: number }[];
    };
    candidates: DetourCandidate[];
}
