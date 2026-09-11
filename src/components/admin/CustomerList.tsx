"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDate } from "@/lib/format-date";

type Customer = {
  id: string;
  name: string | null;
  mobileNumber: string;
  email: string | null;
  isActive: boolean;
  createdAt: string;
  dogCount: number;
  bookingCount: number;
};

export default function CustomerList({ customers }: { customers: Customer[] }) {
  const [query, setQuery] = useState("");

  const filtered = customers.filter((c) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      (c.name ?? "").toLowerCase().includes(q) ||
      c.mobileNumber.toLowerCase().includes(q) ||
      (c.email ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by name, mobile, or email"
        className="mb-4 w-full max-w-sm rounded-lg border border-sand bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-navy-500 focus:ring-2 focus:ring-navy-200"
      />

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-sand bg-white/60 p-10 text-center">
          <p className="text-sm text-ink/60">
            {customers.length === 0 ? "No customers yet." : "No customers match your search."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-sand bg-white">
          <ul className="divide-y divide-sand">
            {filtered.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/admin/customers/${c.id}`}
                  className="flex items-center justify-between px-5 py-4 transition hover:bg-sand/20"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-ink">{c.name ?? "—"}</p>
                      {!c.isActive && (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-ink/50">
                      {c.mobileNumber}
                      {c.email ? ` · ${c.email}` : ""}
                    </p>
                  </div>
                  <div className="text-right text-xs text-ink/50">
                    <p>
                      {c.dogCount} dog{c.dogCount === 1 ? "" : "s"} · {c.bookingCount} booking
                      {c.bookingCount === 1 ? "" : "s"}
                    </p>
                    <p className="mt-0.5">Joined {formatDate(c.createdAt)}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
