"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Plan = {
  id: string;
  type: "WEEKLY" | "MONTHLY" | "CUSTOM";
  name: string;
  price: number; // paise
  dogQuantity: number;
  isActive: boolean;
};

const TYPE_LABELS: Partial<Record<Plan["type"], string>> = {
  WEEKLY: "Weekly Plan",
  MONTHLY: "Monthly Plan",
};

export default function PlanCard({ plan: initialPlan }: { plan: Plan }) {
  const router = useRouter();
  const isCustom = initialPlan.type === "CUSTOM";
  const [plan, setPlan] = useState(initialPlan);
  const [name, setName] = useState(initialPlan.name);
  const [priceRupees, setPriceRupees] = useState(String(initialPlan.price / 100));
  const [dogQuantity, setDogQuantity] = useState(String(initialPlan.dogQuantity));
  const [isActive, setIsActive] = useState(initialPlan.isActive);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const title = isCustom ? plan.name : TYPE_LABELS[plan.type];
  // Every active plan is shown to customers whose selected dog count
  // matches, not just the fixed Monthly/Weekly slots.
  const note = plan.isActive
    ? "Live in the customer booking flow."
    : "Not shown in the customer booking flow.";

  async function handleSave() {
    setError(null);
    setSaved(false);
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

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/plans/${plan.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, priceRupees: price, dogQuantity: quantity, isActive }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      setPlan(data.plan);
      setEditing(false);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Remove "${plan.name}"? This can't be undone.`)) return;
    setError(null);
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/plans/${plan.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to remove plan");
        return;
      }
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="rounded-xl border border-sand bg-white p-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-display text-lg font-semibold text-navy-700">{title}</h3>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                plan.isActive ? "bg-sky-100 text-sky-700" : "bg-sand/60 text-ink/50"
              }`}
            >
              {plan.isActive ? "Active" : "Inactive"}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-ink/50">{note}</p>
        </div>
        {!editing && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setEditing(true)}
              className="text-sm font-medium text-navy-600 underline underline-offset-2"
            >
              Edit
            </button>
            {isCustom && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="text-sm font-medium text-red-600 underline underline-offset-2 disabled:opacity-50"
              >
                {deleting ? "Removing…" : "Remove"}
              </button>
            )}
          </div>
        )}
      </div>

      {editing ? (
        <div className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-ink/60">Display name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-sand bg-white px-3 py-2 text-sm text-ink outline-none focus:border-navy-500 focus:ring-2 focus:ring-navy-200"
            />
          </div>
          <div className="flex gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-ink/60">Price (₹)</label>
              <input
                type="number"
                min={1}
                value={priceRupees}
                onChange={(e) => setPriceRupees(e.target.value)}
                className="w-40 rounded-lg border border-sand bg-white px-3 py-2 font-mono text-sm text-ink outline-none focus:border-navy-500 focus:ring-2 focus:ring-navy-200"
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
          </div>
          <label className="flex items-center gap-2 text-sm text-ink/70">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-sand text-navy-600 focus:ring-navy-300"
            />
            Active
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3 pt-1">
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-navy-600 px-4 py-2 text-sm font-semibold text-paper transition hover:bg-navy-700 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              onClick={() => {
                setEditing(false);
                setName(plan.name);
                setPriceRupees(String(plan.price / 100));
                setDogQuantity(String(plan.dogQuantity));
                setIsActive(plan.isActive);
                setError(null);
              }}
              className="rounded-lg border border-sand px-4 py-2 text-sm font-medium text-ink/70 transition hover:bg-sand/30"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-3">
          <p className="font-mono text-2xl font-semibold text-ink">
            ₹{(plan.price / 100).toLocaleString("en-IN")}
          </p>
          <p className="mt-0.5 text-sm text-ink/50">
            {!isCustom && `${plan.name} · `}
            For {plan.dogQuantity} {plan.dogQuantity === 1 ? "dog" : "dogs"}
          </p>
          {saved && <p className="mt-1 text-xs text-navy-600">Updated.</p>}
          {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
      )}
    </div>
  );
}
