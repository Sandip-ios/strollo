"use client";

import { useMemo, useRef, useState } from "react";

type Props = {
  value: string;
  onChange: (value: string) => void;
  breeds: string[];
};

export default function BreedCombobox({ value, onChange, breeds }: Props) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    if (!query.trim()) return breeds;
    const q = query.toLowerCase();
    return breeds.filter((b) => b.toLowerCase().includes(q));
  }, [query, breeds]);

  function selectBreed(breed: string) {
    onChange(breed);
    setQuery(breed);
    setOpen(false);
  }

  function handleBlur() {
    // small delay so a click on an option registers before blur closes the list
    setTimeout(() => {
      if (!containerRef.current?.contains(document.activeElement)) {
        onChange(query);
        setOpen(false);
      }
    }, 100);
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        required
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onBlur={handleBlur}
        placeholder="Search breed, e.g. Labrador"
        className="w-full rounded-lg border border-sand bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-navy-500 focus:ring-2 focus:ring-navy-200"
      />
      {open && (
        <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-sand bg-white shadow-lg">
          {filtered.length > 0 ? (
            filtered.map((breed) => (
              <button
                type="button"
                key={breed}
                onMouseDown={() => selectBreed(breed)}
                className={`block w-full px-3 py-2 text-left text-sm hover:bg-sky-50 ${
                  breed === value ? "bg-sky-50 font-medium text-navy-700" : "text-ink"
                }`}
              >
                {breed}
              </button>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-ink/50">
              No match — "{query}" will be used as entered.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
