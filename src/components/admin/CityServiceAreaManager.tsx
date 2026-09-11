"use client";

import { useState } from "react";
import { Building2, MapPinned, AlertTriangle } from "lucide-react";

type Area = { id: string; name: string; isActive: boolean; cityId: string; walkerCount: number };
type City = { id: string; name: string; isActive: boolean };

type Props = {
  initialCities: City[];
  initialAreas: Area[];
};

export default function CityServiceAreaManager({ initialCities, initialAreas }: Props) {
  const [cities, setCities] = useState<City[]>(initialCities);
  const [areas, setAreas] = useState<Area[]>(initialAreas);

  const [newCityName, setNewCityName] = useState("");
  const [addingCity, setAddingCity] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newAreaName, setNewAreaName] = useState<Record<string, string>>({});
  const [addingAreaFor, setAddingAreaFor] = useState<string | null>(null);

  const [editingCityId, setEditingCityId] = useState<string | null>(null);
  const [editingCityName, setEditingCityName] = useState("");
  const [editingAreaId, setEditingAreaId] = useState<string | null>(null);
  const [editingAreaName, setEditingAreaName] = useState("");

  const [busyId, setBusyId] = useState<string | null>(null);

  async function refreshCities() {
    const res = await fetch("/api/admin/cities");
    const data = await res.json();
    setCities(data.items ?? []);
  }

  async function refreshAreas() {
    const res = await fetch("/api/admin/service-areas");
    const data = await res.json();
    setAreas(data.serviceAreas ?? []);
  }

  async function handleAddCity(e: React.FormEvent) {
    e.preventDefault();
    if (!newCityName.trim()) return;
    setAddingCity(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/cities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCityName.trim(), isActive: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      setNewCityName("");
      await refreshCities();
    } finally {
      setAddingCity(false);
    }
  }

  async function handleToggleCity(city: City) {
    setBusyId(city.id);
    try {
      await fetch(`/api/admin/cities/${city.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: city.name, isActive: !city.isActive }),
      });
      await refreshCities();
    } finally {
      setBusyId(null);
    }
  }

  async function handleRenameCity(city: City) {
    if (!editingCityName.trim()) return;
    setBusyId(city.id);
    try {
      await fetch(`/api/admin/cities/${city.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editingCityName.trim(), isActive: city.isActive }),
      });
      setEditingCityId(null);
      await refreshCities();
    } finally {
      setBusyId(null);
    }
  }

  async function handleRemoveCity(city: City) {
    const areaCount = areas.filter((a) => a.cityId === city.id).length;
    if (
      !confirm(
        `Remove "${city.name}"?${areaCount > 0 ? ` Its ${areaCount} service area${areaCount === 1 ? "" : "s"} will no longer be shown, but addresses already using them won't be affected.` : ""}`
      )
    ) {
      return;
    }
    setBusyId(city.id);
    try {
      await fetch(`/api/admin/cities/${city.id}`, { method: "DELETE" });
      await refreshCities();
    } finally {
      setBusyId(null);
    }
  }

  async function handleAddArea(cityId: string) {
    const name = (newAreaName[cityId] ?? "").trim();
    if (!name) return;
    setBusyId(cityId);
    setError(null);
    try {
      const res = await fetch("/api/admin/service-areas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, cityId, isActive: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      setNewAreaName((m) => ({ ...m, [cityId]: "" }));
      await refreshAreas();
    } finally {
      setBusyId(null);
    }
  }

  async function handleToggleArea(area: Area) {
    setBusyId(area.id);
    try {
      await fetch(`/api/admin/service-areas/${area.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: area.name, cityId: area.cityId, isActive: !area.isActive }),
      });
      await refreshAreas();
    } finally {
      setBusyId(null);
    }
  }

  async function handleRenameArea(area: Area) {
    if (!editingAreaName.trim()) return;
    setBusyId(area.id);
    try {
      await fetch(`/api/admin/service-areas/${area.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editingAreaName.trim(), cityId: area.cityId, isActive: area.isActive }),
      });
      setEditingAreaId(null);
      await refreshAreas();
    } finally {
      setBusyId(null);
    }
  }

  async function handleRemoveArea(area: Area) {
    if (!confirm(`Remove "${area.name}"? It will no longer be offered when customers add an address.`)) return;
    setBusyId(area.id);
    try {
      await fetch(`/api/admin/service-areas/${area.id}`, { method: "DELETE" });
      await refreshAreas();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <form onSubmit={handleAddCity} className="mb-6 flex gap-3">
        <input
          type="text"
          value={newCityName}
          onChange={(e) => setNewCityName(e.target.value)}
          placeholder="Add a new city, e.g. Surat"
          className="flex-1 rounded-lg border border-sand bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-navy-500 focus:ring-2 focus:ring-navy-200"
        />
        <button
          type="submit"
          disabled={addingCity}
          className="rounded-lg bg-navy-600 px-4 py-2 text-sm font-semibold text-paper transition hover:bg-navy-700 disabled:opacity-50"
        >
          {addingCity ? "Adding…" : "+ Add city"}
        </button>
      </form>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {cities.length === 0 ? (
        <div className="rounded-xl border border-dashed border-sand bg-white/60 p-10 text-center">
          <Building2 className="mx-auto h-8 w-8 text-navy-300" strokeWidth={1.5} />
          <p className="mt-3 text-sm text-ink/60">
            No cities added yet — add one above, then its service areas.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {cities.map((city) => {
            const cityAreas = areas.filter((a) => a.cityId === city.id);
            const unassignedCount = cityAreas.filter((a) => a.isActive && a.walkerCount === 0).length;
            return (
              <div key={city.id} className="rounded-xl border border-sand bg-white p-5">
                <div className="flex items-center justify-between gap-3">
                  {editingCityId === city.id ? (
                    <input
                      type="text"
                      autoFocus
                      value={editingCityName}
                      onChange={(e) => setEditingCityName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleRenameCity(city);
                        if (e.key === "Escape") setEditingCityId(null);
                      }}
                      className="flex-1 rounded-lg border border-sand bg-white px-3 py-1.5 text-sm font-semibold text-ink outline-none focus:border-navy-500 focus:ring-2 focus:ring-navy-200"
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-navy-500" strokeWidth={1.75} />
                      <p className="font-display text-base font-semibold text-ink">{city.name}</p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          city.isActive ? "bg-sky-100 text-sky-700" : "bg-sand/60 text-ink/50"
                        }`}
                      >
                        {city.isActive ? "Active" : "Inactive"}
                      </span>
                      {unassignedCount > 0 && (
                        <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                          <AlertTriangle className="h-3 w-3" strokeWidth={2} />
                          {unassignedCount} need{unassignedCount === 1 ? "s" : ""} a walker
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex shrink-0 gap-3 text-sm">
                    {editingCityId === city.id ? (
                      <>
                        <button
                          onClick={() => handleRenameCity(city)}
                          disabled={busyId === city.id}
                          className="font-medium text-navy-600 underline underline-offset-2 disabled:opacity-50"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingCityId(null)}
                          className="font-medium text-ink/50 underline underline-offset-2"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setEditingCityId(city.id);
                            setEditingCityName(city.name);
                          }}
                          className="font-medium text-navy-600 underline underline-offset-2"
                        >
                          Rename
                        </button>
                        <button
                          onClick={() => handleToggleCity(city)}
                          disabled={busyId === city.id}
                          className="font-medium text-ink/60 underline underline-offset-2 disabled:opacity-50"
                        >
                          {city.isActive ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          onClick={() => handleRemoveCity(city)}
                          disabled={busyId === city.id}
                          className="font-medium text-red-600 underline underline-offset-2 disabled:opacity-50"
                        >
                          Remove
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="mt-4 border-t border-sand pt-4">
                  {cityAreas.length === 0 ? (
                    <p className="mb-3 flex items-center gap-2 text-xs text-ink/50">
                      <MapPinned className="h-3.5 w-3.5" strokeWidth={1.75} />
                      No service areas in {city.name} yet.
                    </p>
                  ) : (
                    <div className="mb-3 flex flex-wrap gap-2">
                      {cityAreas.map((area) =>
                        editingAreaId === area.id ? (
                          <input
                            key={area.id}
                            type="text"
                            autoFocus
                            value={editingAreaName}
                            onChange={(e) => setEditingAreaName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleRenameArea(area);
                              if (e.key === "Escape") setEditingAreaId(null);
                            }}
                            onBlur={() => setEditingAreaId(null)}
                            className="rounded-full border border-navy-500 bg-white px-3 py-1 text-xs outline-none focus:ring-2 focus:ring-navy-200"
                          />
                        ) : (
                          <div
                            key={area.id}
                            className={`group flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${
                              !area.isActive
                                ? "border-sand bg-sand/30 text-ink/40"
                                : area.walkerCount === 0
                                  ? "border-amber-300 bg-amber-50 text-amber-800"
                                  : "border-navy-200 bg-navy-50 text-navy-700"
                            }`}
                            title={
                              !area.isActive
                                ? "Inactive"
                                : area.walkerCount === 0
                                  ? "No walker assigned to this area yet"
                                  : `${area.walkerCount} walker${area.walkerCount === 1 ? "" : "s"} assigned`
                            }
                          >
                            {area.isActive && area.walkerCount === 0 && (
                              <AlertTriangle className="h-3 w-3 shrink-0" strokeWidth={2} />
                            )}
                            <button
                              onClick={() => {
                                setEditingAreaId(area.id);
                                setEditingAreaName(area.name);
                              }}
                              title="Rename"
                            >
                              {area.name}
                            </button>
                            {area.isActive && area.walkerCount > 0 && (
                              <span className="rounded-full bg-navy-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                                {area.walkerCount}
                              </span>
                            )}
                            <button
                              onClick={() => handleToggleArea(area)}
                              disabled={busyId === area.id}
                              title={area.isActive ? "Deactivate" : "Activate"}
                              className="text-[10px] opacity-60 hover:opacity-100 disabled:opacity-30"
                            >
                              {area.isActive ? "●" : "○"}
                            </button>
                            <button
                              onClick={() => handleRemoveArea(area)}
                              disabled={busyId === area.id}
                              title="Remove"
                              className="opacity-40 hover:text-red-600 hover:opacity-100 disabled:opacity-20"
                            >
                              ✕
                            </button>
                          </div>
                        )
                      )}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newAreaName[city.id] ?? ""}
                      onChange={(e) => setNewAreaName((m) => ({ ...m, [city.id]: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddArea(city.id);
                        }
                      }}
                      placeholder={`Add an area in ${city.name}`}
                      className="flex-1 rounded-lg border border-sand bg-white px-3 py-1.5 text-xs text-ink outline-none transition focus:border-navy-500 focus:ring-2 focus:ring-navy-200"
                    />
                    <button
                      onClick={() => handleAddArea(city.id)}
                      disabled={busyId === city.id}
                      className="rounded-lg border border-navy-200 px-3 py-1.5 text-xs font-semibold text-navy-600 transition hover:bg-navy-50 disabled:opacity-50"
                    >
                      + Add
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
