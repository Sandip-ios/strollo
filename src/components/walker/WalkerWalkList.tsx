import Link from "next/link";
import { WALK_SLOTS } from "@/lib/constants";

type Walk = {
  id: string;
  scheduledDate: Date;
  status: string;
  booking: {
    slot: string;
    customer: { name: string | null; mobileNumber: string };
    address: { label: string; houseNumber: string; line1: string; city: string };
    bookingDogs: { dog: { name: string } }[];
  };
};

const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: "Not started",
  ON_GOING: "In progress",
};

const STATUS_TONES: Record<string, string> = {
  SCHEDULED: "bg-sand/60 text-ink/60",
  ON_GOING: "bg-navy-100 text-navy-700",
};

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}

function isToday(d: Date) {
  const today = new Date();
  const date = new Date(d);
  return (
    today.getFullYear() === date.getFullYear() &&
    today.getMonth() === date.getMonth() &&
    today.getDate() === date.getDate()
  );
}

export default function WalkerWalkList({ walks }: { walks: Walk[] }) {
  const today = walks.filter((w) => isToday(w.scheduledDate));
  const upcoming = walks.filter((w) => !isToday(w.scheduledDate));

  if (walks.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-sand bg-white/60 p-10 text-center">
        <p className="text-sm text-ink/60">No walks assigned right now.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {today.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-navy-600">
            Today
          </h2>
          <div className="space-y-3">
            {today.map((w) => (
              <WalkCard key={w.id} walk={w} />
            ))}
          </div>
        </section>
      )}
      {upcoming.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink/40">
            Upcoming
          </h2>
          <div className="space-y-3">
            {upcoming.map((w) => (
              <WalkCard key={w.id} walk={w} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function WalkCard({ walk }: { walk: Walk }) {
  const slotLabel = WALK_SLOTS.find((s) => s.value === walk.booking.slot);
  return (
    <Link
      href={`/walker/walks/${walk.id}`}
      className="block rounded-xl border border-sand bg-white p-5 transition hover:border-navy-300 hover:shadow-sm"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-ink">
            {walk.booking.bookingDogs.map((bd) => bd.dog.name).join(", ")}
          </p>
          <p className="text-xs text-ink/50">
            {walk.booking.customer.name ?? walk.booking.customer.mobileNumber}
          </p>
        </div>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_TONES[walk.status]}`}>
          {STATUS_LABELS[walk.status]}
        </span>
      </div>
      <p className="mt-2 text-xs text-ink/60">
        {formatDate(walk.scheduledDate)} · {slotLabel?.label} ({slotLabel?.time})
      </p>
      <p className="mt-1 text-xs text-ink/50">
        {walk.booking.address.houseNumber}, {walk.booking.address.label} — {walk.booking.address.line1},{" "}
        {walk.booking.address.city}
      </p>
    </Link>
  );
}
