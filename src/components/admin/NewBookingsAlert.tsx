"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PawPrint } from "lucide-react";

type Walker = { id: string; name: string; mobileNumber: string; area: string };

type BookingRow = {
  id: string;
  customerName: string;
  planName: string;
  dogNames: string[];
};

type Props = {
  initialBookings: BookingRow[];
  walkers: Walker[];
};

// The admin dashboard's "new booking arrived" alert — each row can be
// instantly approved-and-assigned to a walker in one click (the assign
// API accepts a CONFIRMED booking directly), or skipped for now, which
// just hides it from this session's list without changing anything —
// it'll still show up under Bookings, and reappear here on next load.
export default function NewBookingsAlert({ initialBookings, walkers }: Props) {
  const router = useRouter();
  const [bookings, setBookings] = useState(initialBookings);
  const [walkerChoice, setWalkerChoice] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function skip(id: string) {
    setBookings((prev) => prev.filter((b) => b.id !== id));
  }

  async function assign(id: string) {
    const walkerId = walkerChoice[id];
    if (!walkerId) {
      setErrorId(id);
      setError("Select a walker first");
      return;
    }
    setBusyId(id);
    setErrorId(null);
    setError(null);
    try {
      const res = await fetch(`/api/admin/bookings/${id}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walkerId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorId(id);
        setError(data.error);
        return;
      }
      setBookings((prev) => prev.filter((b) => b.id !== id));
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  if (bookings.length === 0) return null;

  return (
    <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5">
      <p className="text-sm font-semibold text-amber-800">
        {bookings.length} new booking{bookings.length === 1 ? "" : "s"} need{bookings.length === 1 ? "s" : ""}{" "}
        a walker
      </p>
      <div className="mt-3 space-y-3">
        {bookings.map((b) => (
          <div key={b.id} className="rounded-lg border border-amber-200 bg-white p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <PawPrint className="mt-0.5 h-4 w-4 shrink-0 text-navy-400" strokeWidth={1.75} />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink">{b.customerName}</p>
                  <p className="text-xs text-ink/50">
                    {b.planName} · {b.dogNames.join(", ")}
                  </p>
                </div>
              </div>
              <Link
                href={`/admin/bookings/${b.id}`}
                className="shrink-0 text-xs font-medium text-navy-600 underline underline-offset-2"
              >
                View details
              </Link>
            </div>

            {walkers.length === 0 ? (
              <p className="mt-3 text-xs text-ink/50">
                No active walkers yet —{" "}
                <Link href="/admin/walkers" className="font-medium text-navy-600 underline underline-offset-2">
                  add one first
                </Link>
                .
              </p>
            ) : (
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <select
                  value={walkerChoice[b.id] ?? ""}
                  onChange={(e) => setWalkerChoice((m) => ({ ...m, [b.id]: e.target.value }))}
                  className="flex-1 rounded-lg border border-sand bg-white px-3 py-2 text-sm text-ink outline-none focus:border-navy-500 focus:ring-2 focus:ring-navy-200"
                >
                  <option value="">Select a walker…</option>
                  {walkers.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.area})
                    </option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <button
                    onClick={() => assign(b.id)}
                    disabled={busyId === b.id}
                    className="rounded-lg bg-navy-600 px-4 py-2 text-sm font-semibold text-paper transition hover:bg-navy-700 disabled:opacity-50"
                  >
                    {busyId === b.id ? "Assigning…" : "Assign now"}
                  </button>
                  <button
                    onClick={() => skip(b.id)}
                    className="rounded-lg border border-sand px-4 py-2 text-sm font-medium text-ink/60 transition hover:bg-sand/30"
                  >
                    Skip for now
                  </button>
                </div>
              </div>
            )}
            {errorId === b.id && error && <p className="mt-2 text-xs text-red-600">{error}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
