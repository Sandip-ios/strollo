"use client";

import { useState } from "react";
import Image from "next/image";
import { PawPrint } from "lucide-react";
import DogFormModal, { type DogFormValues } from "./DogFormModal";

type Dog = {
  id: string;
  name: string;
  breed: string;
  size: "SMALL" | "MEDIUM" | "LARGE";
  age: number;
  weightKg: number;
  gender: "MALE" | "FEMALE";
  vaccinations: string[];
  temperament: string[];
  isRegisteredWithAMC: boolean;
  amcRegistrationNumber: string | null;
  medicalNotes: string | null;
  behaviourNotes: string | null;
  photoUrl: string | null;
};

type Props = {
  initialDogs: Dog[];
};

export default function DogList({ initialDogs }: Props) {
  const [dogs, setDogs] = useState<Dog[]>(initialDogs);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Dog | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function refresh() {
    const res = await fetch("/api/dogs");
    const data = await res.json();
    setDogs(data.dogs ?? []);
  }

  function openAdd() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(dog: Dog) {
    setEditing(dog);
    setModalOpen(true);
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await fetch(`/api/dogs/${id}`, { method: "DELETE" });
      await refresh();
    } finally {
      setDeletingId(null);
    }
  }

  const editingValues: DogFormValues | undefined = editing
    ? {
        id: editing.id,
        name: editing.name,
        breed: editing.breed,
        size: editing.size,
        age: String(editing.age),
        weightKg: String(editing.weightKg),
        gender: editing.gender,
        vaccinations: editing.vaccinations,
        temperament: editing.temperament,
        isRegisteredWithAMC: editing.isRegisteredWithAMC,
        amcRegistrationNumber: editing.amcRegistrationNumber ?? "",
        medicalNotes: editing.medicalNotes ?? "",
        behaviourNotes: editing.behaviourNotes ?? "",
        photoUrl: editing.photoUrl ?? "",
      }
    : undefined;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-ink/60">
          {dogs.length} dog{dogs.length === 1 ? "" : "s"}
        </p>
        <button
          onClick={openAdd}
          className="rounded-lg bg-navy-600 px-4 py-2 text-sm font-semibold text-paper transition hover:bg-navy-700"
        >
          + Add dog
        </button>
      </div>

      {dogs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-sand bg-white/60 p-10 text-center">
          <PawPrint className="mx-auto h-8 w-8 text-navy-300" strokeWidth={1.5} />
          <p className="mt-3 text-sm text-ink/60">
            No dogs added yet. Add your dog's details so we can match the right walker.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {dogs.map((dog) => (
            <div key={dog.id} className="rounded-xl border border-sand bg-white p-5">
              <div className="flex items-start gap-4">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full border border-sand bg-sand/20">
                  {dog.photoUrl ? (
                    <Image
                      src={dog.photoUrl}
                      alt={dog.name}
                      width={64}
                      height={64}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-sky-50">
                      <PawPrint className="h-6 w-6 text-navy-300" strokeWidth={1.5} />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-display text-base font-semibold text-navy-700">{dog.name}</h3>
                  <p className="text-sm text-ink/60">
                    {dog.breed} · {dog.gender === "MALE" ? "Male" : "Female"}
                  </p>
                  <p className="text-sm text-ink/60">
                    {dog.age} yr{dog.age === 1 ? "" : "s"} · {dog.weightKg} kg ·{" "}
                    {dog.size.charAt(0) + dog.size.slice(1).toLowerCase()}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {dog.vaccinations.map((name) => (
                  <Badge key={name} label={name} tone="good" />
                ))}
                {dog.isRegisteredWithAMC && <Badge label="AMC registered" tone="good" />}
                {dog.temperament.map((tag) => (
                  <Badge key={tag} label={tag} tone={tag === "Aggressive" ? "warning" : "neutral"} />
                ))}
              </div>

              {dog.isRegisteredWithAMC && dog.amcRegistrationNumber && (
                <p className="mt-2 font-mono text-xs text-ink/50">
                  AMC Reg. No: {dog.amcRegistrationNumber}
                </p>
              )}

              {(dog.medicalNotes || dog.behaviourNotes) && (
                <div className="mt-3 space-y-1 border-t border-sand pt-3">
                  {dog.medicalNotes && (
                    <p className="text-xs text-ink/60">
                      <span className="font-medium text-ink/80">Medical:</span> {dog.medicalNotes}
                    </p>
                  )}
                  {dog.behaviourNotes && (
                    <p className="text-xs text-ink/60">
                      <span className="font-medium text-ink/80">Behaviour:</span> {dog.behaviourNotes}
                    </p>
                  )}
                </div>
              )}

              <div className="mt-4 flex gap-4 text-sm">
                <button
                  onClick={() => openEdit(dog)}
                  className="font-medium text-navy-600 underline underline-offset-2"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(dog.id)}
                  disabled={deletingId === dog.id}
                  className="font-medium text-red-600 underline underline-offset-2 disabled:opacity-50"
                >
                  {deletingId === dog.id ? "Removing…" : "Remove"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <DogFormModal
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

function Badge({ label, tone }: { label: string; tone: "good" | "warning" | "neutral" }) {
  const toneClasses = {
    good: "bg-sky-100 text-sky-700",
    warning: "bg-red-100 text-red-700",
    neutral: "bg-sand/60 text-ink/70",
  }[tone];

  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${toneClasses}`}>
      {label}
    </span>
  );
}
