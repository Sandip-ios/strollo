import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { homeRouteForRole } from "@/lib/constants";
import WalkerHeader from "@/components/layout/WalkerHeader";
import WalkerCompletedList from "@/components/walker/WalkerCompletedList";

export default async function WalkerCompletedPage() {
  const session = getSession();
  if (!session) redirect("/login");
  if (session.role !== "WALKER") redirect(homeRouteForRole(session.role));

  const walker = await prisma.walker.findFirst({ where: { userId: session.userId, deletedAt: null } });
  if (!walker) redirect("/login");

  const walks = await prisma.walkInstance.findMany({
    where: { walkerId: walker.id, status: "COMPLETED" },
    include: {
      booking: {
        include: {
          customer: { select: { name: true, mobileNumber: true } },
          address: { include: { serviceArea: true } },
          bookingDogs: { include: { dog: true } },
        },
      },
      _count: { select: { events: true } },
    },
    orderBy: { scheduledDate: "desc" },
  });

  const rows = walks.map((w) => ({
    id: w.id,
    scheduledDate: w.scheduledDate,
    durationSec: w.durationSec,
    eventCount: w._count.events,
    booking: w.booking,
  }));

  return (
    <main className="min-h-screen bg-paper pb-20">
      <WalkerHeader walkerName={walker.name} active="/walker/completed" />
      <div className="mx-auto max-w-2xl px-6 py-10 sm:px-10">
        <h1 className="font-display text-2xl font-semibold text-ink">Completed walks</h1>
        <p className="mb-6 mt-1 text-sm text-ink/60">A record of every walk you've finished.</p>
        <WalkerCompletedList walks={rows} />
      </div>
    </main>
  );
}
