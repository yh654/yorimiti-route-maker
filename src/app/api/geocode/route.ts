import { NextResponse } from 'next/server';

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

// GET /api/geocode?address=上野駅
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    if (!address) {
        return NextResponse.json({ error: 'address is required' }, { status: 400 });
    }

    try {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${API_KEY}&language=ja&region=JP`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.status !== 'OK' || !data.results?.length) {
            return NextResponse.json(
                { error: `Geocoding failed: ${data.status} - ${data.error_message || ''}` },
                { status: 404 }
            );
        }

        const location = data.results[0].geometry.location;
        const formattedAddress = data.results[0].formatted_address;

        return NextResponse.json({ location, formattedAddress });
    } catch (error: any) {
        console.error('[BFF /api/geocode] Error:', error?.message);
        return NextResponse.json({ error: String(error?.message) }, { status: 500 });
    }
}
