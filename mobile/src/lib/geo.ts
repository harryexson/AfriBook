// ─── Mobile Geocoding ──────────────────────────────────────────
// Mirrors web's `src/lib/geo.ts` geocodeAddress — mobile had no forward-
// geocoding utility at all, which is why the ride screen was sending a
// fake destination (pickup + a fixed offset) to the real /api/ridely/rides
// endpoint regardless of what the rider actually typed.
// ──────────────────────────────────────────────────────────────

export async function geocodeAddress(
  query: string,
  countryCode?: string,
): Promise<{ latitude: number; longitude: number; displayName: string } | null> {
  const trimmed = query.trim();
  if (!trimmed) return null;
  try {
    const params = new URLSearchParams({ format: 'json', q: trimmed, limit: '1', addressdetails: '0' });
    if (countryCode) params.set('countrycodes', countryCode.toLowerCase());

    const res = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
      headers: { 'Accept-Language': 'en' },
    });
    if (!res.ok) return null;
    const results = await res.json();
    const first = Array.isArray(results) ? results[0] : null;
    if (!first) return null;

    return {
      latitude: parseFloat(first.lat),
      longitude: parseFloat(first.lon),
      displayName: first.display_name ?? trimmed,
    };
  } catch {
    return null;
  }
}
