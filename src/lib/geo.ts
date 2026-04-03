/**
 * Appwrite stores points as [longitude, latitude].
 * Leaflet uses [latitude, longitude].
 */

/** Convert Appwrite [lng, lat] to Leaflet [lat, lng] */
export function toLeaflet(point: [number, number]): [number, number] {
  return [point[1], point[0]];
}

/** Convert Leaflet [lat, lng] to Appwrite [lng, lat] */
export function toAppwrite(point: [number, number]): [number, number] {
  return [point[1], point[0]];
}

/** Haversine distance in meters between two Appwrite [lng, lat] points */
export function haversine(
  a: [number, number],
  b: [number, number]
): number {
  const R = 6_371_000; // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(b[1] - a[1]);
  const dLng = toRad(b[0] - a[0]);

  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);

  const h =
    sinLat * sinLat +
    Math.cos(toRad(a[1])) * Math.cos(toRad(b[1])) * sinLng * sinLng;

  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Check if two Appwrite [lng, lat] points are within a given radius (meters) */
export function isWithinRadius(
  a: [number, number],
  b: [number, number],
  meters: number
): boolean {
  return haversine(a, b) <= meters;
}

/** Reverse geocode a Leaflet [lat, lng] coordinate to an address string */
let lastGeocode = 0;
export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<string> {
  // Rate limit: max 1 req/s
  const now = Date.now();
  const wait = Math.max(0, 1000 - (now - lastGeocode));
  if (wait > 0) {
    await new Promise((r) => setTimeout(r, wait));
  }
  lastGeocode = Date.now();

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      {
        headers: {
          'User-Agent': 'UberCloneDemo/1.0',
        },
      }
    );
    const data = await res.json();
    return (
      data.display_name ||
      `${lat.toFixed(4)}, ${lng.toFixed(4)}`
    );
  } catch {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
}
