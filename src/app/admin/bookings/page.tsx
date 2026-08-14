import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { homeRouteForRole } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import AdminHeader from "@/components/layout/AdminHeader";
import AdminBookingCard from "@/components/admin/AdminBookingCard";

export default async function AdminBookingsPage() {
  const session = getSession();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN") redirect(homeRouteForRole(session.role));

  const bookings = await prisma.booking.findMany({
    where: { deletedAt: null, status: { not: "PENDING_PAYMENT" } },
    include: {
      customer: true,
      address: true,
      walker: true,
      bookingDogs: { include: { dog: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const needsApproval = bookings.filter((b) => b.status === "CONFIRMED");
  const needsWalker = bookings.filter((b) => b.status === "APPROVED");
  const rest = bookings.filter((b) => !["CONFIRMED", "APPROVED"].includes(b.status));

  return (
    <main className="min-h-screen bg-paper">
      <AdminHeader active="/admin/bookings" />
      <div className="mx-auto max-w-4xl px-6 py-10 sm:px-10">
        <h1 className="font-display text-2xl font-semibold text-ink">Bookings</h1>
        <p className="mb-8 mt-1 text-sm text-ink/60">
          Approve confirmed bookings, then assign a walker so their walks can begin.
        </p>

        {bookings.length === 0 ? (
          <div className="rounded-xl border border-dashed border-sand bg-white/60 p-10 text-center">
            <p className="text-sm text-ink/60">No bookings yet.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {needsApproval.length > 0 && (
              <section>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-amber-600">
                  Needs Approval ({needsApproval.length})
                </h2>
                <div className="space-y-3">
                  {needsApproval.map((b) => (
                    <AdminBookingCard key={b.id} booking={b} />
                  ))}
                </div>
              </section>
            )}

            {needsWalker.length > 0 && (
              <section>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-red-600">
                  Needs Walker ({needsWalker.length})
                </h2>
                <div className="space-y-3">
                  {needsWalker.map((b) => (
                    <AdminBookingCard key={b.id} booking={b} />
                  ))}
                </div>
              </section>
            )}

            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink/40">
                All Other Bookings
              </h2>
              {rest.length === 0 ? (
                <p className="text-sm text-ink/50">Nothing else yet.</p>
              ) : (
                <div className="space-y-3">
                  {rest.map((b) => (
                    <AdminBookingCard key={b.id} booking={b} />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
