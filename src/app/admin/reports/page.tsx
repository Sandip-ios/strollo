import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { homeRouteForRole } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import AdminHeader from "@/components/layout/AdminHeader";
import ReportBarList from "@/components/admin/ReportBarList";

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

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string) {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
}

export default async function AdminReportsPage() {
  const session = getSession();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN") redirect(homeRouteForRole(session.role));

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
    // SUCCESS + REFUNDED together, net of any refundAmount — a fully
    // refunded payment should drop to ~0 revenue, not vanish from the
    // total entirely the way filtering to status:"SUCCESS" alone would.
    prisma.payment.findMany({
      where: { status: { in: ["SUCCESS", "REFUNDED"] } },
      select: { amount: true, refundAmount: true, updatedAt: true },
    }),
    prisma.user.count({ where: { role: "CUSTOMER", deletedAt: null } }),
    prisma.walker.count({ where: { deletedAt: null } }),
    prisma.booking.count({
      where: { deletedAt: null, status: { in: ["APPROVED", "WALKER_ASSIGNED", "ACTIVE"] } },
    }),
    prisma.booking.groupBy({
      by: ["status"],
      where: { deletedAt: null },
      _count: true,
    }),
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

  const netAmount = (p: { amount: number; refundAmount: number | null }) =>
    p.amount - (p.refundAmount ?? 0);
  const revenueTotalPaise = settledPayments.reduce((sum, p) => sum + netAmount(p), 0);

  // Revenue by month, last 6 months — grouped in JS since it's a small,
  // bounded dataset and avoids a raw SQL date-trunc query.
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

  const walkerIds = completedWalksByWalker
    .map((w) => w.walkerId)
    .filter((id): id is string => id !== null);
  const walkers = await prisma.walker.findMany({
    where: { id: { in: walkerIds } },
    select: { id: true, name: true },
  });
  const walkerNameById = new Map(walkers.map((w) => [w.id, w.name]));
  const walkerLeaderboard = completedWalksByWalker
    .map((w) => ({
      label: walkerNameById.get(w.walkerId!) ?? "Unknown",
      value: w._count,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  return (
    <main className="min-h-screen bg-paper">
      <AdminHeader active="/admin/reports" />
      <div className="mx-auto max-w-4xl px-6 py-10 sm:px-10">
        <h1 className="font-display text-2xl font-semibold text-ink">Reports</h1>
        <p className="mb-8 mt-1 text-sm text-ink/60">
          Revenue, bookings, and walker activity at a glance.
        </p>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatTile
            label="Total revenue"
            value={`₹${(revenueTotalPaise / 100).toLocaleString("en-IN")}`}
          />
          <StatTile label="Active bookings" value={String(activeBookingCount)} />
          <StatTile label="Customers" value={String(customerCount)} />
          <StatTile label="Walkers" value={String(walkerCount)} />
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <div className="rounded-xl border border-sand bg-white p-5">
            <h2 className="mb-4 font-display text-base font-semibold text-ink">
              Revenue — last 6 months
            </h2>
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
            <h2 className="mb-4 font-display text-base font-semibold text-ink">
              Bookings by status
            </h2>
            <ReportBarList
              emptyText="No bookings yet."
              rows={bookingsByStatus
                .filter((b) => b.status !== "PENDING_PAYMENT")
                .map((b) => ({
                  label: BOOKING_STATUS_LABELS[b.status] ?? b.status,
                  value: b._count,
                }))}
            />
          </div>

          <div className="rounded-xl border border-sand bg-white p-5">
            <h2 className="mb-4 font-display text-base font-semibold text-ink">
              Plan popularity
            </h2>
            <ReportBarList
              emptyText="No bookings yet."
              rows={Array.from(planCounts.entries())
                .map(([label, value]) => ({ label, value }))
                .sort((a, b) => b.value - a.value)}
            />
          </div>

          <div className="rounded-xl border border-sand bg-white p-5">
            <h2 className="mb-4 font-display text-base font-semibold text-ink">
              Walker leaderboard — walks completed
            </h2>
            <ReportBarList emptyText="No completed walks yet." rows={walkerLeaderboard} />
          </div>
        </div>
      </div>
    </main>
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
