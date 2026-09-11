"use client";

import { useEffect, useState } from "react";
import { Navigation } from "lucide-react";
import { computeRouteDistanceMeters } from "@/lib/geo";
import { staticMapUrl } from "@/lib/static-map";

type LivePoint = { lat: number; lng: number; ts: number };

type LiveData = {
  status: string;
  startTime: string | null;
  pointCount: number;
  lastPoint: LivePoint | null;
  routePath: LivePoint[];
};

function elapsedLabel(startTime: string | null): string {
  if (!startTime) return "";
  const mins = Math.max(0, Math.round((Date.now() - new Date(startTime).getTime()) / 60000));
  return mins < 1 ? "just started" : `${mins} min in`;
}

export default function LiveWalkStatus({ bookingId, walkId }: { bookingId: string; walkId: string }) {
  const [data, setData] = useState<LiveData | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      try {
        const res = await fetch(`/api/bookings/${bookingId}/walks/${walkId}/live`);
        if (!res.ok || cancelled) return;
        const json = await res.json();
        if (!cancelled) setData(json);
      } catch {
        // Transient network hiccup — the next poll will just try again.
      }
    }
    poll();
    const interval = setInterval(poll, 10000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [bookingId, walkId]);

  if (!data || data.status !== "ON_GOING") return null;

  const mapsUrl = data.lastPoint
    ? `https://maps.google.com/?q=${data.lastPoint.lat},${data.lastPoint.lng}`
    : null;
  const mapImageUrl = staticMapUrl(data.routePath);
  const distanceKm = computeRouteDistanceMeters(data.routePath) / 1000;

  return (
    <div className="mb-6 overflow-hidden rounded-xl border border-navy-200 bg-navy-50">
      <div className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-navy-600" />
            <p className="text-sm font-semibold text-navy-800">Walk in progress — {elapsedLabel(data.startTime)}</p>
          </div>
          {data.pointCount > 1 && (
            <span className="text-xs font-bold text-navy-700">{distanceKm.toFixed(2)} km so far</span>
          )}
        </div>
        {data.lastPoint ? (
          <p className="mt-1 text-xs text-navy-700">
            Last location update {Math.max(0, Math.round((Date.now() - data.lastPoint.ts) / 60000))} min ago
          </p>
        ) : (
          <p className="mt-1 text-xs text-navy-700">Waiting for the first location update from your walker.</p>
        )}
      </div>

      {mapImageUrl && mapsUrl && (
        <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="block border-t border-navy-200">
          {/* eslint-disable-next-line @next/next/no-img-element -- external Static Maps image, refreshed on each poll */}
          <img src={mapImageUrl} alt="Live walk route map" className="h-40 w-full object-cover sm:h-48" />
          <span className="flex items-center justify-center gap-1 bg-white py-2 text-xs font-medium text-navy-700">
            <Navigation className="h-3 w-3" strokeWidth={2} />
            Open live location in Google Maps
          </span>
        </a>
      )}
    </div>
  );
}
