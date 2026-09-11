import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format-date";
import AdminHeader from "@/components/layout/AdminHeader";
import AssignWalkerPanel from "@/components/admin/AssignWalkerPanel";
import CancelBookingButton from "@/components/admin/CancelBookingButton";
import WalkDetails from "@/components/booking/WalkDetails";
import {
  WALK_SLOTS,
  WALK_DURATION_MINUTES,
  WALK_STATUS_LABELS,
  WALK_STATUS_TONES,
  homeRouteForRole,
} from "@/lib/constants";

const STATUS_LABELS: Record<string, string> = {
  CONFIRMED: "Confirmed — needs a walker",
  APPROVED: "Approved — needs walker",
  WALKER_ASSIGNED: "Walker assigned",
  ACTIVE: "Active",
  COMPLETED: "Completed",
  EXPIRED: "Expired",
  CANCELLED: "Cancelled",
};

const CANCELLABLE_STATUSES = ["CONFIRMED", "APPROVED", "WALKER_ASSIGNED", "ACTIVE"];

export default async function AdminBookingDetailPage({ params }: { params: { id: string } }) {
  const session = getSession();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN") redirect(homeRouteForRole(session.role));

  const [booking, walkers] = await Promise.all([
    prisma.booking.findFirst({
      where: { id: params.id, deletedAt: null },
      include: {
        customer: true,
        plan: true,
        address: true,
        walker: true,
        bookingDogs: { include: { dog: true } },
        walks: { orderBy: { scheduledDate: "asc" }, include: { photos: true, events: { orderBy: { occurredAt: "asc" } } } },
        payment: true,
      },
    }),
    prisma.walker.findMany({
      where: { deletedAt: null, isActive: true },
      include: { serviceAreas: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!booking) notFound();

  const slotLabel = WALK_SLOTS.find((s) => s.value === booking.slot);

  return (
    <main className="min-h-screen bg-paper">
      <AdminHeader active="/admin/bookings" />
      <div className="mx-auto max-w-2xl px-6 py-10 sm:px-10">
        <h1 className="font-display text-2xl font-semibold text-ink">
          {booking.customer.name ?? booking.customer.mobileNumber}
        </h1>
        <p className="mt-1 text-sm text-ink/60">{STATUS_LABELS[booking.status]}</p>

        <div className="mt-6 grid gap-4 rounded-xl border border-sand bg-white p-5 text-sm sm:grid-cols-2">
          <Detail label="Customer" value={`${booking.customer.name ?? "—"} · ${booking.customer.mobileNumber}`} />
          <Detail label="Dogs" value={booking.bookingDogs.map((bd) => bd.dog.name).join(", ")} />
          <Detail label="Address" value={`${booking.address.label}, ${booking.address.houseNumber} — ${booking.address.line1}, ${booking.address.city}`} />
          <Detail label="Slot" value={`${slotLabel?.label} (${slotLabel?.time})`} />
          <Detail label="Walk duration" value={`${WALK_DURATION_MINUTES} minutes`} />
          <Detail label="Duration" value={`${formatDate(booking.startDate)} – ${formatDate(booking.endDate)}`} />
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
          <Detail label="Total walks" value={String(booking.walks.length)} />
        </div>

        <div className="mt-6 space-y-4">
          {["CONFIRMED", "APPROVED", "WALKER_ASSIGNED", "ACTIVE"].includes(booking.status) && (
            <AssignWalkerPanel
              bookingId={booking.id}
              currentWalkerId={booking.walkerId}
              walkers={walkers.map((w) => ({
                id: w.id,
                name: w.name,
                mobileNumber: w.mobileNumber,
                area: w.serviceAreas.length > 0 ? w.serviceAreas.map((a) => a.name).join(", ") : "no areas assigned",
              }))}
            />
          )}
          {CANCELLABLE_STATUSES.includes(booking.status) && (
            <CancelBookingButton
              bookingId={booking.id}
              status={booking.status}
              totalWalks={booking.walks.length}
              remainingScheduledWalks={booking.walks.filter((w) => w.status === "SCHEDULED").length}
              priceAtBookingPaise={booking.priceAtBooking}
            />
          )}
        </div>

        <h2 className="mb-3 mt-8 font-display text-lg font-semibold text-ink">Walk schedule</h2>
        <div className="overflow-hidden rounded-xl border border-sand bg-white">
          <ul className="divide-y divide-sand">
            {booking.walks.map((walk) => (
              <li key={walk.id}>
                <div className="flex items-center justify-between px-5 py-3 text-sm">
                  <span className="text-ink">{formatDate(walk.scheduledDate)}</span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${WALK_STATUS_TONES[walk.status]}`}
                  >
                    {WALK_STATUS_LABELS[walk.status]}
                  </span>
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
            ))}
          </ul>
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
