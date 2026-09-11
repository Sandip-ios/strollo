import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { homeRouteForRole } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import AdminHeader from "@/components/layout/AdminHeader";
import NewBookingsAlert from "@/components/admin/NewBookingsAlert";

export default async function AdminPage() {
  const session = getSession();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN") redirect(homeRouteForRole(session.role));

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) redirect("/login");

  const [needsWalkerBookings, walkers] = await Promise.all([
    prisma.booking.findMany({
      where: { deletedAt: null, status: { in: ["CONFIRMED", "APPROVED"] }, walkerId: null },
      include: { customer: true, plan: true, bookingDogs: { include: { dog: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.walker.findMany({
      where: { deletedAt: null, isActive: true },
      include: { serviceAreas: { include: { city: true } } },
      orderBy: { name: "asc" },
    }),
  ]);

  const newBookingRows = needsWalkerBookings.map((b) => ({
    id: b.id,
    customerName: b.customer.name ?? b.customer.mobileNumber,
    planName: b.plan.name,
    dogNames: b.bookingDogs.map((bd) => bd.dog.name),
  }));

  const walkerOptions = walkers.map((w) => ({
    id: w.id,
    name: w.name,
    mobileNumber: w.mobileNumber,
    area: w.serviceAreas.length > 0 ? w.serviceAreas.map((a) => a.name).join(", ") : "no areas assigned",
  }));

  return (
    <main className="min-h-screen bg-paper">
      <AdminHeader active="/admin" />

      <div className="mx-auto max-w-4xl px-6 py-10 sm:px-10">
        <h1 className="font-display text-2xl font-semibold text-ink">
          Welcome{user.name ? `, ${user.name.split(" ")[0]}` : ""}
        </h1>
        <p className="mt-1 text-sm text-ink/60">Here&apos;s what needs your attention.</p>

        <NewBookingsAlert initialBookings={newBookingRows} walkers={walkerOptions} />

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Link
            href="/admin/bookings"
            className="rounded-xl border border-sand bg-white p-6 transition hover:border-navy-300 hover:shadow-sm"
          >
            <h2 className="font-display text-lg font-semibold text-navy-700">Bookings</h2>
            <p className="mt-1 text-sm text-ink/60">
              View bookings and assign walkers.
            </p>
          </Link>
          <Link
            href="/admin/customers"
            className="rounded-xl border border-sand bg-white p-6 transition hover:border-navy-300 hover:shadow-sm"
          >
            <h2 className="font-display text-lg font-semibold text-navy-700">Customers</h2>
            <p className="mt-1 text-sm text-ink/60">
              Browse customer accounts, their dogs, and booking history.
            </p>
          </Link>
          <Link
            href="/admin/walkers"
            className="rounded-xl border border-sand bg-white p-6 transition hover:border-navy-300 hover:shadow-sm"
          >
            <h2 className="font-display text-lg font-semibold text-navy-700">Walkers</h2>
            <p className="mt-1 text-sm text-ink/60">Add and manage dog walkers.</p>
          </Link>
          <Link
            href="/admin/service-areas"
            className="rounded-xl border border-sand bg-white p-6 transition hover:border-navy-300 hover:shadow-sm"
          >
            <h2 className="font-display text-lg font-semibold text-navy-700">Cities & Service Areas</h2>
            <p className="mt-1 text-sm text-ink/60">
              Control which cities and localities can book a walk.
            </p>
          </Link>
          <Link
            href="/admin/plans"
            className="rounded-xl border border-sand bg-white p-6 transition hover:border-navy-300 hover:shadow-sm"
          >
            <h2 className="font-display text-lg font-semibold text-navy-700">
              Plans &amp; Pricing
            </h2>
            <p className="mt-1 text-sm text-ink/60">
              Manage Monthly, Weekly, and custom plan pricing.
            </p>
          </Link>
          <Link
            href="/admin/reports"
            className="rounded-xl border border-sand bg-white p-6 transition hover:border-navy-300 hover:shadow-sm"
          >
            <h2 className="font-display text-lg font-semibold text-navy-700">Reports</h2>
            <p className="mt-1 text-sm text-ink/60">
              Revenue, bookings, and walker activity at a glance.
            </p>
          </Link>
        </div>
      </div>
    </main>
  );
}
