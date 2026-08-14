import Link from "next/link";

type Booking = {
  id: string;
  status: string;
  slot: string;
  startDate: Date;
  endDate: Date;
  priceAtBooking: number;
  address: { label: string; city: string };
  bookingDogs: { dog: { name: string } }[];
  walks: { status: string }[];
  walker: { name: string } | null;
};

const STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: "Payment pending",
  CONFIRMED: "Payment confirmed — awaiting approval",
  APPROVED: "Approved — awaiting walker",
  WALKER_ASSIGNED: "Walker assigned",
  ACTIVE: "Active",
  COMPLETED: "Completed",
  EXPIRED: "Expired",
  CANCELLED: "Cancelled",
};

const STATUS_TONES: Record<string, string> = {
  PENDING_PAYMENT: "bg-sand/60 text-ink/60",
  CONFIRMED: "bg-sky-100 text-sky-700",
  APPROVED: "bg-sky-100 text-sky-700",
  WALKER_ASSIGNED: "bg-sky-100 text-sky-700",
  ACTIVE: "bg-navy-100 text-navy-700",
  COMPLETED: "bg-sand/60 text-ink/60",
  EXPIRED: "bg-red-100 text-red-700",
  CANCELLED: "bg-red-100 text-red-700",
};

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function BookingCard({ booking }: { booking: Booking }) {
  const completedWalks = booking.walks.filter((w) => w.status === "COMPLETED").length;

  return (
    <Link
      href={`/bookings/${booking.id}`}
      className="block rounded-xl border border-sand bg-white p-5 transition hover:border-navy-300 hover:shadow-sm"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-ink">
            {booking.bookingDogs.map((bd) => bd.dog.name).join(", ")}
          </p>
          <p className="text-xs text-ink/50">
            {booking.address.label} · {booking.address.city}
          </p>
        </div>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_TONES[booking.status]}`}>
          {STATUS_LABELS[booking.status]}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-ink/60">
        <span>
          {formatDate(booking.startDate)} – {formatDate(booking.endDate)}
        </span>
        <span className="font-mono">
          {completedWalks}/{booking.walks.length} walks done
        </span>
      </div>

      {booking.walker && (
        <p className="mt-2 text-xs text-ink/50">Walker: {booking.walker.name}</p>
      )}
    </Link>
  );
}
