import Link from "next/link";
import { formatDate } from "@/lib/format-date";

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
  CONFIRMED: "Awaiting walker",
  APPROVED: "Awaiting walker",
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

export default function BookingCard({ booking }: { booking: Booking }) {
  const completedWalks = booking.walks.filter((w) => w.status === "COMPLETED").length;

  return (
    <Link
      href={`/bookings/${booking.id}`}
      className="block rounded-xl border border-sand bg-white p-5 transition hover:border-navy-300 hover:shadow-sm"
    >
      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between sm:gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink">
            {booking.bookingDogs.map((bd) => bd.dog.name).join(", ")}
          </p>
          <p className="truncate text-xs text-ink/50">
            {booking.address.label} · {booking.address.city}
          </p>
        </div>
        <span
          className={`inline-block shrink-0 self-start whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_TONES[booking.status]}`}
        >
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
