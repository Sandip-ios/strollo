"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CustomerStatusToggle({
  customerId,
  isActive: initialIsActive,
}: {
  customerId: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const [isActive, setIsActive] = useState(initialIsActive);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    const next = !isActive;
    if (
      !confirm(
        next
          ? "Reactivate this customer? They'll be able to log in and book again."
          : "Deactivate this customer? They won't be able to log in or book until reactivated."
      )
    ) {
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/customers/${customerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: next }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Couldn't update this customer");
        return;
      }
      setIsActive(next);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={toggle}
        disabled={loading}
        className={`w-full rounded-lg border px-4 py-2 text-sm font-medium transition disabled:opacity-50 sm:w-auto ${
          isActive
            ? "border-red-200 text-red-600 hover:bg-red-50"
            : "border-sand text-navy-600 hover:bg-sand/30"
        }`}
      >
        {loading ? "Saving…" : isActive ? "Deactivate customer" : "Reactivate customer"}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
