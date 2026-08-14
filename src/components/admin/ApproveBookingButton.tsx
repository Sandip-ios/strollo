"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ApproveBookingButton({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleApprove() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}/approve`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Couldn't approve this booking");
        return;
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
      <p className="text-sm font-medium text-amber-800">
        This booking is paid and waiting for approval before a walker can be assigned.
      </p>
      <button
        onClick={handleApprove}
        disabled={loading}
        className="mt-3 rounded-lg bg-navy-600 px-5 py-2.5 text-sm font-semibold text-paper transition hover:bg-navy-700 disabled:opacity-50"
      >
        {loading ? "Approving…" : "Approve booking"}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
