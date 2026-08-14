"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Walker = { id: string; name: string; mobileNumber: string; area: string };

type Props = {
  bookingId: string;
  currentWalkerId: string | null;
  walkers: Walker[];
};

export default function AssignWalkerPanel({ bookingId, currentWalkerId, walkers }: Props) {
  const router = useRouter();
  const [walkerId, setWalkerId] = useState(currentWalkerId ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAssign() {
    setError(null);
    if (!walkerId) {
      setError("Select a walker");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walkerId }),
      });
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

  if (walkers.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-sand bg-white/60 p-5 text-sm text-ink/60">
        No active walkers yet.{" "}
        <a href="/admin/walkers" className="font-medium text-navy-600 underline underline-offset-2">
          Add one first
        </a>
        .
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-sand bg-white p-5">
      <h3 className="mb-3 font-display text-base font-semibold text-ink">
        {currentWalkerId ? "Reassign walker" : "Assign a walker"}
      </h3>
      <div className="flex flex-col gap-3 sm:flex-row">
        <select
          value={walkerId}
          onChange={(e) => setWalkerId(e.target.value)}
          className="flex-1 rounded-lg border border-sand bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-navy-500 focus:ring-2 focus:ring-navy-200"
        >
          <option value="">Select a walker…</option>
          {walkers.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name} — {w.mobileNumber} ({w.area})
            </option>
          ))}
        </select>
        <button
          onClick={handleAssign}
          disabled={loading}
          className="rounded-lg bg-navy-600 px-5 py-2.5 text-sm font-semibold text-paper transition hover:bg-navy-700 disabled:opacity-50"
        >
          {loading ? "Saving…" : currentWalkerId ? "Reassign" : "Assign"}
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
