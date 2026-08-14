"use client";

import { useEffect, useState } from "react";
import { Navigation } from "lucide-react";

type LivePoint = { lat: number; lng: number; ts: number };

type LiveData = {
  status: string;
  startTime: string | null;
  pointCount: number;
  lastPoint: LivePoint | null;
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
    const interval = setInterval(poll, 15000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [bookingId, walkId]);

  if (!data || data.status !== "ON_GOING") return null;

  const mapsUrl = data.lastPoint
    ? `https://maps.google.com/?q=${data.lastPoint.lat},${data.lastPoint.lng}`
    : null;

  return (
    <div className="mb-6 rounded-xl border border-navy-200 bg-navy-50 p-5">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 animate-pulse rounded-full bg-navy-600" />
        <p className="text-sm font-semibold text-navy-800">Walk in progress — {elapsedLabel(data.startTime)}</p>
      </div>
      {data.lastPoint ? (
        <>
          <p className="mt-1 text-xs text-navy-700">
            Last location update {Math.max(0, Math.round((Date.now() - data.lastPoint.ts) / 60000))} min ago
          </p>
          {mapsUrl && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-navy-700 underline underline-offset-2"
            >
              <Navigation className="h-3 w-3" strokeWidth={2} />
              View current location on map
            </a>
          )}
        </>
      ) : (
        <p className="mt-1 text-xs text-navy-700">
          Waiting for the first location update from your walker.
        </p>
      )}
    </div>
  );
}
