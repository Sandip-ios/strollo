"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import PawLoader from "@/components/brand/PawLoader";
import { onNavProgressStart } from "@/lib/nav-progress";

// The one loading indicator for every page transition in the app —
// mounted once at the root, so there is never more than one instance
// showing at a time no matter how many things call startNavProgress()
// or how many <Link>s get clicked in quick succession (start() just
// resets the same timer rather than stacking).
export default function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);
  const showTimer = useRef<number | null>(null);
  const isFirstRender = useRef(true);

  function clearShowTimer() {
    if (showTimer.current !== null) {
      window.clearTimeout(showTimer.current);
      showTimer.current = null;
    }
  }

  function start() {
    clearShowTimer();
    // Below ~300ms a page transition reads as instant — showing anything
    // for that would just flash on screen, so the loader only commits to
    // appearing once a navigation has genuinely taken a moment.
    showTimer.current = window.setTimeout(() => setVisible(true), 300);
  }

  function finish() {
    clearShowTimer();
    setVisible(false);
  }

  // Route (or query) actually changed — the navigation this was tracking
  // has landed, so hide immediately.
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
  // so a bubble-phase listener here would always see defaultPrevented
  // already true. Capture phase runs on the way down to the target,
  // before Link's handler has touched the event at all.
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
    <div className="pointer-events-none fixed inset-0 z-[100] flex items-center justify-center bg-paper/70 backdrop-blur-[2px]">
      <PawLoader />
    </div>
  );
}
