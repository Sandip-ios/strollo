import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { homeRouteForRole } from "@/lib/constants";
import WalkerHeader from "@/components/layout/WalkerHeader";
import WalkerWalkList from "@/components/walker/WalkerWalkList";

export default async function WalkerDashboardPage() {
  const session = getSession();
  if (!session) redirect("/login");
  if (session.role !== "WALKER") redirect(homeRouteForRole(session.role));

  const walker = await prisma.walker.findFirst({
    where: { userId: session.userId, deletedAt: null },
  });
  if (!walker) redirect("/login");

  const walks = await prisma.walkInstance.findMany({
    where: { walkerId: walker.id, status: { in: ["SCHEDULED", "ON_GOING"] } },
    include: {
      booking: {
        include: {
          customer: { select: { name: true, mobileNumber: true } },
          address: true,
          bookingDogs: { include: { dog: true } },
        },
      },
    },
    orderBy: { scheduledDate: "asc" },
  });

  return (
    <main className="min-h-screen bg-paper">
      <WalkerHeader walkerName={walker.name} />
      <div className="mx-auto max-w-2xl px-6 py-10 sm:px-10">
        <h1 className="font-display text-2xl font-semibold text-ink">Your walks</h1>
        <p className="mb-8 mt-1 text-sm text-ink/60">
          Covering {walker.area}. Tap a walk to start or complete it.
        </p>
        <WalkerWalkList walks={walks} />
      </div>
    </main>
  );
}
