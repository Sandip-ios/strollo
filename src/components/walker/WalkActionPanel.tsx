"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Navigation, CalendarDays, MapIcon, Plus } from "lucide-react";
import AddEventModal from "./AddEventModal";
import WalkTimeline, { type TimelineEvent } from "./WalkTimeline";
import { computeRouteDistanceMeters, type RoutePoint } from "@/lib/geo";
import { staticMapUrl } from "@/lib/static-map";
import { WALK_MOODS, type WalkEventTypeValue } from "@/lib/walk-events";
import { startNavProgress } from "@/lib/nav-progress";

type Props = {
  walkId: string;
  status: string;
  startTime: string | null;
  endTime: string | null;
  initialEvents: TimelineEvent[];
  initialRoutePath: RoutePoint[];
};

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

function stopwatchLabel(startTime: string | null): string {
  if (!startTime) return "00:00:00";
  const totalSec = Math.max(0, Math.floor((Date.now() - new Date(startTime).getTime()) / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export default function WalkActionPanel({ walkId, status, startTime, endTime, initialEvents, initialRoutePath }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"timeline" | "map">("timeline");
  const [events, setEvents] = useState<TimelineEvent[]>(initialEvents);
  const [addingEvent, setAddingEvent] = useState(false);
  const [mood, setMood] = useState<(typeof WALK_MOODS)[number]["value"] | null>(null);
  const [, tick] = useState(0);

  const [routePoints, setRoutePoints] = useState<RoutePoint[]>(initialRoutePath);
  const [locationError, setLocationError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);

  // Live stopwatch — re-render once a second while the walk is ON_GOING.
  useEffect(() => {
    if (status !== "ON_GOING") return;
    const interval = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(interval);
  }, [status]);

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
    // Geolocation only works on a secure origin (https, or plain localhost)
    // — a phone hitting the dev server over a LAN IP (http://192.168.x.x)
    // will otherwise fail here with no useful browser error at all.
    if (!window.isSecureContext) {
      setLocationError(
        "Location tracking needs a secure (https) connection — it won't work over a plain http:// address on this device."
      );
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
            ? "Location permission denied — enable location access for this site to record the route."
            : "Couldn't get your location — the route won't be recorded for this walk."
        );
      },
      // maximumAge: 0 forces a fresh GPS fix on every update instead of
      // reusing a stale cached one — this is what makes it "live" tracking
      // rather than a periodic snapshot.
      { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 }
    );

    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, [status, walkId]);

  async function handleStart() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/walker/walks/${walkId}/start`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        setLoading(false);
        return;
      }
      startNavProgress();
      router.refresh();
    } catch {
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
        body: JSON.stringify({ mood, routePath: routePoints }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        setLoading(false);
        return;
      }
      // Loading stays true (button stays disabled) through the redirect —
      // clearing it here would briefly re-enable "Complete walk" while
      // navigation is still in flight.
      startNavProgress();
      router.push("/walker");
      router.refresh();
    } catch {
      setLoading(false);
    }
  }

  function handleEventSaved(event: { id: string; type: WalkEventTypeValue; note: string | null; photoUrl: string | null; occurredAt: string }) {
    setEvents((prev) => [...prev, event]);
    setAddingEvent(false);
  }

  if (status === "SCHEDULED") {
    return (
      <div className="rounded-xl border border-navy-200 bg-navy-50 p-6 text-center">
        <h3 className="font-display text-lg font-bold text-ink">Ready to start the walk?</h3>
        <p className="mt-1 text-sm text-ink/60">Tracking will begin as soon as you tap start.</p>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <button
          onClick={handleStart}
          disabled={loading}
          className="mt-5 w-full rounded-lg bg-navy-600 px-5 py-3 text-sm font-semibold text-paper transition hover:bg-navy-700 disabled:opacity-50"
        >
          {loading ? "Starting…" : "Start walk"}
        </button>
      </div>
    );
  }

  if (status === "COMPLETED") {
    return (
      <div className="rounded-xl border border-sand bg-white p-5">
        <TabBar tab={tab} setTab={setTab} />
        {tab === "timeline" ? (
          <WalkTimeline startTime={startTime} endTime={endTime} events={events} />
        ) : (
          <RouteMap points={routePoints} />
        )}
      </div>
    );
  }

  // ON_GOING
  const distanceKm = computeRouteDistanceMeters(routePoints) / 1000;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-sand bg-white p-5 text-center">
        <div className="flex items-center justify-center gap-1.5 text-sm font-medium text-emerald-700">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
          Live tracking on
        </div>
        <p className="mt-1 font-display text-3xl font-extrabold tabular-nums text-ink">
          {stopwatchLabel(startTime)}
        </p>
        <div className="mt-3 flex justify-center gap-6 text-sm">
          <div>
            <p className="font-display text-base font-bold text-ink">{events.length}</p>
            <p className="text-[11px] text-ink/40">Events</p>
          </div>
          <div>
            <p className="font-display text-base font-bold text-ink">{distanceKm.toFixed(2)} km</p>
            <p className="text-[11px] text-ink/40">Distance</p>
          </div>
        </div>
        {locationError && <p className="mt-2 text-xs text-red-600">{locationError}</p>}
      </div>

      <div className="rounded-xl border border-sand bg-white p-5">
        <TabBar tab={tab} setTab={setTab} />
        {tab === "timeline" ? (
          <WalkTimeline startTime={startTime} endTime={null} events={events} />
        ) : (
          <RouteMap points={routePoints} />
        )}

        <button
          onClick={() => setAddingEvent(true)}
          className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg border border-navy-200 px-4 py-2.5 text-sm font-semibold text-navy-600 transition hover:bg-navy-50"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          Add event
        </button>
      </div>

      <div className="rounded-xl border border-sand bg-white p-5">
        <p className="mb-2 text-sm font-medium text-ink/80">How was the walk? (optional)</p>
        <div className="flex justify-center gap-2">
          {WALK_MOODS.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => setMood(mood === m.value ? null : m.value)}
              className={`flex flex-1 flex-col items-center gap-1 rounded-xl border px-3 py-2.5 transition ${
                mood === m.value ? "border-navy-500 bg-navy-50 ring-1 ring-navy-300" : "border-sand hover:border-navy-200"
              }`}
            >
              <span className="text-xl">{m.emoji}</span>
              <span className="text-[10px] font-medium text-ink/60">{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        onClick={handleComplete}
        disabled={loading}
        className="w-full rounded-lg bg-navy-600 px-5 py-3 text-sm font-semibold text-paper transition hover:bg-navy-700 disabled:opacity-50"
      >
        {loading ? "Completing…" : "Complete walk"}
      </button>

      {addingEvent && (
        <AddEventModal walkId={walkId} onClose={() => setAddingEvent(false)} onSaved={handleEventSaved} />
      )}
    </div>
  );
}

function TabBar({
  tab,
  setTab,
}: {
  tab: "timeline" | "map";
  setTab: (t: "timeline" | "map") => void;
}) {
  return (
    <div className="mb-4 flex gap-2">
      <button
        onClick={() => setTab("timeline")}
        className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition ${
          tab === "timeline" ? "bg-navy-600 text-paper" : "bg-sand/40 text-ink/60"
        }`}
      >
        <CalendarDays className="h-4 w-4" strokeWidth={2} />
        Timeline
      </button>
      <button
        onClick={() => setTab("map")}
        className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition ${
          tab === "map" ? "bg-navy-600 text-paper" : "bg-sand/40 text-ink/60"
        }`}
      >
        <MapIcon className="h-4 w-4" strokeWidth={2} />
        Map
      </button>
    </div>
  );
}

function RouteMap({ points }: { points: RoutePoint[] }) {
  const url = staticMapUrl(points);
  if (!url) {
    return (
      <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-sand text-center text-xs text-ink/50">
        {points.length === 0
          ? "The route map will appear here once location tracking starts."
          : "Not enough points yet to draw a map."}
      </div>
    );
  }
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-lg border border-sand">
      <div className="flex items-center gap-1.5 border-b border-sand bg-sand/20 px-3 py-1.5 text-xs text-ink/60">
        <Navigation className="h-3 w-3 text-navy-500" strokeWidth={2} />
        {points.length} point{points.length === 1 ? "" : "s"}
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element -- external Static Maps image, not a local/optimizable asset */}
      <img src={url} alt="Walk route map" className="h-48 w-full object-cover" />
    </a>
  );
}
