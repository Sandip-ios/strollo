import { redirect } from "next/navigation";
import Link from "next/link";
import { CalendarCheck } from "lucide-react";
import { getSession } from "@/lib/auth";
import { homeRouteForRole } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import AppHeader from "@/components/layout/AppHeader";
import BookingCard from "@/components/booking/BookingCard";

export default async function BookingsPage() {
  const session = getSession();
  if (!session) redirect("/login");
  if (session.role !== "CUSTOMER") redirect(homeRouteForRole(session.role));

  const bookings = await prisma.booking.findMany({
    where: { customerId: session.userId, deletedAt: null },
    include: {
      address: true,
      walker: true,
      bookingDogs: { include: { dog: true } },
      walks: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const active = bookings.filter((b) =>
    ["CONFIRMED", "APPROVED", "WALKER_ASSIGNED", "ACTIVE"].includes(b.status)
  );
  const completed = bookings.filter((b) => ["COMPLETED", "EXPIRED", "CANCELLED"].includes(b.status));

  return (
    <main className="min-h-screen bg-paper pb-28 sm:pb-0">
      <AppHeader active="/bookings" />
      <div className="mx-auto max-w-3xl px-6 py-10 sm:px-10">
        <div className="mb-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink">My Bookings</h1>
            <p className="mt-1 text-sm text-ink/60">
              Bookings once confirmed cannot be cancelled.
            </p>
          </div>
          <Link
            href="/book"
            className="w-full rounded-lg bg-navy-600 px-4 py-2 text-center text-sm font-semibold text-paper transition hover:bg-navy-700 sm:w-auto"
          >
            + Book a walk
          </Link>
        </div>

        {bookings.length === 0 ? (
          <div className="rounded-xl border border-dashed border-sand bg-white/60 p-10 text-center">
            <CalendarCheck className="mx-auto h-8 w-8 text-navy-300" strokeWidth={1.5} />
            <p className="mt-3 text-sm text-ink/60">No bookings yet.</p>
          </div>
        ) : (
          <div className="space-y-8">
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink/40">
                Upcoming &amp; Current
              </h2>
              {active.length === 0 ? (
                <p className="text-sm text-ink/50">Nothing active right now.</p>
              ) : (
                <div className="space-y-3">
                  {active.map((b) => (
                    <BookingCard key={b.id} booking={b} />
                  ))}
                </div>
              )}
            </section>

            {completed.length > 0 && (
              <section>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink/40">
                  History
                </h2>
                <div className="space-y-3">
                  {completed.map((b) => (
                    <BookingCard key={b.id} booking={b} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
