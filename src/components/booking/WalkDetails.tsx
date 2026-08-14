"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronDown } from "lucide-react";

type Photo = { id: string; url: string };

export type WalkDetailData = {
  photos: Photo[];
  pooUpdate: boolean | null;
  peeUpdate: boolean | null;
  walkerNotes: string | null;
  distanceMeters: number | null;
  durationSec: number | null;
};

export default function WalkDetails({ walk }: { walk: WalkDetailData }) {
  const [open, setOpen] = useState(false);

  const hasDetails =
    walk.photos.length > 0 ||
    walk.walkerNotes ||
    walk.pooUpdate !== null ||
    walk.peeUpdate !== null ||
    walk.distanceMeters !== null;

  if (!hasDetails) return null;

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

          <div className="flex flex-wrap gap-2">
            {walk.peeUpdate && <Badge label="Pee ✓" />}
            {walk.pooUpdate && <Badge label="Poo ✓" />}
            {walk.distanceMeters !== null && (
              <Badge label={`${(walk.distanceMeters / 1000).toFixed(2)} km walked`} />
            )}
            {walk.durationSec !== null && (
              <Badge label={`${Math.round(walk.durationSec / 60)} min`} />
            )}
          </div>

          {walk.walkerNotes && (
            <p className="text-xs text-ink/60">
              <span className="font-medium text-ink/80">Walker notes:</span> {walk.walkerNotes}
            </p>
          )}
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
