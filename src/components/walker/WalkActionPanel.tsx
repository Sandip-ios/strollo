"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Navigation } from "lucide-react";
import WalkPhotoUpload from "./WalkPhotoUpload";
import { computeRouteDistanceMeters, type RoutePoint } from "@/lib/geo";

type Props = {
  walkId: string;
  status: string;
};

export default function WalkActionPanel({ walkId, status }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [pooUpdate, setPooUpdate] = useState(false);
  const [peeUpdate, setPeeUpdate] = useState(false);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [routePoints, setRoutePoints] = useState<RoutePoint[]>([]);
  const [locationError, setLocationError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);

  // Track the route for the whole time this walk is ON_GOING — starts as
  // soon as this panel renders in that state, stops on unmount/complete.
  // Browser-based tracking only runs while the tab is open and foregrounded;
  // there's no background/native tracking here.
  useEffect(() => {
    if (status !== "ON_GOING") return;
    if (!("geolocation" in navigator)) {
      setLocationError("This device doesn't support location tracking.");
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setLocationError(null);
        const point = { lat: pos.coords.latitude, lng: pos.coords.longitude, ts: Date.now() };
        setRoutePoints((prev) => [...prev, point]);

        // Push each point to the server as it arrives, so the customer's
        // live view isn't stuck showing nothing until the walk finishes —
        // fire-and-forget, a dropped ping just means one gap in the route.
        fetch(`/api/walker/walks/${walkId}/location`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(point),
        }).catch(() => {});
      },
      (err) => {
        setLocationError(
          err.code === err.PERMISSION_DENIED
            ? "Location permission denied — the route won't be recorded for this walk."
            : "Couldn't get your location — the route won't be recorded for this walk."
        );
      },
      { enableHighAccuracy: true, maximumAge: 10000 }
    );

    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, [status]);

  async function handleStart() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/walker/walks/${walkId}/start`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleComplete() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/walker/walks/${walkId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walkerNotes: notes,
          pooUpdate,
          peeUpdate,
          photoUrls,
          routePath: routePoints,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      router.push("/walker");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (status === "COMPLETED") {
    return (
      <div className="rounded-xl border border-sky-200 bg-sky-50 p-5 text-sm text-sky-700">
        This walk is complete.
      </div>
    );
  }

  if (status === "SCHEDULED") {
    return (
      <div className="rounded-xl border border-sand bg-white p-5">
        <button
          onClick={handleStart}
          disabled={loading}
          className="w-full rounded-lg bg-navy-600 px-5 py-3 text-sm font-semibold text-paper transition hover:bg-navy-700 disabled:opacity-50"
        >
          {loading ? "Starting…" : "Start walk"}
        </button>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  // ON_GOING
  const distanceKm = computeRouteDistanceMeters(routePoints) / 1000;

  return (
    <div className="space-y-4 rounded-xl border border-sand bg-white p-5">
      <h3 className="font-display text-base font-semibold text-ink">Complete this walk</h3>

      <div className="flex items-center gap-2 rounded-lg bg-sand/30 px-3 py-2 text-xs text-ink/60">
        <Navigation className="h-3.5 w-3.5 shrink-0 text-navy-500" strokeWidth={1.75} />
        {locationError ? (
          <span>{locationError}</span>
        ) : (
          <span>
            Tracking route — {routePoints.length} point{routePoints.length === 1 ? "" : "s"}
            {routePoints.length > 1 ? ` · ${distanceKm.toFixed(2)} km so far` : ""}
          </span>
        )}
      </div>

      <WalkPhotoUpload value={photoUrls} onChange={setPhotoUrls} />

      <div className="flex gap-2">
        <ToggleChip label="Pee ✓" active={peeUpdate} onClick={() => setPeeUpdate((v) => !v)} />
        <ToggleChip label="Poo ✓" active={pooUpdate} onClick={() => setPooUpdate((v) => !v)} />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink/80">Notes for the owner (optional)</label>
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="How the walk went, anything the owner should know"
          className="w-full rounded-lg border border-sand bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-navy-500 focus:ring-2 focus:ring-navy-200"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        onClick={handleComplete}
        disabled={loading}
        className="w-full rounded-lg bg-navy-600 px-5 py-3 text-sm font-semibold text-paper transition hover:bg-navy-700 disabled:opacity-50"
      >
        {loading ? "Completing…" : "Mark walk complete"}
      </button>
    </div>
  );
}

function ToggleChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
        active ? "border-navy-500 bg-navy-50 text-navy-700" : "border-sand bg-white text-ink/60 hover:border-navy-200"
      }`}
    >
      {label}
    </button>
  );
}
