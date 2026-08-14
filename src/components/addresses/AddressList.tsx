"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";
import AddressFormModal, { type AddressFormValues } from "./AddressFormModal";

type Address = {
  id: string;
  houseNumber: string;
  label: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
  isDefault: boolean;
};

type Props = {
  initialAddresses: Address[];
};

export default function AddressList({ initialAddresses }: Props) {
  const [addresses, setAddresses] = useState<Address[]>(initialAddresses);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Address | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function refresh() {
    const res = await fetch("/api/addresses");
    const data = await res.json();
    setAddresses(data.addresses ?? []);
  }

  function openAdd() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(address: Address) {
    setEditing(address);
    setModalOpen(true);
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await fetch(`/api/addresses/${id}`, { method: "DELETE" });
      await refresh();
    } finally {
      setDeletingId(null);
    }
  }

  const editingValues: AddressFormValues | undefined = editing
    ? {
        id: editing.id,
        houseNumber: editing.houseNumber,
        label: editing.label,
        line1: editing.line1,
        line2: editing.line2 ?? "",
        city: editing.city,
        state: editing.state,
        pincode: editing.pincode,
        latitude: editing.latitude,
        longitude: editing.longitude,
        isDefault: editing.isDefault,
      }
    : undefined;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-ink/60">
          {addresses.length} saved address{addresses.length === 1 ? "" : "es"}
        </p>
        <button
          onClick={openAdd}
          className="rounded-lg bg-navy-600 px-4 py-2 text-sm font-semibold text-paper transition hover:bg-navy-700"
        >
          + Add address
        </button>
      </div>

      {addresses.length === 0 ? (
        <div className="rounded-xl border border-dashed border-sand bg-white/60 p-10 text-center">
          <MapPin className="mx-auto h-8 w-8 text-navy-300" strokeWidth={1.5} />
          <p className="mt-3 text-sm text-ink/60">
            No addresses yet. Add one so we know where to send your walker.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {addresses.map((address) => (
            <div
              key={address.id}
              className="rounded-xl border border-sand bg-white p-5"
            >
              <div className="mb-1 flex items-center justify-between">
                <h3 className="font-display text-base font-semibold text-navy-700">
                  {address.label}
                </h3>
                {address.isDefault && (
                  <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-medium text-sky-700">
                    Default
                  </span>
                )}
              </div>
              <p className="text-sm text-ink/70">
                {address.houseNumber}, {address.line1}
                {address.line2 ? `, ${address.line2}` : ""}
              </p>
              <p className="text-sm text-ink/70">
                {address.city}, {address.state} – {address.pincode}
              </p>
              <div className="mt-4 flex gap-4 text-sm">
                <button
                  onClick={() => openEdit(address)}
                  className="font-medium text-navy-600 underline underline-offset-2"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(address.id)}
                  disabled={deletingId === address.id}
                  className="font-medium text-red-600 underline underline-offset-2 disabled:opacity-50"
                >
                  {deletingId === address.id ? "Removing…" : "Remove"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <AddressFormModal
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
