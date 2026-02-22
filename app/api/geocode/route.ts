import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');

    if (!q) {
        return NextResponse.json({ error: 'Missing query parameter' }, { status: 400 });
    }

    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`, {
            headers: {
                'User-Agent': 'OdyssiApp/1.0',
                'Accept-Language': 'en-US,en;q=0.9'
            }
        });

        if (!res.ok) {
            return NextResponse.json({ error: 'Upstream Nominatim error' }, { status: res.status });
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Nominatim fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch from Nominatim' }, { status: 500 });
    }
}
