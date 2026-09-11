"use client";

import { useState } from "react";
import { Tag } from "lucide-react";

type Item = { id: string; name: string; isActive: boolean };

type Props = {
  resource: string; // e.g. "breeds" — the /api/admin/{resource} path segment
  label: string; // e.g. "Breed" — singular, used in copy
  initialItems: Item[];
};

export default function MasterListManager({ resource, label, initialItems }: Props) {
  const [items, setItems] = useState<Item[]>(initialItems);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  async function refresh() {
    const res = await fetch(`/api/admin/${resource}`);
    const data = await res.json();
    setItems(data.items ?? []);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setAdding(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/${resource}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), isActive: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      setNewName("");
      await refresh();
    } finally {
      setAdding(false);
    }
  }

  async function handleToggleActive(item: Item) {
    setBusyId(item.id);
    try {
      await fetch(`/api/admin/${resource}/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: item.name, isActive: !item.isActive }),
      });
      await refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function handleRename(item: Item) {
    if (!editingName.trim()) return;
    setBusyId(item.id);
    try {
      await fetch(`/api/admin/${resource}/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editingName.trim(), isActive: item.isActive }),
      });
      setEditingId(null);
      await refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function handleRemove(item: Item) {
    if (!confirm(`Remove "${item.name}"? It will no longer be offered as an option.`)) return;
    setBusyId(item.id);
    try {
      await fetch(`/api/admin/${resource}/${item.id}`, { method: "DELETE" });
      await refresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <form onSubmit={handleAdd} className="mb-6 flex gap-3">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder={`Add a new ${label.toLowerCase()}`}
          className="flex-1 rounded-lg border border-sand bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-navy-500 focus:ring-2 focus:ring-navy-200"
        />
        <button
          type="submit"
          disabled={adding}
          className="rounded-lg bg-navy-600 px-4 py-2 text-sm font-semibold text-paper transition hover:bg-navy-700 disabled:opacity-50"
        >
          {adding ? "Adding…" : "+ Add"}
        </button>
      </form>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-sand bg-white/60 p-10 text-center">
          <Tag className="mx-auto h-8 w-8 text-navy-300" strokeWidth={1.5} />
          <p className="mt-3 text-sm text-ink/60">No {label.toLowerCase()}s added yet.</p>
        </div>
      ) : (
        <ul className="divide-y divide-sand overflow-hidden rounded-xl border border-sand bg-white">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3 px-4 py-3">
              {editingId === item.id ? (
                <input
                  type="text"
                  autoFocus
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleRename(item);
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  className="flex-1 rounded-lg border border-sand bg-white px-3 py-1.5 text-sm text-ink outline-none focus:border-navy-500 focus:ring-2 focus:ring-navy-200"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-ink">{item.name}</p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      item.isActive ? "bg-sky-100 text-sky-700" : "bg-sand/60 text-ink/50"
                    }`}
                  >
                    {item.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              )}

              <div className="flex shrink-0 gap-4 text-sm">
                {editingId === item.id ? (
                  <>
                    <button
                      onClick={() => handleRename(item)}
                      disabled={busyId === item.id}
                      className="font-medium text-navy-600 underline underline-offset-2 disabled:opacity-50"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="font-medium text-ink/50 underline underline-offset-2"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setEditingId(item.id);
                        setEditingName(item.name);
                      }}
                      className="font-medium text-navy-600 underline underline-offset-2"
                    >
                      Rename
                    </button>
                    <button
                      onClick={() => handleToggleActive(item)}
                      disabled={busyId === item.id}
                      className="font-medium text-ink/60 underline underline-offset-2 disabled:opacity-50"
                    >
                      {item.isActive ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      onClick={() => handleRemove(item)}
                      disabled={busyId === item.id}
                      className="font-medium text-red-600 underline underline-offset-2 disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
