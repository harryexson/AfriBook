export interface DecodedPoint {
  latitude: number;
  longitude: number;
}

/**
 * Decodes a Google-style encoded polyline string (precision 1e5) into an array
 * of latitude/longitude points. Matches the encoding used by the AfriBook web
 * route engine (src/lib/ridely/route-engine.ts) for ride route polylines.
 */
export function decodePolyline(encoded: string): DecodedPoint[] {
  const points: DecodedPoint[] = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let result = 0;
    let shift = 0;
    let byte: number;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    result = 0;
    shift = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }

  return points;
}
