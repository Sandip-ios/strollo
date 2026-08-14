"use client";

import { useRef, useState } from "react";
import Image from "next/image";

type Photo = { id: string; url: string };

export default function PhotoMemories({ photos }: { photos: Photo[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const groupSize = 3;
  const groupCount = Math.max(1, Math.ceil(photos.length / groupSize));

  function handleScroll() {
    const el = scrollerRef.current;
    if (!el) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    setActive(Math.min(index, groupCount - 1));
  }

  function scrollToGroup(i: number) {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
    setActive(i);
  }

  return (
    <div>
      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth"
        style={{ scrollbarWidth: "none" }}
      >
        {Array.from({ length: groupCount }).map((_, g) => (
          <div key={g} className="grid w-full shrink-0 snap-start grid-cols-3 gap-3">
            {photos.slice(g * groupSize, g * groupSize + groupSize).map((photo) => (
              <div key={photo.id} className="relative aspect-square overflow-hidden rounded-xl">
                <Image src={photo.url} alt="Walk memory" fill className="object-cover" />
              </div>
            ))}
          </div>
        ))}
      </div>
      {groupCount > 1 && (
        <div className="mt-3 flex justify-center gap-1.5">
          {Array.from({ length: groupCount }).map((_, i) => (
            <button
              key={i}
              onClick={() => scrollToGroup(i)}
              aria-label={`Show photo set ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                active === i ? "w-5 bg-navy-600" : "w-1.5 bg-sand"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
