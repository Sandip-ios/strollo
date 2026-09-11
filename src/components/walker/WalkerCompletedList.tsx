"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, MapPinned, CheckCircle2 } from "lucide-react";
import { formatDate } from "@/lib/format-date";

type Walk = {
  id: string;
  scheduledDate: Date;
  durationSec: number | null;
  eventCount: number;
  booking: {
    customer: { name: string | null; mobileNumber: string };
    address: { city: string; serviceArea: { name: string } | null };
    bookingDogs: { dog: { name: string } }[];
  };
};

function durationLabel(sec: number | null) {
  if (sec === null) return "—";
  const h = Math.floor(sec / 3600);
  const m = Math.round((sec % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function areaOf(walk: Walk): string {
  return walk.booking.address.serviceArea?.name ?? walk.booking.address.city;
}

export default function WalkerCompletedList({ walks }: { walks: Walk[] }) {
  const [groupBy, setGroupBy] = useState<"day" | "area">("day");

  const groups = useMemo(() => {
    const map = new Map<string, Walk[]>();
    const sorted = [...walks].sort((a, b) => b.scheduledDate.getTime() - a.scheduledDate.getTime());
    for (const w of sorted) {
      const key = groupBy === "day" ? formatDate(w.scheduledDate) : areaOf(w);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(w);
    }
    const entries = Array.from(map.entries());
    if (groupBy === "area") entries.sort((a, b) => a[0].localeCompare(b[0]));
    return entries;
  }, [walks, groupBy]);

  if (walks.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-sand bg-white/60 p-10 text-center">
        <p className="text-sm text-ink/60">No completed walks yet.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <ToggleButton active={groupBy === "day"} onClick={() => setGroupBy("day")} icon={CalendarDays} label="By day" />
        <ToggleButton active={groupBy === "area"} onClick={() => setGroupBy("area")} icon={MapPinned} label="By area" />
      </div>

      <div className="space-y-8">
        {groups.map(([label, groupWalks]) => (
          <section key={label}>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-navy-600">
              {label} <span className="text-ink/40">· {groupWalks.length} walk{groupWalks.length === 1 ? "" : "s"} completed</span>
            </h2>
            <div className="space-y-3">
              {groupWalks.map((w) => (
                <Link
                  key={w.id}
                  href={`/walker/walks/${w.id}`}
                  className="block rounded-xl border border-sand bg-white p-5 transition hover:border-navy-300 hover:shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-ink">
                        {w.booking.bookingDogs.map((bd) => bd.dog.name).join(", ")}
                      </p>
                      <p className="text-xs text-ink/50">
                        {w.booking.customer.name ?? w.booking.customer.mobileNumber}
                      </p>
                    </div>
                    <span className="flex items-center gap-1 rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-medium text-sky-700">
                      <CheckCircle2 className="h-3 w-3" strokeWidth={2.5} />
                      Completed
                    </span>
                  </div>
                  {groupBy === "area" && (
                    <p className="mt-1 text-xs text-ink/40">{formatDate(w.scheduledDate)}</p>
                  )}
                  <div className="mt-3 flex gap-5 text-xs text-ink/50">
                    <span>
                      Duration <span className="font-semibold text-ink">{durationLabel(w.durationSec)}</span>
                    </span>
                    <span>
                      Events <span className="font-semibold text-ink">{w.eventCount}</span>
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function ToggleButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof CalendarDays;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
        active ? "border-navy-500 bg-navy-50 text-navy-700" : "border-sand bg-white text-ink/50 hover:border-navy-200"
      }`}
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={2} />
      {label}
    </button>
  );
}
