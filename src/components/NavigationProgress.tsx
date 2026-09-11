"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Dog } from "lucide-react";
import { onNavProgressStart } from "@/lib/nav-progress";

// A thin bar at the very top of the viewport (like GitHub/YouTube) that
// fills in while a page transition is in flight, so a slow route (cold
// Netlify function, a data-heavy admin page, etc.) always gives the user
// something to look at instead of an unresponsive-looking screen — which
// is what was leading to impatient double-clicks.
export default function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);
  const [pct, setPct] = useState(0);
  const [overlay, setOverlay] = useState(false);
  const timers = useRef<number[]>([]);
  const overlayTimer = useRef<number | null>(null);
  const isFirstRender = useRef(true);

  function clearTimers() {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  }

  function start() {
    clearTimers();
    setVisible(true);
    setPct(15);
    timers.current = [
      window.setTimeout(() => setPct(45), 120),
      window.setTimeout(() => setPct(68), 500),
      window.setTimeout(() => setPct(82), 1200),
      window.setTimeout(() => setPct(90), 2500),
    ];

    // Delayed on purpose — an instant/cached navigation shouldn't flash a
    // center-screen overlay, but anything that actually takes a moment
    // (cold Netlify function, a data-heavy page) will clear this delay and
    // show it, which is exactly the "make the wait obvious" case.
    if (overlayTimer.current !== null) window.clearTimeout(overlayTimer.current);
    overlayTimer.current = window.setTimeout(() => setOverlay(true), 150);
  }

  function finish() {
    if (overlayTimer.current !== null) {
      window.clearTimeout(overlayTimer.current);
      overlayTimer.current = null;
    }
    setOverlay(false);

    setVisible((wasVisible) => {
      if (!wasVisible) return wasVisible;
      clearTimers();
      setPct(100);
      timers.current = [
        window.setTimeout(() => {
          setVisible(false);
          setPct(0);
        }, 200),
      ];
      return wasVisible;
    });
  }

  // Route (or query) actually changed — the navigation this bar was
  // tracking has landed, so wrap it up.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  // Catch every same-tab, same-origin <Link>/<a> click as an implicit
  // "navigation started" signal. Registered on the CAPTURE phase
  // deliberately: Next.js's <Link> calls preventDefault() in its own
  // bubble-phase click handler (that's how it avoids a full page reload),
  // and that handler runs before a bubble-phase listener here ever would
  // — checking e.defaultPrevented at that point is always true and this
  // never fires. Capture phase runs on the way DOWN to the target, before
  // Link's handler has had a chance to touch the event at all.
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const anchor = (e.target as HTMLElement)?.closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("http") || anchor.target === "_blank") return;
      if (href === window.location.pathname + window.location.search) return;
      start();
    }
    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, []);

  // Imperative router.push() call sites (login redirect, payment
  // confirmation, etc.) opt in explicitly via startNavProgress().
  useEffect(() => onNavProgressStart(start), []);

  if (!visible) return null;

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[3px] bg-transparent">
        <div
          className="h-full bg-gradient-to-r from-sky-400 via-navy-500 to-sky-400 shadow-[0_0_8px_rgba(75,131,178,0.6)] transition-[width] duration-300 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>

      {overlay && (
        <div className="fixed inset-0 z-[99] flex items-center justify-center bg-ink/10 backdrop-blur-[1px]">
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-white px-6 py-5 shadow-lg">
            <Dog className="h-8 w-8 animate-bounce text-sky-500" strokeWidth={1.75} />
            <p className="text-sm font-medium text-ink/70">Loading…</p>
          </div>
        </div>
      )}
    </>
  );
}
