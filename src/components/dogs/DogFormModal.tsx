"use client";

import { useState } from "react";
import PhotoUpload from "@/components/PhotoUpload";
import BreedCombobox from "./BreedCombobox";
import { DOG_SIZES, TEMPERAMENT_OPTIONS } from "@/lib/dog-constants";

export type DogFormValues = {
  id?: string;
  name: string;
  breed: string;
  size: "SMALL" | "MEDIUM" | "LARGE" | "";
  age: string;
  weightKg: string;
  gender: "MALE" | "FEMALE";
  isVaccinated: boolean;
  isRabiesVaccinated: boolean;
  temperament: string[];
  isRegisteredWithAMC: boolean;
  amcRegistrationNumber: string;
  medicalNotes: string;
  behaviourNotes: string;
  photoUrl: string;
};

const EMPTY: DogFormValues = {
  name: "",
  breed: "",
  size: "",
  age: "",
  weightKg: "",
  gender: "MALE",
  isVaccinated: false,
  isRabiesVaccinated: false,
  temperament: [],
  isRegisteredWithAMC: false,
  amcRegistrationNumber: "",
  medicalNotes: "",
  behaviourNotes: "",
  photoUrl: "",
};

type Props = {
  initial?: DogFormValues;
  onClose: () => void;
  onSaved: () => void;
};

export default function DogFormModal({ initial, onClose, onSaved }: Props) {
  const [form, setForm] = useState<DogFormValues>(initial ?? EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const isEdit = Boolean(initial?.id);

  function update<K extends keyof DogFormValues>(key: K, value: DogFormValues[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleTemperament(tag: string) {
    setForm((f) => ({
      ...f,
      temperament: f.temperament.includes(tag)
        ? f.temperament.filter((t) => t !== tag)
        : [...f.temperament, tag],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const age = Number(form.age);
    const weightKg = Number(form.weightKg);
    if (!Number.isFinite(age) || !Number.isFinite(weightKg)) {
      setError("Enter valid numbers for age and weight");
      return;
    }
    if (!form.size) {
      setError("Select a size");
      return;
    }
    if (form.isRegisteredWithAMC && !form.amcRegistrationNumber.trim()) {
      setError("Enter the AMC registration number");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(isEdit ? `/api/dogs/${initial!.id}` : "/api/dogs", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          breed: form.breed,
          size: form.size,
          age,
          weightKg,
          gender: form.gender,
          isVaccinated: form.isVaccinated,
          isRabiesVaccinated: form.isRabiesVaccinated,
          temperament: form.temperament,
          isRegisteredWithAMC: form.isRegisteredWithAMC,
          amcRegistrationNumber: form.amcRegistrationNumber,
          medicalNotes: form.medicalNotes,
          behaviourNotes: form.behaviourNotes,
          photoUrl: form.photoUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      onSaved();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 sm:items-center sm:p-6">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-6 sm:rounded-2xl sm:p-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-ink">
            {isEdit ? "Edit dog" : "Add a dog"}
          </h2>
          <button onClick={onClose} className="text-sm text-ink/40 hover:text-ink" aria-label="Close">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <PhotoUpload folder="dogs" value={form.photoUrl} onChange={(url) => update("photoUrl", url)} />

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink/80">Name</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              className="w-full rounded-lg border border-sand bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-navy-500 focus:ring-2 focus:ring-navy-200"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink/80">Breed</label>
              <BreedCombobox value={form.breed} onChange={(v) => update("breed", v)} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink/80">Gender</label>
              <select
                value={form.gender}
                onChange={(e) => update("gender", e.target.value as "MALE" | "FEMALE")}
                className="w-full rounded-lg border border-sand bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-navy-500 focus:ring-2 focus:ring-navy-200"
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </select>
            </div>
          </div>

          {/* Size picker */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink/80">Size</label>
            <div className="grid grid-cols-3 gap-2">
              {DOG_SIZES.map((s) => (
                <button
                  type="button"
                  key={s.value}
                  onClick={() => update("size", s.value)}
                  className={`rounded-lg border px-3 py-2.5 text-center transition ${
                    form.size === s.value
                      ? "border-navy-500 bg-navy-50 ring-1 ring-navy-300"
                      : "border-sand bg-white hover:border-navy-200"
                  }`}
                >
                  <div className="text-sm font-semibold text-ink">{s.label}</div>
                  <div className="text-xs text-ink/50">{s.range}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink/80">Age (years)</label>
              <input
                type="number"
                required
                min={0}
                max={30}
                value={form.age}
                onChange={(e) => update("age", e.target.value)}
                className="w-full rounded-lg border border-sand bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-navy-500 focus:ring-2 focus:ring-navy-200"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink/80">Weight (kg)</label>
              <input
                type="number"
                required
                min={0.5}
                step={0.1}
                value={form.weightKg}
                onChange={(e) => update("weightKg", e.target.value)}
                className="w-full rounded-lg border border-sand bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-navy-500 focus:ring-2 focus:ring-navy-200"
              />
            </div>
          </div>

          {/* Vaccination toggles */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink/80">Vaccination</label>
            <div className="flex flex-wrap gap-2">
              <ToggleChip
                label="Vaccinated"
                active={form.isVaccinated}
                onClick={() => update("isVaccinated", !form.isVaccinated)}
              />
              <ToggleChip
                label="Rabies vaccine"
                active={form.isRabiesVaccinated}
                onClick={() => update("isRabiesVaccinated", !form.isRabiesVaccinated)}
              />
            </div>
          </div>

          {/* Temperament multi-select */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink/80">Temperament</label>
            <div className="flex flex-wrap gap-2">
              {TEMPERAMENT_OPTIONS.map((tag) => (
                <ToggleChip
                  key={tag}
                  label={tag}
                  active={form.temperament.includes(tag)}
                  onClick={() => toggleTemperament(tag)}
                  tone={tag === "Aggressive" ? "warning" : "default"}
                />
              ))}
            </div>
          </div>

          {/* AMC registration */}
          <div>
            <label className="flex items-center gap-2 text-sm text-ink/70">
              <input
                type="checkbox"
                checked={form.isRegisteredWithAMC}
                onChange={(e) => update("isRegisteredWithAMC", e.target.checked)}
                className="h-4 w-4 rounded border-sand text-navy-600 focus:ring-navy-300"
              />
              Registered with AMC (Ahmedabad Municipal Corporation)
            </label>
            {form.isRegisteredWithAMC && (
              <input
                type="text"
                required
                placeholder="Registration number"
                value={form.amcRegistrationNumber}
                onChange={(e) => update("amcRegistrationNumber", e.target.value)}
                className="mt-2 w-full rounded-lg border border-sand bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-navy-500 focus:ring-2 focus:ring-navy-200"
              />
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink/80">
              Medical notes (optional)
            </label>
            <textarea
              rows={2}
              value={form.medicalNotes}
              onChange={(e) => update("medicalNotes", e.target.value)}
              placeholder="Allergies, medication, conditions the walker should know about"
              className="w-full rounded-lg border border-sand bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-navy-500 focus:ring-2 focus:ring-navy-200"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink/80">
              Behaviour notes (optional)
            </label>
            <textarea
              rows={2}
              value={form.behaviourNotes}
              onChange={(e) => update("behaviourNotes", e.target.value)}
              placeholder="Pulls on leash, scared of loud noises, etc."
              className="w-full rounded-lg border border-sand bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-navy-500 focus:ring-2 focus:ring-navy-200"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-navy-600 px-5 py-2.5 text-sm font-semibold text-paper transition hover:bg-navy-700 disabled:opacity-50"
            >
              {loading ? "Saving…" : isEdit ? "Save changes" : "Add dog"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-sand px-5 py-2.5 text-sm font-medium text-ink/70 transition hover:bg-sand/30"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ToggleChip({
  label,
  active,
  onClick,
  tone = "default",
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  tone?: "default" | "warning";
}) {
  const activeClasses =
    tone === "warning"
      ? "border-red-400 bg-red-50 text-red-700"
      : "border-navy-500 bg-navy-50 text-navy-700";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
        active ? activeClasses : "border-sand bg-white text-ink/60 hover:border-navy-200"
      }`}
    >
      {label}
    </button>
  );
}
