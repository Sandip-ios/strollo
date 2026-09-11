import { redirect } from "next/navigation";
import Link from "next/link";
import { Download } from "lucide-react";
import { getSession } from "@/lib/auth";
import { homeRouteForRole } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format-date";
import AdminHeader from "@/components/layout/AdminHeader";
import ReportBarList from "@/components/admin/ReportBarList";
import {
  resolveDateRange,
  toDateInputValue,
  getWalkerReport,
  getDogReport,
  getCustomerReport,
  REPORT_PRESETS,
} from "@/lib/reports";

const BOOKING_STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: "Pending payment",
  CONFIRMED: "Needs approval",
  APPROVED: "Needs walker",
  WALKER_ASSIGNED: "Walker assigned",
  ACTIVE: "Active",
  COMPLETED: "Completed",
  EXPIRED: "Expired",
  CANCELLED: "Cancelled",
};

const REPORT_TABS = [
  { value: "overview", label: "Overview" },
  { value: "walkers", label: "Walkers" },
  { value: "dogs", label: "Dogs" },
  { value: "customers", label: "Customers" },
] as const;

type ReportTab = (typeof REPORT_TABS)[number]["value"];

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string) {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
}

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: { type?: string; preset?: string; from?: string; to?: string };
}) {
  const session = getSession();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN") redirect(homeRouteForRole(session.role));

  const tab: ReportTab = (REPORT_TABS.find((t) => t.value === searchParams.type)?.value ?? "overview") as ReportTab;
  const { range, preset } = resolveDateRange(searchParams);

  const qs = (overrides: Record<string, string>) => {
    const params = new URLSearchParams({
      type: tab,
      preset: preset === "custom" ? "" : preset,
      from: preset === "custom" ? toDateInputValue(range.from) : "",
      to: preset === "custom" ? toDateInputValue(range.to) : "",
      ...overrides,
    });
    for (const [k, v] of Array.from(params.entries())) if (!v) params.delete(k);
    return `?${params.toString()}`;
  };

  return (
    <main className="min-h-screen bg-paper">
      <AdminHeader active="/admin/reports" />
      <div className="mx-auto max-w-4xl px-6 py-10 sm:px-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink">Reports</h1>
            <p className="mt-1 text-sm text-ink/60">
              Revenue, bookings, and activity — filterable by date, downloadable as CSV.
            </p>
          </div>
          {tab !== "overview" && (
            <a
              href={`/api/admin/reports/export${qs({})}`}
              className="flex w-full shrink-0 items-center justify-center gap-1.5 rounded-lg border border-navy-200 px-4 py-2 text-sm font-semibold text-navy-600 transition hover:bg-navy-50 sm:w-auto"
            >
              <Download className="h-4 w-4" strokeWidth={2} />
              Download CSV
            </a>
          )}
        </div>

        {/* Tabs */}
        <div className="mt-6 flex gap-2 overflow-x-auto">
          {REPORT_TABS.map((t) => (
            <Link
              key={t.value}
              href={qs({ type: t.value })}
              className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
                tab === t.value ? "border-navy-500 bg-navy-50 text-navy-700" : "border-sand bg-white text-ink/60 hover:border-navy-200"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>

        {/* Date filter */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {REPORT_PRESETS.map((p) => (
            <Link
              key={p.value}
              href={qs({ preset: p.value, from: "", to: "" })}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition ${
                preset === p.value ? "bg-navy-600 text-paper" : "bg-sand/50 text-ink/60 hover:bg-sand"
              }`}
            >
              {p.label}
            </Link>
          ))}
          <form className="flex items-center gap-2" method="GET">
            <input type="hidden" name="type" value={tab} />
            <input
              type="date"
              name="from"
              defaultValue={toDateInputValue(range.from)}
              className="rounded-lg border border-sand bg-white px-2 py-1 text-xs text-ink outline-none focus:border-navy-500"
            />
            <span className="text-xs text-ink/40">to</span>
            <input
              type="date"
              name="to"
              defaultValue={toDateInputValue(range.to)}
              className="rounded-lg border border-sand bg-white px-2 py-1 text-xs text-ink outline-none focus:border-navy-500"
            />
            <button type="submit" className="rounded-lg bg-navy-600 px-3 py-1 text-xs font-semibold text-paper hover:bg-navy-700">
              Apply
            </button>
          </form>
        </div>
        <p className="mt-2 text-xs text-ink/40">
          Showing {formatDate(range.from)} – {formatDate(range.to)}
        </p>

        <div className="mt-6">
          {tab === "overview" && <OverviewTab />}
          {tab === "walkers" && <WalkersTab range={range} />}
          {tab === "dogs" && <DogsTab range={range} />}
          {tab === "customers" && <CustomersTab range={range} />}
        </div>
      </div>
    </main>
  );
}

async function OverviewTab() {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const [
    settledPayments,
    customerCount,
    walkerCount,
    activeBookingCount,
    bookingsByStatus,
    bookingsWithPlan,
    completedWalksByWalker,
  ] = await Promise.all([
    prisma.payment.findMany({
      where: { status: { in: ["SUCCESS", "REFUNDED"] } },
      select: { amount: true, refundAmount: true, updatedAt: true },
    }),
    prisma.user.count({ where: { role: "CUSTOMER", deletedAt: null } }),
    prisma.walker.count({ where: { deletedAt: null } }),
    prisma.booking.count({
      where: { deletedAt: null, status: { in: ["APPROVED", "WALKER_ASSIGNED", "ACTIVE"] } },
    }),
    prisma.booking.groupBy({ by: ["status"], where: { deletedAt: null }, _count: true }),
    prisma.booking.findMany({
      where: { deletedAt: null, status: { not: "PENDING_PAYMENT" } },
      select: { plan: { select: { name: true } } },
    }),
    prisma.walkInstance.groupBy({
      by: ["walkerId"],
      where: { status: "COMPLETED", walkerId: { not: null } },
      _count: true,
    }),
  ]);

  const netAmount = (p: { amount: number; refundAmount: number | null }) => p.amount - (p.refundAmount ?? 0);
  const revenueTotalPaise = settledPayments.reduce((sum, p) => sum + netAmount(p), 0);

  const revenueByMonth = new Map<string, number>();
  for (let i = 0; i < 6; i++) {
    const d = new Date(sixMonthsAgo);
    d.setMonth(d.getMonth() + i);
    revenueByMonth.set(monthKey(d), 0);
  }
  for (const p of settledPayments) {
    if (p.updatedAt < sixMonthsAgo) continue;
    const key = monthKey(p.updatedAt);
    revenueByMonth.set(key, (revenueByMonth.get(key) ?? 0) + netAmount(p));
  }

  const planCounts = new Map<string, number>();
  for (const b of bookingsWithPlan) {
    planCounts.set(b.plan.name, (planCounts.get(b.plan.name) ?? 0) + 1);
  }

  const walkerIds = completedWalksByWalker.map((w) => w.walkerId).filter((id): id is string => id !== null);
  const walkers = await prisma.walker.findMany({ where: { id: { in: walkerIds } }, select: { id: true, name: true } });
  const walkerNameById = new Map(walkers.map((w) => [w.id, w.name]));
  const walkerLeaderboard = completedWalksByWalker
    .map((w) => ({ label: walkerNameById.get(w.walkerId!) ?? "Unknown", value: w._count }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  return (
    <>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile label="Total revenue" value={`₹${(revenueTotalPaise / 100).toLocaleString("en-IN")}`} />
        <StatTile label="Active bookings" value={String(activeBookingCount)} />
        <StatTile label="Customers" value={String(customerCount)} />
        <StatTile label="Walkers" value={String(walkerCount)} />
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <div className="rounded-xl border border-sand bg-white p-5">
          <h2 className="mb-4 font-display text-base font-semibold text-ink">Revenue — last 6 months</h2>
          <ReportBarList
            emptyText="No successful payments yet."
            rows={Array.from(revenueByMonth.entries()).map(([key, amount]) => ({
              label: monthLabel(key),
              value: amount,
              displayValue: `₹${(amount / 100).toLocaleString("en-IN")}`,
            }))}
          />
        </div>

        <div className="rounded-xl border border-sand bg-white p-5">
          <h2 className="mb-4 font-display text-base font-semibold text-ink">Bookings by status</h2>
          <ReportBarList
            emptyText="No bookings yet."
            rows={bookingsByStatus
              .filter((b) => b.status !== "PENDING_PAYMENT")
              .map((b) => ({ label: BOOKING_STATUS_LABELS[b.status] ?? b.status, value: b._count }))}
          />
        </div>

        <div className="rounded-xl border border-sand bg-white p-5">
          <h2 className="mb-4 font-display text-base font-semibold text-ink">Plan popularity</h2>
          <ReportBarList
            emptyText="No bookings yet."
            rows={Array.from(planCounts.entries())
              .map(([label, value]) => ({ label, value }))
              .sort((a, b) => b.value - a.value)}
          />
        </div>

        <div className="rounded-xl border border-sand bg-white p-5">
          <h2 className="mb-4 font-display text-base font-semibold text-ink">Walker leaderboard — walks completed</h2>
          <ReportBarList emptyText="No completed walks yet." rows={walkerLeaderboard} />
        </div>
      </div>
    </>
  );
}

async function WalkersTab({ range }: { range: { from: Date; to: Date } }) {
  const rows = await getWalkerReport(range);
  return (
    <ReportTable
      emptyText="No walkers yet."
      headers={["Walker", "Areas", "Completed", "Missed", "Distance", "Rating", "Status"]}
      rows={rows.map((w) => [
        `${w.name} · ${w.mobileNumber}`,
        w.areas,
        String(w.walksCompleted),
        String(w.walksMissed),
        `${w.distanceKm} km`,
        w.avgRating !== null ? `${w.avgRating} ★ (${w.ratingCount})` : "No ratings",
        w.isActive ? "Active" : "Inactive",
      ])}
      isEmpty={rows.length === 0}
    />
  );
}

async function DogsTab({ range }: { range: { from: Date; to: Date } }) {
  const rows = await getDogReport(range);
  return (
    <ReportTable
      emptyText="No dogs yet."
      headers={["Dog", "Breed", "Owner", "Walks in range", "Vaccinated", "Active booking"]}
      rows={rows.map((d) => [
        d.name,
        d.breed,
        `${d.ownerName} · ${d.ownerMobile}`,
        String(d.walksInRange),
        d.vaccinated ? "Yes" : "No",
        d.hasActiveBooking ? "Yes" : "No",
      ])}
      isEmpty={rows.length === 0}
    />
  );
}

async function CustomersTab({ range }: { range: { from: Date; to: Date } }) {
  const rows = await getCustomerReport(range);
  return (
    <ReportTable
      emptyText="No customers yet."
      headers={["Customer", "Joined", "Dogs", "Bookings in range", "Spend in range"]}
      rows={rows.map((c) => [
        `${c.name} · ${c.mobileNumber}`,
        formatDate(c.joinedAt),
        String(c.dogCount),
        String(c.bookingsInRange),
        `₹${(c.spendInRangePaise / 100).toLocaleString("en-IN")}`,
      ])}
      isEmpty={rows.length === 0}
    />
  );
}

function ReportTable({
  headers,
  rows,
  isEmpty,
  emptyText,
}: {
  headers: string[];
  rows: string[][];
  isEmpty: boolean;
  emptyText: string;
}) {
  if (isEmpty) {
    return (
      <div className="rounded-xl border border-dashed border-sand bg-white/60 p-10 text-center">
        <p className="text-sm text-ink/60">{emptyText}</p>
      </div>
    );
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-sand bg-white">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-sand bg-sand/20 text-xs uppercase tracking-wide text-ink/50">
          <tr>
            {headers.map((h) => (
              <th key={h} className="whitespace-nowrap px-4 py-2.5 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-sand">
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j} className="whitespace-nowrap px-4 py-3 text-ink">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-sand bg-white p-4">
      <p className="text-xs text-ink/50">{label}</p>
      <p className="mt-1 font-display text-xl font-semibold text-navy-700">{value}</p>
    </div>
  );
}
