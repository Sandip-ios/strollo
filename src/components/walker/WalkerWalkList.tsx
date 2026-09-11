"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, MapPinned } from "lucide-react";
import { WALK_SLOTS } from "@/lib/constants";
import { formatDate } from "@/lib/format-date";

type Walk = {
  id: string;
  scheduledDate: Date;
  status: string;
  booking: {
    slot: string;
    customer: { name: string | null; mobileNumber: string };
    address: { label: string; houseNumber: string; line1: string; city: string; serviceArea: { name: string } | null };
    bookingDogs: { dog: { name: string } }[];
  };
};

const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: "Not started",
  ON_GOING: "In progress",
};

const STATUS_TONES: Record<string, string> = {
  SCHEDULED: "bg-sand/60 text-ink/60",
  ON_GOING: "bg-navy-100 text-navy-700",
};

function dayLabel(d: Date): string {
  const today = new Date();
  const date = new Date(d);
  const startOfDay = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diffDays = Math.round((startOfDay(date) - startOfDay(today)) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  return formatDate(d);
}

function areaOf(walk: Walk): string {
  return walk.booking.address.serviceArea?.name ?? walk.booking.address.city;
}

export default function WalkerWalkList({ walks }: { walks: Walk[] }) {
  const [groupBy, setGroupBy] = useState<"day" | "area">("day");

  const groups = useMemo(() => {
    const map = new Map<string, Walk[]>();
    const sorted = [...walks].sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime());
    for (const w of sorted) {
      const key = groupBy === "day" ? dayLabel(w.scheduledDate) : areaOf(w);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(w);
    }
    // Area grouping has no natural chronological key, so sort those groups
    // alphabetically instead of relying on Map insertion order.
    const entries = Array.from(map.entries());
    if (groupBy === "area") entries.sort((a, b) => a[0].localeCompare(b[0]));
    return entries;
  }, [walks, groupBy]);

  if (walks.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-sand bg-white/60 p-10 text-center">
        <p className="text-sm text-ink/60">No walks assigned right now.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <ToggleButton
          active={groupBy === "day"}
          onClick={() => setGroupBy("day")}
          icon={CalendarDays}
          label="By day"
        />
        <ToggleButton
          active={groupBy === "area"}
          onClick={() => setGroupBy("area")}
          icon={MapPinned}
          label="By area"
        />
      </div>

      <div className="space-y-8">
        {groups.map(([label, groupWalks]) => (
          <section key={label}>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-navy-600">{label}</h2>
            <div className="space-y-3">
              {groupWalks.map((w) => (
                <WalkCard key={w.id} walk={w} showDate={groupBy === "area"} />
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

function WalkCard({ walk, showDate }: { walk: Walk; showDate: boolean }) {
  const slotLabel = WALK_SLOTS.find((s) => s.value === walk.booking.slot);
  return (
    <Link
      href={`/walker/walks/${walk.id}`}
      className="block rounded-xl border border-sand bg-white p-5 transition hover:border-navy-300 hover:shadow-sm"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-ink">
            {walk.booking.bookingDogs.map((bd) => bd.dog.name).join(", ")}
          </p>
          <p className="text-xs text-ink/50">
            {walk.booking.customer.name ?? walk.booking.customer.mobileNumber}
          </p>
        </div>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_TONES[walk.status]}`}>
          {STATUS_LABELS[walk.status]}
        </span>
      </div>
      <p className="mt-2 text-xs text-ink/60">
        {showDate ? `${formatDate(walk.scheduledDate)} · ` : ""}
        {slotLabel?.label} ({slotLabel?.time})
      </p>
      <p className="mt-1 text-xs text-ink/50">
        {walk.booking.address.houseNumber}, {walk.booking.address.label} — {walk.booking.address.line1},{" "}
        {areaOf(walk)}
      </p>
    </Link>
  );
}
