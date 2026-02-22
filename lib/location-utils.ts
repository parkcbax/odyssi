import { OpenLocationCode } from 'open-location-code'

export async function parseLocationInput(input: string): Promise<{ lat: number, lng: number } | null> {
    if (!input) return null;

    const trimmedInput = input.trim();

    // 1. Standard Lat, Lng
    if (trimmedInput.includes(',')) {
        const parts = trimmedInput.split(',').map(p => p.trim());
        if (parts.length === 2) {
            const lat = parseFloat(parts[0]);
            const lng = parseFloat(parts[1]);
            if (!isNaN(lat) && !isNaN(lng)) {
                return { lat, lng };
            }
        }
    }

    // 2. Google Plus Code
    try {
        // Remove trailing zip codes or numbers at the end of the string, which nominatim struggles with
        const cleanedInput = trimmedInput.replace(/\s\d{4,5}$/, '');

        // Match the plus code (alphanumeric +) followed by optional spaces/commas, then the locality
        const match = cleanedInput.match(/^([a-zA-Z0-9\+]+)[\s,]*(.*)$/);

        if (match) {
            const codePart = match[1];
            const localityPart = match[2];

            const OLC = typeof OpenLocationCode === 'function' ? new (OpenLocationCode as any)() : OpenLocationCode;

            if (OLC.isValid(codePart)) {
                if (OLC.isFull(codePart)) {
                    const decoded = OLC.decode(codePart);
                    return { lat: decoded.latitudeCenter, lng: decoded.longitudeCenter };
                } else if (OLC.isShort(codePart) && localityPart) {
                    // Short code with locality, let's geocode the locality
                    const localityParts = localityPart.split(',').map(p => p.trim());

                    for (let i = 0; i < localityParts.length; i++) {
                        const searchLocality = localityParts.slice(i).join(', ');
                        if (!searchLocality) continue;

                        const res = await fetch(`/api/geocode?q=${encodeURIComponent(searchLocality)}`);

                        if (res.ok) {
                            const data = await res.json();
                            if (data && data.length > 0) {
                                const refLat = parseFloat(data[0].lat);
                                const refLng = parseFloat(data[0].lon);

                                const recovered = OLC.recoverNearest(codePart, refLat, refLng);
                                const decoded = OLC.decode(recovered);
                                return { lat: decoded.latitudeCenter, lng: decoded.longitudeCenter };
                            }
                        }
                    }
                }
            }
        }
    } catch (e) {
        console.error("Plus Code Error:", e);
    }

    return null;
}
