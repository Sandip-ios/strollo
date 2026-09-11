"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { staticMapUrl, type RoutePoint } from "@/lib/static-map";
import WalkTimeline, { type TimelineEvent } from "@/components/walker/WalkTimeline";
import { WALK_MOODS } from "@/lib/walk-events";

type Photo = { id: string; url: string };

export type WalkDetailData = {
  photos: Photo[];
  pooUpdate: boolean | null;
  peeUpdate: boolean | null;
  walkerNotes: string | null;
  distanceMeters: number | null;
  durationSec: number | null;
  routePath?: RoutePoint[] | null;
  events?: TimelineEvent[];
  startTime?: string | Date | null;
  endTime?: string | Date | null;
  mood?: string | null;
};

export default function WalkDetails({ walk }: { walk: WalkDetailData }) {
  const [open, setOpen] = useState(false);
  const events = walk.events ?? [];

  const hasDetails =
    events.length > 0 ||
    walk.photos.length > 0 ||
    walk.walkerNotes ||
    walk.pooUpdate !== null ||
    walk.peeUpdate !== null ||
    walk.distanceMeters !== null;

  if (!hasDetails) return null;

  const mapUrl = staticMapUrl(walk.routePath ?? []);
  const mood = WALK_MOODS.find((m) => m.value === walk.mood);

  return (
    <div className="border-t border-sand/60 px-5 py-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-xs font-medium text-navy-600"
      >
        {open ? "Hide" : "Show"} walk details
        <ChevronDown className={`h-3.5 w-3.5 transition ${open ? "rotate-180" : ""}`} strokeWidth={2} />
      </button>

      {open && (
        <div className="mt-3 space-y-3 pb-2">
          {mapUrl && (
            <a
              href={mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block overflow-hidden rounded-lg border border-sand"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- external Static Maps image, not a local/optimizable asset */}
              <img src={mapUrl} alt="Walk route map" className="h-40 w-full object-cover sm:h-52" />
            </a>
          )}

          {events.length > 0 ? (
            <WalkTimeline startTime={walk.startTime ?? null} endTime={walk.endTime ?? null} events={events} />
          ) : (
            <>
              {walk.photos.length > 0 && (
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                  {walk.photos.map((photo) => (
                    <a
                      key={photo.id}
                      href={photo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative aspect-square overflow-hidden rounded-lg border border-sand"
                    >
                      <Image src={photo.url} alt="Walk photo" fill className="object-cover" />
                    </a>
                  ))}
                </div>
              )}
              {walk.walkerNotes && (
                <p className="text-xs text-ink/60">
                  <span className="font-medium text-ink/80">Walker notes:</span> {walk.walkerNotes}
                </p>
              )}
            </>
          )}

          <div className="flex flex-wrap gap-2">
            {events.length === 0 && walk.peeUpdate && <Badge label="Pee ✓" />}
            {events.length === 0 && walk.pooUpdate && <Badge label="Poo ✓" />}
            {walk.distanceMeters !== null && (
              <Badge label={`${(walk.distanceMeters / 1000).toFixed(2)} km walked`} />
            )}
            {walk.durationSec !== null && (
              <Badge label={`${Math.round(walk.durationSec / 60)} min`} />
            )}
            {mood && <Badge label={`${mood.emoji} ${mood.label}`} />}
          </div>
        </div>
      )}
    </div>
  );
}

function Badge({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-sand/60 px-2.5 py-0.5 text-xs font-medium text-ink/70">
      {label}
    </span>
  );
}
