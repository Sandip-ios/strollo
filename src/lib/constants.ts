// Centralized business rules — referenced across booking, walk-generation,
// and UI copy so policy changes happen in exactly one place.

export const WALK_DURATION_MINUTES = 30;

export const WALK_SLOTS = [
  { value: "MORNING", label: "Morning", time: "9:00 AM – 12:00 PM" },
  { value: "AFTERNOON", label: "Afternoon", time: "12:00 PM – 3:00 PM" },
  { value: "EVENING", label: "Evening", time: "3:00 PM – 6:00 PM" },
  { value: "NIGHT", label: "Night", time: "6:00 PM – 9:00 PM" },
] as const;

// Slot start hour (24h, local server time) — used to compute the exact
// cutoff instant for cancelling a single day's walk. Keep in sync with the
// window text in WALK_SLOTS above.
export const WALK_SLOT_START_HOUR: Record<string, number> = {
  MORNING: 9,
  AFTERNOON: 12,
  EVENING: 15,
  NIGHT: 18,
};

// Sunday = 0 in JS Date.getDay(). No walks are generated on this day.
export const HOLIDAY_WEEKDAY = 0;

// The booking as a whole cannot be cancelled once confirmed — no
// cancel-the-plan endpoint/status exists. Individual days can be cancelled
// separately; see CANCELLATION_LEAD_HOURS below.
export const CANCELLATION_POLICY_TEXT =
  "Bookings once confirmed cannot be cancelled.";

// A single day's walk can be cancelled up to this many hours before its
// slot starts. Cancelled days are credited toward the customer's next
// booking (see carriedOverDays on Booking / carriedForward on WalkInstance).
export const CANCELLATION_LEAD_HOURS = 8;

export function getWalkSlotStart(scheduledDate: Date, slot: string): Date {
  const start = new Date(scheduledDate);
  start.setHours(WALK_SLOT_START_HOUR[slot] ?? 0, 0, 0, 0);
  return start;
}

export function canCancelWalk(scheduledDate: Date, slot: string, now: Date = new Date()): boolean {
  const slotStart = getWalkSlotStart(scheduledDate, slot);
  const hoursUntilSlot = (slotStart.getTime() - now.getTime()) / (1000 * 60 * 60);
  return hoursUntilSlot >= CANCELLATION_LEAD_HOURS;
}

export const WALK_STATUS_LABELS: Record<string, string> = {
  SCHEDULED: "Scheduled",
  ON_GOING: "In progress",
  COMPLETED: "Completed",
  MISSED: "Missed",
  CANCELLED: "Cancelled",
};

export const WALK_STATUS_TONES: Record<string, string> = {
  SCHEDULED: "bg-sand/60 text-ink/60",
  ON_GOING: "bg-navy-100 text-navy-700",
  COMPLETED: "bg-sky-100 text-sky-700",
  MISSED: "bg-red-100 text-red-700",
  CANCELLED: "bg-amber-100 text-amber-700",
};

// Monthly plan billing cycle: exactly 1 calendar month from the start date.
// e.g. start date 4th → end date 3rd of the following month (exclusive).
export function getMonthlyPlanEndDate(startDate: Date): Date {
  const end = new Date(startDate);
  end.setMonth(end.getMonth() + 1);
  end.setDate(end.getDate() - 1);
  return end;
}

// Weekly plan billing cycle: exactly 7 days from the start date (inclusive).
// e.g. start date 4th → end date 10th.
export function getWeeklyPlanEndDate(startDate: Date): Date {
  const end = new Date(startDate);
  end.setDate(end.getDate() + 6);
  return end;
}

// CUSTOM plans share the MONTHLY billing cycle (they only vary dog count
// and price, not duration) — only WEEKLY has a different cycle length.
export function getPlanEndDate(startDate: Date, planType: "TRIAL" | "WEEKLY" | "MONTHLY" | "CUSTOM"): Date {
  return planType === "WEEKLY" ? getWeeklyPlanEndDate(startDate) : getMonthlyPlanEndDate(startDate);
}

// Generates one walk-instance date per day in [startDate, endDate],
// skipping Sundays.
export function generateWalkDates(startDate: Date, endDate: Date): Date[] {
  const dates: Date[] = [];
  const cursor = new Date(startDate);
  while (cursor <= endDate) {
    if (cursor.getDay() !== HOLIDAY_WEEKDAY) {
      dates.push(new Date(cursor));
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

export const DEFAULT_MONTHLY_PLAN_PRICE_PAISE = 159900; // ₹1599

export function homeRouteForRole(role: "CUSTOMER" | "ADMIN" | "WALKER"): string {
  if (role === "ADMIN") return "/admin";
  if (role === "WALKER") return "/walker";
  return "/dashboard";
}
