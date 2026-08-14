"use client";

import { useState } from "react";
import PhotoUpload from "@/components/PhotoUpload";
import { GOV_ID_TYPES } from "@/modules/admin/walker.schema";

export type WalkerFormValues = {
  id?: string;
  name: string;
  mobileNumber: string;
  photoUrl: string;
  area: string;
  govIdType: string;
  govIdNumber: string;
  govIdPhotoUrl: string;
  notes: string;
  isActive: boolean;
};

const EMPTY: WalkerFormValues = {
  name: "",
  mobileNumber: "",
  photoUrl: "",
  area: "",
  govIdType: "",
  govIdNumber: "",
  govIdPhotoUrl: "",
  notes: "",
  isActive: true,
};

type Props = {
  initial?: WalkerFormValues;
  onClose: () => void;
  onSaved: () => void;
};

export default function WalkerFormModal({ initial, onClose, onSaved }: Props) {
  const [form, setForm] = useState<WalkerFormValues>(initial ?? EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const isEdit = Boolean(initial?.id);

  function update<K extends keyof WalkerFormValues>(key: K, value: WalkerFormValues[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const mobileDigits = form.mobileNumber.replace(/\D/g, "").slice(-10);
    if (mobileDigits.length !== 10) {
      setError("Enter a valid 10-digit mobile number");
      return;
    }
    if (!form.area.trim()) {
      setError("Enter the area / locality this walker covers");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(isEdit ? `/api/admin/walkers/${initial!.id}` : "/api/admin/walkers", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          mobileNumber: mobileDigits,
          photoUrl: form.photoUrl,
          area: form.area,
          govIdType: form.govIdType,
          govIdNumber: form.govIdNumber,
          govIdPhotoUrl: form.govIdPhotoUrl,
          notes: form.notes,
          isActive: form.isActive,
        }),
      });
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
            {isEdit ? "Edit walker" : "Add a walker"}
          </h2>
          <button onClick={onClose} className="text-sm text-ink/40 hover:text-ink" aria-label="Close">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <PhotoUpload folder="walkers" value={form.photoUrl} onChange={(url) => update("photoUrl", url)} />

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink/80">Name</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              className="w-full rounded-lg border border-sand bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-navy-500 focus:ring-2 focus:ring-navy-200"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink/80">Mobile number</label>
            <div className="flex overflow-hidden rounded-lg border border-sand bg-white transition focus-within:border-navy-500 focus-within:ring-2 focus-within:ring-navy-200">
              <span className="flex items-center border-r border-sand bg-sand/30 px-3 font-mono text-sm text-ink/70">
                +91
              </span>
              <input
                type="tel"
                required
                value={form.mobileNumber}
                onChange={(e) => update("mobileNumber", e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="98765 43210"
                className="w-full bg-transparent px-3 py-2.5 font-mono text-sm text-ink outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink/80">
              Area / locality covered
            </label>
            <input
              type="text"
              required
              placeholder="Satellite, Ahmedabad"
              value={form.area}
              onChange={(e) => update("area", e.target.value)}
              className="w-full rounded-lg border border-sand bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-navy-500 focus:ring-2 focus:ring-navy-200"
            />
          </div>

          <div className="rounded-lg border border-sand bg-sand/10 p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink/50">
              Government ID (optional, recommended for verification)
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink/80">ID type</label>
                <select
                  value={form.govIdType}
                  onChange={(e) => update("govIdType", e.target.value)}
                  className="w-full rounded-lg border border-sand bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-navy-500 focus:ring-2 focus:ring-navy-200"
                >
                  <option value="">Select…</option>
                  {GOV_ID_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink/80">ID number</label>
                <input
                  type="text"
                  value={form.govIdNumber}
                  onChange={(e) => update("govIdNumber", e.target.value)}
                  className="w-full rounded-lg border border-sand bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-navy-500 focus:ring-2 focus:ring-navy-200"
                />
              </div>
            </div>
            <div className="mt-3">
              <label className="mb-1.5 block text-sm font-medium text-ink/80">
                ID photo (optional)
              </label>
              <PhotoUpload
                folder="walkers"
                value={form.govIdPhotoUrl}
                onChange={(url) => update("govIdPhotoUrl", url)}
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink/80">
              Notes (optional)
            </label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              placeholder="Anything else worth noting about this walker"
              className="w-full rounded-lg border border-sand bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-navy-500 focus:ring-2 focus:ring-navy-200"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-ink/70">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => update("isActive", e.target.checked)}
              className="h-4 w-4 rounded border-sand text-navy-600 focus:ring-navy-300"
            />
            Active (can be assigned to bookings)
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-navy-600 px-5 py-2.5 text-sm font-semibold text-paper transition hover:bg-navy-700 disabled:opacity-50"
            >
              {loading ? "Saving…" : isEdit ? "Save changes" : "Add walker"}
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
