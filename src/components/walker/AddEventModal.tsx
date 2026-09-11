"use client";

import { useState } from "react";
import PhotoUpload from "@/components/PhotoUpload";
import { WALK_EVENT_TYPES, walkEventMeta, type WalkEventTypeValue } from "@/lib/walk-events";

export type SavedWalkEvent = {
  id: string;
  type: WalkEventTypeValue;
  note: string | null;
  photoUrl: string | null;
  occurredAt: string;
};

type Props = {
  walkId: string;
  onClose: () => void;
  onSaved: (event: SavedWalkEvent) => void;
};

export default function AddEventModal({ walkId, onClose, onSaved }: Props) {
  const [type, setType] = useState<WalkEventTypeValue | null>(null);
  const [photoUrl, setPhotoUrl] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!type) {
      setError("Select an event type");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/walker/walks/${walkId}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, note, photoUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      onSaved(data.event);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 sm:items-center sm:p-6">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-6 sm:rounded-2xl sm:p-8">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-ink">Add event</h2>
          <button onClick={onClose} className="text-sm text-ink/40 hover:text-ink" aria-label="Close">
            ✕
          </button>
        </div>

        <label className="mb-1.5 block text-sm font-medium text-ink/80">Select event type</label>
        <div className="mb-5 grid grid-cols-3 gap-2.5">
          {WALK_EVENT_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setType(t.value)}
              className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 transition ${
                type === t.value ? "border-navy-500 ring-1 ring-navy-300" : "border-sand hover:border-navy-200"
              } ${t.bgClass}`}
            >
              <t.icon className={`h-6 w-6 ${t.iconClass}`} strokeWidth={1.75} />
              <span className="text-xs font-medium text-ink/70">{t.label}</span>
            </button>
          ))}
        </div>

        <div className="mb-5">
          <p className="mb-1.5 text-sm font-medium text-ink/80">Add photo (optional)</p>
          <PhotoUpload folder="walks" value={photoUrl} onChange={setPhotoUrl} />
        </div>

        {type && walkEventMeta(type).quickNotes.length > 0 && (
          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-medium text-ink/80">Quick note (optional)</label>
            <div className="flex flex-wrap gap-2">
              {walkEventMeta(type).quickNotes.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setNote(note === q ? "" : q)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                    note === q
                      ? "border-navy-500 bg-navy-600 text-paper"
                      : "border-sand bg-white text-ink/70 hover:border-navy-200"
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mb-5">
          <label className="mb-1.5 block text-sm font-medium text-ink/80">Add note (optional)</label>
          <textarea
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Write a note… or tap a quick option above"
            className="w-full rounded-lg border border-sand bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-navy-500 focus:ring-2 focus:ring-navy-200"
          />
        </div>

        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full rounded-lg bg-navy-600 px-5 py-3 text-sm font-semibold text-paper transition hover:bg-navy-700 disabled:opacity-50"
        >
          {loading ? "Saving…" : "Save event"}
        </button>
      </div>
    </div>
  );
}
