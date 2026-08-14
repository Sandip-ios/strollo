"use client";

import { useState } from "react";
import { MapPinned } from "lucide-react";
import ServiceAreaFormModal, { type ServiceAreaFormValues } from "./ServiceAreaFormModal";

type ServiceArea = {
  id: string;
  name: string;
  city: string;
  pincodes: string[];
  isActive: boolean;
};

export default function ServiceAreaList({ initialAreas }: { initialAreas: ServiceArea[] }) {
  const [areas, setAreas] = useState<ServiceArea[]>(initialAreas);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceArea | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  async function refresh() {
    const res = await fetch("/api/admin/service-areas");
    const data = await res.json();
    setAreas(data.serviceAreas ?? []);
  }

  async function handleRemove(area: ServiceArea) {
    if (!confirm(`Remove "${area.name}"? Addresses in this area won't be affected, but new ones there will need a different service area to be considered serviceable.`)) {
      return;
    }
    setRemovingId(area.id);
    try {
      await fetch(`/api/admin/service-areas/${area.id}`, { method: "DELETE" });
      await refresh();
    } finally {
      setRemovingId(null);
    }
  }

  const editingValues: ServiceAreaFormValues | undefined = editing
    ? {
        id: editing.id,
        name: editing.name,
        city: editing.city,
        pincodes: editing.pincodes.join(", "),
        isActive: editing.isActive,
      }
    : undefined;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-ink/60">
          {areas.length} service area{areas.length === 1 ? "" : "s"}
        </p>
        <button
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
          className="rounded-lg bg-navy-600 px-4 py-2 text-sm font-semibold text-paper transition hover:bg-navy-700"
        >
          + Add service area
        </button>
      </div>

      {areas.length === 0 ? (
        <div className="rounded-xl border border-dashed border-sand bg-white/60 p-10 text-center">
          <MapPinned className="mx-auto h-8 w-8 text-navy-300" strokeWidth={1.5} />
          <p className="mt-3 text-sm text-ink/60">
            No service areas configured yet — every pincode is treated as serviceable until
            you add one.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {areas.map((area) => (
            <div key={area.id} className="rounded-xl border border-sand bg-white p-5">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-ink">{area.name}</p>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    area.isActive ? "bg-sky-100 text-sky-700" : "bg-sand/60 text-ink/50"
                  }`}
                >
                  {area.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              <p className="text-xs text-ink/50">{area.city}</p>
              <p className="mt-2 font-mono text-xs text-ink/60">{area.pincodes.join(", ")}</p>

              <div className="mt-3 flex gap-4 text-sm">
                <button
                  onClick={() => {
                    setEditing(area);
                    setModalOpen(true);
                  }}
                  className="font-medium text-navy-600 underline underline-offset-2"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleRemove(area)}
                  disabled={removingId === area.id}
                  className="font-medium text-red-600 underline underline-offset-2 disabled:opacity-50"
                >
                  {removingId === area.id ? "Removing…" : "Remove"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <ServiceAreaFormModal
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
