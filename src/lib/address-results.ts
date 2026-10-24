export interface AddressResult {
  latitude: number; longitude: number; displayName: string;
  countryCode: string; city: string; state: string;
}

export function photonResults(body: { features?: unknown[] }): AddressResult[] {
  return (body.features ?? []).flatMap((raw: any) => {
    const [longitude, latitude] = raw?.geometry?.coordinates ?? [];
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return [];
    const p = raw.properties ?? {};
    const street = [p.housenumber, p.street].filter(Boolean).join(' ');
    const parts = [...new Set([p.name, street, p.city || p.town || p.village, p.state, p.country].filter(Boolean))];
    if (!parts.length) return [];
    return [{ latitude, longitude, displayName: parts.join(', '), countryCode: (p.countrycode || '').toUpperCase(), city: p.city || p.town || p.village || '', state: p.state || '' }];
  });
}
