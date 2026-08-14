"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";

export default function RateWalkerCard({
  bookingId,
  walkerName,
  planName,
}: {
  bookingId: string;
  walkerName: string;
  planName: string;
}) {
  const router = useRouter();
  const [score, setScore] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit() {
    if (score === 0) {
      setError("Pick a rating first.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score, comment }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Couldn't submit your rating.");
        return;
      }
      setSubmitted(true);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-700">
        Thanks for rating {walkerName}! It helps other pet parents too.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
      <p className="text-sm font-bold text-ink">How was {walkerName} on your {planName}?</p>
      <p className="text-xs text-ink/50">Your subscription just wrapped up — rate your walker.</p>

      <div className="mt-3 flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setScore(n)}
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(0)}
            aria-label={`${n} star${n === 1 ? "" : "s"}`}
          >
            <Star
              className={`h-7 w-7 transition ${
                (hovered || score) >= n ? "fill-amber-400 text-amber-400" : "text-ink/20"
              }`}
              strokeWidth={1.5}
            />
          </button>
        ))}
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={2}
        placeholder="Anything you'd like to add (optional)"
        className="mt-3 w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-navy-500 focus:ring-2 focus:ring-navy-200"
      />

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="mt-3 rounded-lg bg-navy-600 px-5 py-2 text-sm font-semibold text-paper transition hover:bg-navy-700 disabled:opacity-50"
      >
        {loading ? "Submitting…" : "Submit rating"}
      </button>
    </div>
  );
}
