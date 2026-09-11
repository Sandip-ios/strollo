export type RoutePoint = { lat: number; lng: number; ts: number };

// Static Maps has a practical URL-length ceiling well under its documented
// max, so a route with hundreds of GPS pings gets thinned to a manageable
// handful before being drawn — plenty for a small "what streets did we
// walk" thumbnail, not meant to be a precise turn-by-turn trace.
const MAX_MAP_POINTS = 60;

function downsample(points: RoutePoint[], max: number): RoutePoint[] {
  if (points.length <= max) return points;
  const step = points.length / max;
  const out: RoutePoint[] = [];
  for (let i = 0; i < max; i++) out.push(points[Math.floor(i * step)]);
  out.push(points[points.length - 1]);
  return out;
}

export function staticMapUrl(points: RoutePoint[], size = "600x300"): string | null {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey || points.length < 2) return null;
  const path = downsample(points, MAX_MAP_POINTS)
    .map((p) => `${p.lat.toFixed(6)},${p.lng.toFixed(6)}`)
    .join("|");
  const params = new URLSearchParams({
    size,
    path: `color:0x243b5aff|weight:4|${path}`,
    key: apiKey,
  });
  return `https://maps.googleapis.com/maps/api/staticmap?${params.toString()}`;
}
