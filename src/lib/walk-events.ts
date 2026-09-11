import { Droplet, Circle, GlassWater, Smile, BedDouble, MoreHorizontal, type LucideIcon } from "lucide-react";

export type WalkEventTypeValue = "PEE" | "POO" | "DRANK_WATER" | "HAPPY" | "RESTED" | "OTHER";

export const WALK_EVENT_TYPES: {
  value: WalkEventTypeValue;
  label: string;
  icon: LucideIcon;
  iconClass: string;
  dotClass: string;
  bgClass: string;
  // Tappable presets shown in the walker's "Add event" form so a note can
  // be logged with one tap instead of typing every time — the free-text
  // box underneath is still there for anything these don't cover.
  quickNotes: string[];
}[] = [
  {
    value: "PEE",
    label: "Pee",
    icon: Droplet,
    iconClass: "text-amber-500",
    dotClass: "bg-amber-400",
    bgClass: "bg-amber-50",
    quickNotes: ["Normal", "Small amount", "Large amount", "Marked territory"],
  },
  {
    value: "POO",
    label: "Poo",
    icon: Circle,
    iconClass: "text-amber-800",
    dotClass: "bg-amber-800",
    bgClass: "bg-amber-50",
    quickNotes: ["Normal", "Soft stool", "Small amount", "Didn't poop"],
  },
  {
    value: "DRANK_WATER",
    label: "Drank water",
    icon: GlassWater,
    iconClass: "text-sky-500",
    dotClass: "bg-sky-400",
    bgClass: "bg-sky-50",
    quickNotes: ["A little", "A lot", "Refused water"],
  },
  {
    value: "HAPPY",
    label: "Happy",
    icon: Smile,
    iconClass: "text-emerald-500",
    dotClass: "bg-emerald-400",
    bgClass: "bg-emerald-50",
    quickNotes: ["Very playful", "Calm & happy", "Excited to see other dogs"],
  },
  {
    value: "RESTED",
    label: "Rest",
    icon: BedDouble,
    iconClass: "text-violet-500",
    dotClass: "bg-violet-400",
    bgClass: "bg-violet-50",
    quickNotes: ["Needed a break", "Rested in shade", "Seemed tired"],
  },
  {
    value: "OTHER",
    label: "Other",
    icon: MoreHorizontal,
    iconClass: "text-ink/50",
    dotClass: "bg-ink/30",
    bgClass: "bg-sand/40",
    quickNotes: [],
  },
];

export function walkEventMeta(type: string) {
  return WALK_EVENT_TYPES.find((t) => t.value === type) ?? WALK_EVENT_TYPES[WALK_EVENT_TYPES.length - 1];
}

export const WALK_MOODS: { value: "NOT_GOOD" | "OKAY" | "GOOD" | "EXCELLENT"; label: string; emoji: string }[] = [
  { value: "NOT_GOOD", label: "Not good", emoji: "😕" },
  { value: "OKAY", label: "Okay", emoji: "🙂" },
  { value: "GOOD", label: "Good", emoji: "😊" },
  { value: "EXCELLENT", label: "Excellent", emoji: "🤩" },
];
