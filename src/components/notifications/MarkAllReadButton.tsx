"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function MarkAllReadButton({ disabled }: { disabled: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      await fetch("/api/notifications/mark-all-read", { method: "POST" });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled || loading}
      className="text-sm font-medium text-navy-600 underline underline-offset-2 disabled:opacity-40"
    >
      {loading ? "Marking…" : "Mark all read"}
    </button>
  );
}
