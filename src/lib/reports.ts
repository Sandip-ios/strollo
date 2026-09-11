import { prisma } from "@/lib/prisma";

export type DateRange = { from: Date; to: Date };

export const REPORT_PRESETS = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
  { value: "90d", label: "Last 90 days" },
] as const;

export type ReportPreset = (typeof REPORT_PRESETS)[number]["value"];

// Resolves the admin's date-filter choice (a preset, or an explicit
// from/to pair) into a concrete range. `to` is always pushed to the end
// of that calendar day so "today" is fully included, not cut off at
// midnight.
export function resolveDateRange(params: { preset?: string; from?: string; to?: string }): {
  range: DateRange;
  preset: ReportPreset | "custom";
} {
  if (params.from && params.to) {
    const from = new Date(params.from);
    from.setHours(0, 0, 0, 0);
    const to = new Date(params.to);
    to.setHours(23, 59, 59, 999);
    return { range: { from, to }, preset: "custom" };
  }

  const preset = (REPORT_PRESETS.find((p) => p.value === params.preset)?.value ?? "30d") as ReportPreset;
  const to = new Date();
  to.setHours(23, 59, 59, 999);
  const from = new Date();
  from.setHours(0, 0, 0, 0);

  if (preset === "7d") from.setDate(from.getDate() - 6);
  else if (preset === "30d") from.setDate(from.getDate() - 29);
  else if (preset === "90d") from.setDate(from.getDate() - 89);
  else if (preset === "week") from.setDate(from.getDate() - from.getDay());
  else if (preset === "month") from.setDate(1);

  return { range: { from, to }, preset };
}

export function toDateInputValue(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export type WalkerReportRow = {
  id: string;
  name: string;
  mobileNumber: string;
  areas: string;
  walksCompleted: number;
  walksMissed: number;
  distanceKm: number;
  avgRating: number | null;
  ratingCount: number;
  isActive: boolean;
};

export async function getWalkerReport(range: DateRange): Promise<WalkerReportRow[]> {
  const walkers = await prisma.walker.findMany({
    where: { deletedAt: null },
    include: {
      serviceAreas: true,
      walks: {
        where: { scheduledDate: { gte: range.from, lte: range.to }, status: { in: ["COMPLETED", "MISSED"] } },
        select: { status: true, distanceMeters: true },
      },
      ratings: { select: { score: true } },
    },
    orderBy: { name: "asc" },
  });

  return walkers.map((w) => {
    const completed = w.walks.filter((x) => x.status === "COMPLETED");
    const missed = w.walks.filter((x) => x.status === "MISSED");
    const distanceMeters = completed.reduce((sum, x) => sum + (x.distanceMeters ?? 0), 0);
    const avgRating = w.ratings.length > 0 ? w.ratings.reduce((s, r) => s + r.score, 0) / w.ratings.length : null;
    return {
      id: w.id,
      name: w.name,
      mobileNumber: w.mobileNumber,
      areas: w.serviceAreas.length > 0 ? w.serviceAreas.map((a) => a.name).join(", ") : "—",
      walksCompleted: completed.length,
      walksMissed: missed.length,
      distanceKm: Math.round((distanceMeters / 1000) * 10) / 10,
      avgRating: avgRating !== null ? Math.round(avgRating * 10) / 10 : null,
      ratingCount: w.ratings.length,
      isActive: w.isActive,
    };
  });
}

export type DogReportRow = {
  id: string;
  name: string;
  breed: string;
  ownerName: string;
  ownerMobile: string;
  walksInRange: number;
  vaccinated: boolean;
  hasActiveBooking: boolean;
};

export async function getDogReport(range: DateRange): Promise<DogReportRow[]> {
  const dogs = await prisma.dog.findMany({
    where: { deletedAt: null },
    include: {
      user: { select: { name: true, mobileNumber: true } },
      bookingDogs: {
        include: {
          booking: {
            select: {
              status: true,
              walks: { where: { scheduledDate: { gte: range.from, lte: range.to }, status: "COMPLETED" }, select: { id: true } },
            },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  const ACTIVE_STATUSES = new Set(["APPROVED", "WALKER_ASSIGNED", "ACTIVE"]);

  return dogs.map((d) => {
    const walksInRange = d.bookingDogs.reduce((sum, bd) => sum + bd.booking.walks.length, 0);
    const hasActiveBooking = d.bookingDogs.some((bd) => ACTIVE_STATUSES.has(bd.booking.status));
    return {
      id: d.id,
      name: d.name,
      breed: d.breed,
      ownerName: d.user.name ?? "—",
      ownerMobile: d.user.mobileNumber,
      walksInRange,
      vaccinated: d.vaccinations.length > 0,
      hasActiveBooking,
    };
  });
}

export type CustomerReportRow = {
  id: string;
  name: string;
  mobileNumber: string;
  joinedAt: Date;
  dogCount: number;
  bookingsInRange: number;
  spendInRangePaise: number;
};

export async function getCustomerReport(range: DateRange): Promise<CustomerReportRow[]> {
  const customers = await prisma.user.findMany({
    where: { role: "CUSTOMER", deletedAt: null },
    include: {
      dogs: { where: { deletedAt: null }, select: { id: true } },
      bookings: {
        where: { deletedAt: null, createdAt: { gte: range.from, lte: range.to } },
        select: { id: true, payment: { select: { status: true, amount: true, refundAmount: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return customers.map((c) => {
    const spendInRangePaise = c.bookings.reduce((sum, b) => {
      if (!b.payment || !["SUCCESS", "REFUNDED"].includes(b.payment.status)) return sum;
      return sum + (b.payment.amount - (b.payment.refundAmount ?? 0));
    }, 0);
    return {
      id: c.id,
      name: c.name ?? "—",
      mobileNumber: c.mobileNumber,
      joinedAt: c.createdAt,
      dogCount: c.dogs.length,
      bookingsInRange: c.bookings.length,
      spendInRangePaise,
    };
  });
}

// Minimal CSV writer — no external dependency needed for a handful of
// flat, admin-only report tables. Wraps every field in quotes and
// escapes embedded quotes, which is enough for RFC 4180 compatibility
// with Excel/Sheets given none of our fields contain newlines by design.
export function toCsv(headers: string[], rows: (string | number)[][]): string {
  const escape = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const lines = [headers.map(escape).join(","), ...rows.map((r) => r.map(escape).join(","))];
  return lines.join("\r\n");
}
