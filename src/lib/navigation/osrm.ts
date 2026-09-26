// Turn-by-turn routing via OSRM's free public demo server — no API key,
// matches the keyless-maps pattern already used elsewhere in this app
// (MapEmbed's OSM iframe). The public demo server is rate-limited and not
// meant for heavy production traffic; if usage grows, point OSRM_BASE_URL
// at a self-hosted OSRM instance instead (same request/response shape).

const OSRM_BASE_URL = process.env.NEXT_PUBLIC_OSRM_BASE_URL ?? 'https://router.project-osrm.org';

export interface LatLng {
  lat: number;
  lng: number;
}

export type ManeuverType =
  | 'turn' | 'new name' | 'depart' | 'arrive' | 'merge' | 'ramp' | 'on ramp'
  | 'off ramp' | 'fork' | 'end of road' | 'continue' | 'roundabout'
  | 'rotary' | 'roundabout turn' | 'notification' | 'exit roundabout' | 'exit rotary';

export interface NavigationStep {
  instruction: string;
  maneuverType: ManeuverType;
  modifier: string | null;
  distanceMeters: number;
  durationSec: number;
  location: LatLng;
  streetName: string;
}

export interface NavigationRoute {
  steps: NavigationStep[];
  distanceMeters: number;
  durationSec: number;
  /** [lat, lng] pairs for drawing the route line. */
  polyline: [number, number][];
}

const MODIFIER_PHRASE: Record<string, string> = {
  uturn: 'make a U-turn',
  'sharp right': 'turn sharp right',
  right: 'turn right',
  'slight right': 'bear right',
  straight: 'continue straight',
  'slight left': 'bear left',
  left: 'turn left',
  'sharp left': 'turn sharp left',
};

/** Builds the spoken instruction OSRM doesn't give us directly (it gives structured maneuver data, not prose). */
function speakableInstruction(type: ManeuverType, modifier: string | null, streetName: string): string {
  const onto = streetName ? ` onto ${streetName}` : '';
  switch (type) {
    case 'depart':
      return `Head ${modifier ?? 'out'}${onto}`;
    case 'arrive':
      return 'You have arrived at your destination';
    case 'roundabout':
    case 'rotary':
      return `Enter the roundabout${onto}`;
    case 'exit roundabout':
    case 'exit rotary':
      return `Exit the roundabout${onto}`;
    case 'fork':
      return `Keep ${modifier ?? 'straight'} at the fork${onto}`;
    case 'merge':
      return `Merge${onto}`;
    case 'end of road':
      return `${modifier ? MODIFIER_PHRASE[modifier] ?? `turn ${modifier}` : 'Continue'}${onto}`;
    case 'continue':
    case 'new name':
      return `Continue${onto}`;
    default: {
      const phrase = modifier ? MODIFIER_PHRASE[modifier] ?? `turn ${modifier}` : 'Continue';
      return `${phrase}${onto}`;
    }
  }
}

/**
 * Fetches a driving route with turn-by-turn steps between two points.
 * Throws on network/API failure — callers should catch and fall back to
 * showing the destination address only (no voice guidance) rather than
 * silently showing a broken route.
 */
export async function fetchDrivingRoute(origin: LatLng, destination: LatLng): Promise<NavigationRoute> {
  const coords = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;
  const url = `${OSRM_BASE_URL}/route/v1/driving/${coords}?steps=true&geometries=geojson&overview=full`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`OSRM routing failed: ${res.status}`);
  }
  const body = await res.json();
  if (body.code !== 'Ok' || !body.routes?.[0]) {
    throw new Error(`OSRM returned no route: ${body.code ?? 'unknown error'}`);
  }

  const route = body.routes[0];
  const leg = route.legs[0];

  const steps: NavigationStep[] = (leg?.steps ?? []).map((s: any) => {
    const maneuverType = s.maneuver?.type as ManeuverType;
    const modifier = (s.maneuver?.modifier as string | undefined) ?? null;
    const streetName = s.name ?? '';
    return {
      instruction: speakableInstruction(maneuverType, modifier, streetName),
      maneuverType,
      modifier,
      distanceMeters: s.distance ?? 0,
      durationSec: s.duration ?? 0,
      location: { lat: s.maneuver.location[1], lng: s.maneuver.location[0] },
      streetName,
    };
  });

  const polyline: [number, number][] = (route.geometry?.coordinates ?? []).map(
    ([lng, lat]: [number, number]) => [lat, lng],
  );

  return {
    steps,
    distanceMeters: route.distance ?? 0,
    durationSec: route.duration ?? 0,
    polyline,
  };
}

/** Haversine distance in meters — used to detect when the driver has reached the next maneuver point. */
export function distanceMeters(a: LatLng, b: LatLng): number {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}
