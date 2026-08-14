"use client";

import { useState } from "react";

export type ServiceAreaFormValues = {
  id?: string;
  name: string;
  city: string;
  pincodes: string; // comma-separated in the form, split server-side
  isActive: boolean;
};

const EMPTY: ServiceAreaFormValues = {
  name: "",
  city: "",
  pincodes: "",
  isActive: true,
};

type Props = {
  initial?: ServiceAreaFormValues;
  onClose: () => void;
  onSaved: () => void;
};

export default function ServiceAreaFormModal({ initial, onClose, onSaved }: Props) {
  const [form, setForm] = useState<ServiceAreaFormValues>(initial ?? EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const isEdit = Boolean(initial?.id);

  function update<K extends keyof ServiceAreaFormValues>(key: K, value: ServiceAreaFormValues[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(
        isEdit ? `/api/admin/service-areas/${initial!.id}` : "/api/admin/service-areas",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name,
            city: form.city,
            pincodes: form.pincodes,
            isActive: form.isActive,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      onSaved();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 sm:items-center sm:p-6">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-6 sm:rounded-2xl sm:p-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-ink">
            {isEdit ? "Edit service area" : "Add service area"}
          </h2>
          <button onClick={onClose} className="text-sm text-ink/40 hover:text-ink" aria-label="Close">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink/80">Area name</label>
            <input
              type="text"
              required
              placeholder="e.g. Navrangpura Zone"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              className="w-full rounded-lg border border-sand bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-navy-500 focus:ring-2 focus:ring-navy-200"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink/80">City</label>
            <input
              type="text"
              required
              placeholder="Ahmedabad"
              value={form.city}
              onChange={(e) => update("city", e.target.value)}
              className="w-full rounded-lg border border-sand bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-navy-500 focus:ring-2 focus:ring-navy-200"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink/80">
              Pincodes covered (comma-separated)
            </label>
            <input
              type="text"
              required
              placeholder="380009, 380014, 380015"
              value={form.pincodes}
              onChange={(e) => update("pincodes", e.target.value)}
              className="w-full rounded-lg border border-sand bg-white px-3 py-2.5 font-mono text-sm text-ink outline-none transition focus:border-navy-500 focus:ring-2 focus:ring-navy-200"
            />
            <p className="mt-1 text-xs text-ink/50">
              A customer address in one of these pincodes will be treated as serviceable.
            </p>
          </div>

          <label className="flex items-center gap-2 text-sm text-ink/70">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => update("isActive", e.target.checked)}
              className="h-4 w-4 rounded border-sand text-navy-600 focus:ring-navy-300"
            />
            Active
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-navy-600 px-5 py-2.5 text-sm font-semibold text-paper transition hover:bg-navy-700 disabled:opacity-50"
            >
              {loading ? "Saving…" : isEdit ? "Save changes" : "Add service area"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-sand px-5 py-2.5 text-sm font-medium text-ink/70 transition hover:bg-sand/30"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
