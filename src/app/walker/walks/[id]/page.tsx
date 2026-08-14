import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { WALK_SLOTS, WALK_DURATION_MINUTES, homeRouteForRole } from "@/lib/constants";
import WalkerHeader from "@/components/layout/WalkerHeader";
import WalkActionPanel from "@/components/walker/WalkActionPanel";

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" });
}

export default async function WalkerWalkDetailPage({ params }: { params: { id: string } }) {
  const session = getSession();
  if (!session) redirect("/login");
  if (session.role !== "WALKER") redirect(homeRouteForRole(session.role));

  const walker = await prisma.walker.findFirst({ where: { userId: session.userId, deletedAt: null } });
  if (!walker) redirect("/login");

  const walk = await prisma.walkInstance.findFirst({
    where: { id: params.id, walkerId: walker.id },
    include: {
      booking: {
        include: {
          customer: true,
          address: true,
          bookingDogs: { include: { dog: true } },
        },
      },
    },
  });

  if (!walk) notFound();

  const slotLabel = WALK_SLOTS.find((s) => s.value === walk.booking.slot);

  return (
    <main className="min-h-screen bg-paper">
      <WalkerHeader walkerName={walker.name} />
      <div className="mx-auto max-w-2xl px-6 py-10 sm:px-10">
        <h1 className="font-display text-2xl font-semibold text-ink">{formatDate(walk.scheduledDate)}</h1>
        <p className="mt-1 text-sm text-ink/60">
          {slotLabel?.label} ({slotLabel?.time}) · {WALK_DURATION_MINUTES} minutes
        </p>

        <div className="mt-6 grid gap-4 rounded-xl border border-sand bg-white p-5 text-sm sm:grid-cols-2">
          <Detail label="Owner" value={`${walk.booking.customer.name ?? "—"} · ${walk.booking.customer.mobileNumber}`} />
          <Detail label="Dogs" value={walk.booking.bookingDogs.map((bd) => bd.dog.name).join(", ")} />
          <Detail
            label="Address"
            value={`${walk.booking.address.houseNumber}, ${walk.booking.address.label} — ${walk.booking.address.line1}, ${walk.booking.address.city}`}
          />
        </div>

        <div className="mt-6">
          <WalkActionPanel walkId={walk.id} status={walk.status} />
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
