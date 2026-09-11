"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PawPrint, ArrowRight } from "lucide-react";

type Props = {
  walkId: string;
  startTime: string | null;
  dogNames: string[];
  customerName: string;
  area: string;
};

function elapsedLabel(startTime: string | null): string {
  if (!startTime) return "just started";
  const mins = Math.max(0, Math.round((Date.now() - new Date(startTime).getTime()) / 60000));
  return mins < 1 ? "just started" : `${mins} min in`;
}

// The walker's main screen leads with whichever walk is ON_GOING right
// now, if any — so they always know at a glance what they're doing
// without hunting through the list below. Tapping through to the walk's
// own page is where the actual timeline (photos, pee/poo, notes,
// complete) gets added — not duplicated here, so there's only ever one
// GPS watcher running for a given walk.
export default function CurrentWalkCard({ walkId, startTime, dogNames, customerName, area }: Props) {
  const [, forceTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => forceTick((n) => n + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Link
      href={`/walker/walks/${walkId}`}
      className="relative block overflow-hidden rounded-2xl bg-navy-800 p-6 text-white transition hover:bg-navy-700"
    >
      <PawPrint className="pointer-events-none absolute -bottom-4 -right-4 h-24 w-24 text-white/[0.06]" />
      <div className="relative flex items-center gap-2 text-sm font-medium text-white/70">
        <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
        Walk in progress — {elapsedLabel(startTime)}
      </div>
      <p className="relative mt-2 font-display text-2xl font-bold">{dogNames.join(", ")}</p>
      <p className="relative mt-1 text-sm text-white/60">
        {customerName} · {area}
      </p>
      <span className="relative mt-4 inline-flex items-center gap-1.5 rounded-lg bg-white px-4 py-2.5 text-sm font-bold text-navy-800">
        Continue walk
        <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
      </span>
    </Link>
  );
}
