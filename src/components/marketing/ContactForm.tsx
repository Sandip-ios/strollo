"use client";

import { useState } from "react";

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, message }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }
      setSent(true);
    } catch {
      setError("Something went wrong — please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-2xl border border-sky-200 bg-sky-50 p-6 text-sm text-sky-800">
        Thanks, {name.split(" ")[0] || "there"} — your message is on its way. We'll get back to you
        soon.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-sand bg-white p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink/80">Name</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-sand bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-navy-500 focus:ring-2 focus:ring-navy-200"
            placeholder="Your name"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink/80">Phone (optional)</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-lg border border-sand bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-navy-500 focus:ring-2 focus:ring-navy-200"
            placeholder="98765 43210"
          />
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink/80">Email</label>
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-sand bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-navy-500 focus:ring-2 focus:ring-navy-200"
          placeholder="you@example.com"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink/80">Message</label>
        <textarea
          required
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full rounded-lg border border-sand bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-navy-500 focus:ring-2 focus:ring-navy-200"
          placeholder="How can we help?"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-navy-600 px-5 py-3 text-sm font-semibold text-paper transition hover:bg-navy-700 disabled:opacity-50 sm:w-auto sm:px-8"
      >
        {loading ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
