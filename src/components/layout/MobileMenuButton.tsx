"use client";

import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import LogoutButton from "@/components/LogoutButton";

export default function MobileMenuButton() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Menu"
        className="rounded-lg border border-sand p-2 text-ink/70 transition hover:bg-sand/30"
      >
        {open ? <X className="h-4 w-4" strokeWidth={1.75} /> : <Menu className="h-4 w-4" strokeWidth={1.75} />}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-40 rounded-xl border border-sand bg-white p-2 shadow-lg">
          <LogoutButton />
        </div>
      )}
    </div>
  );
}
