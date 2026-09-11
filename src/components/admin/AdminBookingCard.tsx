import Link from "next/link";
import { formatDate } from "@/lib/format-date";

type Booking = {
  id: string;
  status: string;
  slot: string;
  startDate: Date;
  customer: { name: string | null; mobileNumber: string };
  address: { label: string; city: string };
  bookingDogs: { dog: { name: string } }[];
  walker: { name: string } | null;
};

const STATUS_LABELS: Record<string, string> = {
  CONFIRMED: "Needs a walker",
  APPROVED: "Needs walker",
  WALKER_ASSIGNED: "Walker assigned",
  ACTIVE: "Active",
  COMPLETED: "Completed",
  EXPIRED: "Expired",
  CANCELLED: "Cancelled",
};

const STATUS_TONES: Record<string, string> = {
  CONFIRMED: "bg-amber-100 text-amber-700",
  APPROVED: "bg-red-100 text-red-700",
  WALKER_ASSIGNED: "bg-sky-100 text-sky-700",
  ACTIVE: "bg-navy-100 text-navy-700",
  COMPLETED: "bg-sand/60 text-ink/60",
  EXPIRED: "bg-sand/60 text-ink/60",
  CANCELLED: "bg-red-100 text-red-700",
};

export default function AdminBookingCard({ booking }: { booking: Booking }) {
  return (
    <Link
      href={`/admin/bookings/${booking.id}`}
      className="block rounded-xl border border-sand bg-white p-5 transition hover:border-navy-300 hover:shadow-sm"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-ink">
            {booking.customer.name ?? booking.customer.mobileNumber}
          </p>
          <p className="text-xs text-ink/50">
            {booking.bookingDogs.map((bd) => bd.dog.name).join(", ")} · {booking.address.city}
          </p>
        </div>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_TONES[booking.status]}`}>
          {STATUS_LABELS[booking.status]}
        </span>
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-ink/50">
        <span>Starts {formatDate(booking.startDate)}</span>
        {booking.walker && <span>Walker: {booking.walker.name}</span>}
      </div>
    </Link>
  );
}
