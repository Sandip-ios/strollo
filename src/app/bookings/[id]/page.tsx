import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AppHeader from "@/components/layout/AppHeader";
import CancelWalkButton from "@/components/booking/CancelWalkButton";
import WalkDetails from "@/components/booking/WalkDetails";
import LiveWalkStatus from "@/components/booking/LiveWalkStatus";
import {
  WALK_SLOTS,
  WALK_DURATION_MINUTES,
  CANCELLATION_LEAD_HOURS,
  WALK_STATUS_LABELS,
  WALK_STATUS_TONES,
  canCancelWalk,
  homeRouteForRole,
} from "@/lib/constants";

const STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: "Payment pending",
  CONFIRMED: "Payment confirmed — awaiting walker assignment",
  APPROVED: "Awaiting walker assignment",
  WALKER_ASSIGNED: "Walker assigned",
  ACTIVE: "Active",
  COMPLETED: "Completed",
  EXPIRED: "Expired",
  CANCELLED: "Cancelled",
};

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export default async function BookingDetailPage({ params }: { params: { id: string } }) {
  const session = getSession();
  if (!session) redirect("/login");
  if (session.role !== "CUSTOMER") redirect(homeRouteForRole(session.role));

  const booking = await prisma.booking.findFirst({
    where: { id: params.id, customerId: session.userId, deletedAt: null },
    include: {
      plan: true,
      address: true,
      walker: true,
      bookingDogs: { include: { dog: true } },
      walks: { orderBy: { scheduledDate: "asc" }, include: { photos: true, events: { orderBy: { occurredAt: "asc" } } } },
      payment: true,
    },
  });

  if (!booking) notFound();

  const slotLabel = WALK_SLOTS.find((s) => s.value === booking.slot);
  const completedCount = booking.walks.filter((w) => w.status === "COMPLETED").length;
  const ongoingWalk = booking.walks.find((w) => w.status === "ON_GOING");

  return (
    <main className="min-h-screen bg-paper pb-20 sm:pb-0">
      <AppHeader active="/bookings" />
      <div className="mx-auto max-w-2xl px-6 py-10 sm:px-10">
        <h1 className="font-display text-2xl font-semibold text-ink">{booking.plan.name}</h1>
        <p className="mb-6 mt-1 text-sm text-ink/60">{STATUS_LABELS[booking.status]}</p>

        {ongoingWalk && <LiveWalkStatus bookingId={booking.id} walkId={ongoingWalk.id} />}

        <div className="grid gap-4 rounded-xl border border-sand bg-white p-5 text-sm sm:grid-cols-2">
          <Detail label="Dogs" value={booking.bookingDogs.map((bd) => bd.dog.name).join(", ")} />
          <Detail label="Address" value={`${booking.address.label} — ${booking.address.line1}`} />
          <Detail label="Slot" value={`${slotLabel?.label} (${slotLabel?.time})`} />
          <Detail label="Walk duration" value={`${WALK_DURATION_MINUTES} minutes per walk`} />
          <Detail
            label="Duration"
            value={`${formatDate(booking.startDate)} – ${formatDate(booking.endDate)}`}
          />
          <Detail label="Walker" value={booking.walker?.name ?? "Not assigned yet"} />
          <div>
            <p className="text-xs text-ink/40">Amount paid</p>
            <p className="text-ink">₹{(booking.priceAtBooking / 100).toLocaleString("en-IN")}</p>
            {booking.payment?.refundAmount != null && (
              <p className="text-xs text-red-600">
                Refunded ₹{(booking.payment.refundAmount / 100).toLocaleString("en-IN")}
              </p>
            )}
            {booking.payment && ["SUCCESS", "REFUNDED"].includes(booking.payment.status) && (
              <a
                href={`/api/bookings/${booking.id}/invoice`}
                className="text-xs font-medium text-navy-600 underline underline-offset-2"
              >
                Download receipt
              </a>
            )}
          </div>
          {booking.carriedOverDays > 0 && (
            <Detail
              label="Carried forward"
              value={`+${booking.carriedOverDays} day${booking.carriedOverDays === 1 ? "" : "s"} from cancelled walks on a previous plan`}
            />
          )}
        </div>

        <p className="mt-4 text-xs text-ink/40">
          Bookings once confirmed cannot be cancelled, but you can cancel an individual
          day&apos;s walk up to {CANCELLATION_LEAD_HOURS} hours before it starts — cancelled
          days are added to your next plan.
        </p>

        <h2 className="mb-3 mt-8 font-display text-lg font-semibold text-ink">
          Walk timeline ({completedCount}/{booking.walks.length} completed)
        </h2>
        <div className="overflow-hidden rounded-xl border border-sand bg-white">
          {booking.walks.length === 0 ? (
            <p className="p-5 text-sm text-ink/50">
              Walk schedule will appear here once payment is confirmed.
            </p>
          ) : (
            <ul className="divide-y divide-sand">
              {booking.walks.map((walk) => {
                const cancellable =
                  walk.status === "SCHEDULED" && canCancelWalk(walk.scheduledDate, booking.slot);
                return (
                  <li key={walk.id}>
                    <div className="flex items-center justify-between px-5 py-3">
                      <span className="text-sm text-ink">{formatDate(walk.scheduledDate)}</span>
                      <div className="flex items-center gap-3">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${WALK_STATUS_TONES[walk.status]}`}
                        >
                          {WALK_STATUS_LABELS[walk.status]}
                        </span>
                        {cancellable && (
                          <CancelWalkButton
                            bookingId={booking.id}
                            walkId={walk.id}
                            dateLabel={formatDate(walk.scheduledDate)}
                          />
                        )}
                      </div>
                    </div>
                    <WalkDetails
                      walk={{
                        photos: walk.photos,
                        pooUpdate: walk.pooUpdate,
                        peeUpdate: walk.peeUpdate,
                        walkerNotes: walk.walkerNotes,
                        distanceMeters: walk.distanceMeters,
                        durationSec: walk.durationSec,
                        routePath: walk.routePath as { lat: number; lng: number; ts: number }[] | null,
                        events: walk.events.map((e) => ({
                          id: e.id,
                          type: e.type,
                          note: e.note,
                          photoUrl: e.photoUrl,
                          occurredAt: e.occurredAt.toISOString(),
                        })),
                        startTime: walk.startTime,
                        endTime: walk.endTime,
                        mood: walk.mood,
                      }}
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-ink/40">{label}</p>
      <p className="text-ink">{value}</p>
    </div>
  );
}
