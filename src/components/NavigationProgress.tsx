"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
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
  const timers = useRef<number[]>([]);
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
  }

  function finish() {
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
  // "navigation started" signal.
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const anchor = (e.target as HTMLElement)?.closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("http") || anchor.target === "_blank") return;
      if (href === window.location.pathname + window.location.search) return;
      start();
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  // Imperative router.push() call sites (login redirect, payment
  // confirmation, etc.) opt in explicitly via startNavProgress().
  useEffect(() => onNavProgressStart(start), []);

  if (!visible) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[3px] bg-transparent">
      <div
        className="h-full bg-gradient-to-r from-sky-400 via-navy-500 to-sky-400 shadow-[0_0_8px_rgba(75,131,178,0.6)] transition-[width] duration-300 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
