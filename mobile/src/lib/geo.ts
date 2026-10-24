import { api } from './api';
export async function geocodeAddress(query: string, countryCode?: string): Promise<{ latitude: number; longitude: number; displayName: string } | null> {
  if (query.trim().length < 3) return null;
  const body = await api.get<{ data: { latitude: number; longitude: number; displayName: string }[] }>('/api/geo?' + new URLSearchParams({ q: query.trim(), ...(countryCode ? { country: countryCode } : {}) }));
  return body.data[0] ?? null;
}
