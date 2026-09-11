"use client";

import { useEffect, useState } from "react";
import AddressMapPicker from "@/components/maps/AddressMapPicker";

export type AddressFormValues = {
  id?: string;
  houseNumber: string;
  label: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
  latitude: number | null;
  longitude: number | null;
  isDefault: boolean;
  serviceAreaId: string;
};

const EMPTY: AddressFormValues = {
  houseNumber: "",
  label: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  pincode: "",
  latitude: null,
  longitude: null,
  isDefault: false,
  serviceAreaId: "",
};

type City = { id: string; name: string };
type ServiceArea = { id: string; name: string; cityId: string };

type Props = {
  initial?: AddressFormValues;
  onClose: () => void;
  onSaved: () => void;
};

export default function AddressFormModal({ initial, onClose, onSaved }: Props) {
  const [form, setForm] = useState<AddressFormValues>(initial ?? EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [cities, setCities] = useState<City[]>([]);
  const [serviceAreas, setServiceAreas] = useState<ServiceArea[]>([]);
  const [notListed, setNotListed] = useState(false);
  const [cityId, setCityId] = useState("");
  const isEdit = Boolean(initial?.id);

  useEffect(() => {
    fetch("/api/service-options")
      .then((res) => res.json())
      .then((data) => {
        setCities(data.cities ?? []);
        setServiceAreas(data.serviceAreas ?? []);
        if (initial?.city) {
          const match = (data.cities ?? []).find((c: City) => c.name === initial.city);
          if (match) setCityId(match.id);
          else setNotListed(true);
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function update<K extends keyof AddressFormValues>(key: K, value: AddressFormValues[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const areasForCity = serviceAreas.filter((a) => a.cityId === cityId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (form.latitude === null || form.longitude === null) {
      setError("Pick a location on the map so we know where to send the walker");
      return;
    }
    if (!notListed && !cityId) {
      setError("Select your city");
      return;
    }
    if (!notListed && !form.serviceAreaId) {
      setError("Select your area");
      return;
    }
    if (notListed && !form.city.trim()) {
      setError("Enter your city");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(isEdit ? `/api/addresses/${initial!.id}` : "/api/addresses", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          houseNumber: form.houseNumber,
          label: form.label,
          line1: form.line1,
          line2: form.line2,
          city: notListed ? form.city : cities.find((c) => c.id === cityId)?.name ?? "",
          state: form.state,
          pincode: form.pincode,
          latitude: form.latitude,
          longitude: form.longitude,
          isDefault: form.isDefault,
          serviceAreaId: notListed ? "" : form.serviceAreaId,
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
            {isEdit ? "Edit address" : "Add address"}
          </h2>
          <button
            onClick={onClose}
            className="text-sm text-ink/40 hover:text-ink"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-lg border border-navy-200 bg-navy-50/50 p-4">
            <p className="mb-3 text-sm font-semibold text-ink/80">
              1. Where are you located?
            </p>
            {!notListed ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink/80">City</label>
                  <select
                    required
                    value={cityId}
                    onChange={(e) => {
                      setCityId(e.target.value);
                      update("serviceAreaId", "");
                    }}
                    className="w-full rounded-lg border border-sand bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-navy-500 focus:ring-2 focus:ring-navy-200"
                  >
                    <option value="">Select…</option>
                    {cities.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink/80">Area</label>
                  <select
                    required
                    disabled={!cityId}
                    value={form.serviceAreaId}
                    onChange={(e) => update("serviceAreaId", e.target.value)}
                    className="w-full rounded-lg border border-sand bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-navy-500 focus:ring-2 focus:ring-navy-200 disabled:bg-sand/20"
                  >
                    <option value="">Select…</option>
                    {areasForCity.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink/80">City</label>
                <input
                  type="text"
                  required
                  placeholder="Enter your city"
                  value={form.city}
                  onChange={(e) => update("city", e.target.value)}
                  className="w-full rounded-lg border border-sand bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-navy-500 focus:ring-2 focus:ring-navy-200"
                />
              </div>
            )}
            <label className="mt-3 flex items-center gap-2 text-xs text-ink/60">
              <input
                type="checkbox"
                checked={notListed}
                onChange={(e) => {
                  setNotListed(e.target.checked);
                  update("serviceAreaId", "");
                }}
                className="h-3.5 w-3.5 rounded border-sand text-navy-600 focus:ring-navy-300"
              />
              My city / area isn't listed
            </label>
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold text-ink/80">2. Confirm your address</p>
            <AddressMapPicker
              value={
                form.latitude !== null && form.longitude !== null
                  ? { lat: form.latitude, lng: form.longitude }
                  : null
              }
              onChange={(loc, parts) => {
                update("latitude", loc.lat);
                update("longitude", loc.lng);
                if (parts?.label && !form.label) update("label", parts.label);
                if (parts?.line1 && !form.line1) update("line1", parts.line1);
                if (parts?.landmark && !form.line2) update("line2", parts.landmark);
                if (parts?.state && !form.state) update("state", parts.state);
                if (parts?.pincode && !form.pincode) update("pincode", parts.pincode);

                // Auto-pick City / Area from the searched location if the
                // customer hasn't already chosen one themselves.
                if (!notListed && !cityId && parts?.city) {
                  const matchedCity = cities.find(
                    (c) => c.name.toLowerCase() === parts.city!.trim().toLowerCase()
                  );
                  if (matchedCity) {
                    setCityId(matchedCity.id);
                    if (parts.areaHint) {
                      const matchedArea = serviceAreas.find(
                        (a) =>
                          a.cityId === matchedCity.id &&
                          a.name.toLowerCase() === parts.areaHint!.trim().toLowerCase()
                      );
                      if (matchedArea) update("serviceAreaId", matchedArea.id);
                    }
                  }
                }
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink/80">
                Flat / House No.
              </label>
              <input
                type="text"
                required
                placeholder="B-204"
                value={form.houseNumber}
                onChange={(e) => update("houseNumber", e.target.value)}
                className="w-full rounded-lg border border-sand bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-navy-500 focus:ring-2 focus:ring-navy-200"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink/80">
                Society / Building Name
              </label>
              <input
                type="text"
                required
                placeholder="Shreeji Residency"
                value={form.label}
                onChange={(e) => update("label", e.target.value)}
                className="w-full rounded-lg border border-sand bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-navy-500 focus:ring-2 focus:ring-navy-200"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink/80">Area / Street</label>
            <input
              type="text"
              required
              value={form.line1}
              onChange={(e) => update("line1", e.target.value)}
              className="w-full rounded-lg border border-sand bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-navy-500 focus:ring-2 focus:ring-navy-200"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink/80">
              Landmark (optional)
            </label>
            <input
              type="text"
              value={form.line2}
              onChange={(e) => update("line2", e.target.value)}
              className="w-full rounded-lg border border-sand bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-navy-500 focus:ring-2 focus:ring-navy-200"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink/80">State</label>
            <input
              type="text"
              required
              value={form.state}
              onChange={(e) => update("state", e.target.value)}
              className="w-full rounded-lg border border-sand bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-navy-500 focus:ring-2 focus:ring-navy-200"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink/80">Pincode</label>
            <input
              type="text"
              required
              inputMode="numeric"
              maxLength={6}
              value={form.pincode}
              onChange={(e) => update("pincode", e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="w-40 rounded-lg border border-sand bg-white px-3 py-2.5 font-mono text-sm text-ink outline-none transition focus:border-navy-500 focus:ring-2 focus:ring-navy-200"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-ink/70">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) => update("isDefault", e.target.checked)}
              className="h-4 w-4 rounded border-sand text-navy-600 focus:ring-navy-300"
            />
            Set as default address
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-navy-600 px-5 py-2.5 text-sm font-semibold text-paper transition hover:bg-navy-700 disabled:opacity-50"
            >
              {loading ? "Saving…" : isEdit ? "Save changes" : "Add address"}
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
