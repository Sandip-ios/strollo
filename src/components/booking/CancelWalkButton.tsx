"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CancelWalkButton({
  bookingId,
  walkId,
  dateLabel,
}: {
  bookingId: string;
  walkId: string;
  dateLabel: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCancel() {
    if (!confirm(`Cancel the walk on ${dateLabel}? This can't be undone.`)) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/walks/${walkId}/cancel`, {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Couldn't cancel this walk.");
        return;
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="text-right">
      <button
        onClick={handleCancel}
        disabled={loading}
        className="text-xs font-medium text-red-600 underline underline-offset-2 disabled:opacity-50"
      >
        {loading ? "Cancelling…" : "Cancel"}
      </button>
      {error && <p className="mt-1 max-w-[220px] text-xs text-red-600">{error}</p>}
    </div>
  );
}
