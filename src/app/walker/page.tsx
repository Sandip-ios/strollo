import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { homeRouteForRole } from "@/lib/constants";
import WalkerHeader from "@/components/layout/WalkerHeader";
import WalkerWalkList from "@/components/walker/WalkerWalkList";
import CurrentWalkCard from "@/components/walker/CurrentWalkCard";

export default async function WalkerDashboardPage() {
  const session = getSession();
  if (!session) redirect("/login");
  if (session.role !== "WALKER") redirect(homeRouteForRole(session.role));

  const walker = await prisma.walker.findFirst({
    where: { userId: session.userId, deletedAt: null },
    include: { serviceAreas: true },
  });
  if (!walker) redirect("/login");

  const coverageLabel =
    walker.serviceAreas.length > 0 ? walker.serviceAreas.map((a) => a.name).join(", ") : "no areas yet";

  const walks = await prisma.walkInstance.findMany({
    where: { walkerId: walker.id, status: { in: ["SCHEDULED", "ON_GOING"] } },
    include: {
      booking: {
        include: {
          customer: { select: { name: true, mobileNumber: true } },
          address: { include: { serviceArea: true } },
          bookingDogs: { include: { dog: true } },
        },
      },
    },
    orderBy: { scheduledDate: "asc" },
  });

  const currentWalk = walks.find((w) => w.status === "ON_GOING") ?? null;
  const upNext = walks.filter((w) => w.status !== "ON_GOING");

  return (
    <main className="min-h-screen bg-paper pb-20">
      <WalkerHeader walkerName={walker.name} active="/walker" />
      <div className="mx-auto max-w-2xl px-6 py-10 sm:px-10">
        <h1 className="font-display text-2xl font-semibold text-ink">Your walks</h1>
        <p className="mb-6 mt-1 text-sm text-ink/60">Covering {coverageLabel}.</p>

        {currentWalk && (
          <div className="mb-8">
            <CurrentWalkCard
              walkId={currentWalk.id}
              startTime={currentWalk.startTime?.toISOString() ?? null}
              dogNames={currentWalk.booking.bookingDogs.map((bd) => bd.dog.name)}
              customerName={currentWalk.booking.customer.name ?? currentWalk.booking.customer.mobileNumber}
              area={currentWalk.booking.address.serviceArea?.name ?? currentWalk.booking.address.city}
            />
          </div>
        )}

        <WalkerWalkList walks={upNext} />
      </div>
    </main>
  );
}
