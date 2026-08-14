"use client";

import { useState } from "react";
import Image from "next/image";
import { Footprints } from "lucide-react";
import WalkerFormModal, { type WalkerFormValues } from "./WalkerFormModal";

type Walker = {
  id: string;
  name: string;
  mobileNumber: string;
  photoUrl: string | null;
  area: string;
  govIdType: string | null;
  govIdNumber: string | null;
  govIdPhotoUrl: string | null;
  notes: string | null;
  isActive: boolean;
};

export default function WalkerList({ initialWalkers }: { initialWalkers: Walker[] }) {
  const [walkers, setWalkers] = useState<Walker[]>(initialWalkers);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Walker | null>(null);

  async function refresh() {
    const res = await fetch("/api/admin/walkers");
    const data = await res.json();
    setWalkers(data.walkers ?? []);
  }

  const editingValues: WalkerFormValues | undefined = editing
    ? {
        id: editing.id,
        name: editing.name,
        mobileNumber: editing.mobileNumber.replace("+91", ""),
        photoUrl: editing.photoUrl ?? "",
        area: editing.area,
        govIdType: editing.govIdType ?? "",
        govIdNumber: editing.govIdNumber ?? "",
        govIdPhotoUrl: editing.govIdPhotoUrl ?? "",
        notes: editing.notes ?? "",
        isActive: editing.isActive,
      }
    : undefined;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-ink/60">
          {walkers.length} walker{walkers.length === 1 ? "" : "s"}
        </p>
        <button
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
          className="rounded-lg bg-navy-600 px-4 py-2 text-sm font-semibold text-paper transition hover:bg-navy-700"
        >
          + Add walker
        </button>
      </div>

      {walkers.length === 0 ? (
        <div className="rounded-xl border border-dashed border-sand bg-white/60 p-10 text-center">
          <Footprints className="mx-auto h-8 w-8 text-navy-300" strokeWidth={1.5} />
          <p className="mt-3 text-sm text-ink/60">No walkers added yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {walkers.map((walker) => (
            <div key={walker.id} className="rounded-xl border border-sand bg-white p-5">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full border border-sand bg-sand/20">
                  {walker.photoUrl ? (
                    <Image
                      src={walker.photoUrl}
                      alt={walker.name}
                      width={56}
                      height={56}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-sky-50">
                      <Footprints className="h-6 w-6 text-navy-300" strokeWidth={1.5} />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-ink">{walker.name}</p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        walker.isActive ? "bg-sky-100 text-sky-700" : "bg-sand/60 text-ink/50"
                      }`}
                    >
                      {walker.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="font-mono text-xs text-ink/50">{walker.mobileNumber}</p>
                  <p className="text-xs text-ink/50">📍 {walker.area}</p>
                </div>
              </div>

              {walker.govIdType && (
                <p className="mt-3 border-t border-sand pt-3 text-xs text-ink/60">
                  <span className="font-medium text-ink/80">{walker.govIdType}</span>
                  {walker.govIdNumber ? `: ${walker.govIdNumber}` : ""}
                  {walker.govIdPhotoUrl && (
                    <a
                      href={walker.govIdPhotoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="ml-2 text-navy-600 underline underline-offset-2"
                    >
                      View ID
                    </a>
                  )}
                </p>
              )}

              {walker.notes && <p className="mt-2 text-xs text-ink/50">{walker.notes}</p>}

              <button
                onClick={() => {
                  setEditing(walker);
                  setModalOpen(true);
                }}
                className="mt-3 text-sm font-medium text-navy-600 underline underline-offset-2"
              >
                Edit
              </button>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <WalkerFormModal
          initial={editingValues}
          onClose={() => setModalOpen(false)}
          onSaved={async () => {
            setModalOpen(false);
            await refresh();
          }}
        />
      )}
    </div>
  );
}
