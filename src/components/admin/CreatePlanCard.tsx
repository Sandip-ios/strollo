"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const TYPE_LABELS: Record<string, string> = {
  WEEKLY: "Weekly Plan",
  MONTHLY: "Monthly Plan",
};

export default function CreatePlanCard({ type }: { type: "WEEKLY" | "MONTHLY" }) {
  const router = useRouter();
  const [priceRupees, setPriceRupees] = useState("");
  const [dogQuantity, setDogQuantity] = useState("1");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const price = Number(priceRupees);
    if (!Number.isFinite(price) || price <= 0) {
      setError("Enter a valid price");
      return;
    }
    const quantity = Number(dogQuantity);
    if (!Number.isInteger(quantity) || quantity <= 0) {
      setError("Enter a valid number of dogs");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          name: TYPE_LABELS[type],
          priceRupees: price,
          dogQuantity: quantity,
          isActive: false,
        }),
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

  return (
    <div className="rounded-xl border border-dashed border-sand bg-white/60 p-6">
      <h3 className="font-display text-lg font-semibold text-ink/70">{TYPE_LABELS[type]}</h3>
      <p className="mt-0.5 text-xs text-ink/50">Not set up yet.</p>
      <form onSubmit={handleCreate} className="mt-4 flex items-end gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-ink/60">Price (₹)</label>
          <input
            type="number"
            min={1}
            value={priceRupees}
            onChange={(e) => setPriceRupees(e.target.value)}
            placeholder="e.g. 199"
            className="w-32 rounded-lg border border-sand bg-white px-3 py-2 font-mono text-sm text-ink outline-none focus:border-navy-500 focus:ring-2 focus:ring-navy-200"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ink/60">Number of dogs</label>
          <input
            type="number"
            min={1}
            value={dogQuantity}
            onChange={(e) => setDogQuantity(e.target.value)}
            className="w-24 rounded-lg border border-sand bg-white px-3 py-2 font-mono text-sm text-ink outline-none focus:border-navy-500 focus:ring-2 focus:ring-navy-200"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-navy-600 px-4 py-2 text-sm font-semibold text-paper transition hover:bg-navy-700 disabled:opacity-50"
        >
          {loading ? "Creating…" : "Create"}
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
