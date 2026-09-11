import { PawPrint } from "lucide-react";

type Props = {
  className?: string;
  size?: "sm" | "md" | "lg";
};

const SIZES = { sm: "h-4 w-4", md: "h-7 w-7", lg: "h-10 w-10" };
const GAPS = { sm: "gap-1.5", md: "gap-3", lg: "gap-4" };

// Three paw prints stepping in sequence — the shared Strollo loading
// motif. Deliberately just the icon, no spinner/card/backdrop baked in,
// so this drops cleanly into a button, an inline empty-state, or a
// full-screen overlay (see NavigationProgress) alike.
export default function PawLoader({ className = "", size = "md" }: Props) {
  const paw = SIZES[size];
  return (
    <div className={`flex items-center ${GAPS[size]} ${className}`} role="status" aria-label="Loading">
      {/* delay-* is a transition-delay utility in Tailwind, which has no
          effect on a keyframe animation — the stagger here needs the
          arbitrary-value form to actually set animation-delay. */}
      <PawPrint className={`${paw} rotate-12 animate-paw-step text-navy-600`} strokeWidth={2} />
      <PawPrint className={`${paw} -rotate-12 animate-paw-step [animation-delay:150ms] text-sky-500`} strokeWidth={2} />
      <PawPrint className={`${paw} rotate-12 animate-paw-step [animation-delay:300ms] text-navy-600`} strokeWidth={2} />
    </div>
  );
}
