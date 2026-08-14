"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  bookingId: string;
  status: string;
  totalWalks: number;
  remainingScheduledWalks: number;
  priceAtBookingPaise: number;
};

export default function CancelBookingButton({
  bookingId,
  status,
  totalWalks,
  remainingScheduledWalks,
  priceAtBookingPaise,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isPreApproval = status === "CONFIRMED";

  const estimatedRefund =
    totalWalks === 0 ? 0 : Math.round((priceAtBookingPaise * remainingScheduledWalks) / totalWalks);
  const estimatedRefundRupees = (estimatedRefund / 100).toLocaleString("en-IN");

  async function handleCancel() {
    const refundText =
      estimatedRefund > 0 ? ` A refund of ₹${estimatedRefundRupees} will be issued.` : "";
    if (
      !confirm(
        `${isPreApproval ? "Reject" : "Cancel"} this booking?${refundText} This can't be undone.`
      )
    ) {
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}/cancel`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Couldn't cancel this booking");
        return;
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-5">
      <p className="text-sm font-medium text-red-800">
        {isPreApproval ? "Reject this booking" : "Cancel this booking"}
      </p>
      <p className="mt-1 text-xs text-red-700">
        {remainingScheduledWalks} of {totalWalks} walk{totalWalks === 1 ? "" : "s"} remaining
        {estimatedRefund > 0 && ` · Estimated refund: ₹${estimatedRefundRupees}`}
      </p>
      <button
        onClick={handleCancel}
        disabled={loading}
        className="mt-3 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
      >
        {loading ? "Processing…" : isPreApproval ? "Reject booking" : "Cancel & refund"}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
