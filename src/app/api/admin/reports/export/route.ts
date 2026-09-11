import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/guards";
import { resolveDateRange, toDateInputValue, getWalkerReport, getDogReport, getCustomerReport, toCsv } from "@/lib/reports";
import { formatDate } from "@/lib/format-date";

export async function GET(req: NextRequest) {
  const { error } = requireAdmin();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") ?? "walkers";
  const { range } = resolveDateRange({
    preset: searchParams.get("preset") ?? undefined,
    from: searchParams.get("from") ?? undefined,
    to: searchParams.get("to") ?? undefined,
  });

  let csv: string;
  let filename: string;

  if (type === "dogs") {
    const rows = await getDogReport(range);
    csv = toCsv(
      ["Dog", "Breed", "Owner", "Owner mobile", "Walks in range", "Vaccinated", "Active booking"],
      rows.map((d) => [d.name, d.breed, d.ownerName, d.ownerMobile, d.walksInRange, d.vaccinated ? "Yes" : "No", d.hasActiveBooking ? "Yes" : "No"])
    );
    filename = "dog-report";
  } else if (type === "customers") {
    const rows = await getCustomerReport(range);
    csv = toCsv(
      ["Customer", "Mobile", "Joined", "Dogs", "Bookings in range", "Spend in range (INR)"],
      rows.map((c) => [c.name, c.mobileNumber, formatDate(c.joinedAt), c.dogCount, c.bookingsInRange, (c.spendInRangePaise / 100).toFixed(2)])
    );
    filename = "customer-report";
  } else {
    const rows = await getWalkerReport(range);
    csv = toCsv(
      ["Walker", "Mobile", "Areas", "Walks completed", "Walks missed", "Distance (km)", "Avg rating", "Rating count", "Status"],
      rows.map((w) => [
        w.name,
        w.mobileNumber,
        w.areas,
        w.walksCompleted,
        w.walksMissed,
        w.distanceKm,
        w.avgRating ?? "—",
        w.ratingCount,
        w.isActive ? "Active" : "Inactive",
      ])
    );
    filename = "walker-report";
  }

  const rangeSuffix = `${toDateInputValue(range.from)}_to_${toDateInputValue(range.to)}`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="strollo-${filename}-${rangeSuffix}.csv"`,
    },
  });
}
