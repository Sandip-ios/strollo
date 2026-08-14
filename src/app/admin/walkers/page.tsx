import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { homeRouteForRole } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import AdminHeader from "@/components/layout/AdminHeader";
import WalkerList from "@/components/admin/WalkerList";

export default async function AdminWalkersPage() {
  const session = getSession();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN") redirect(homeRouteForRole(session.role));

  const walkers = await prisma.walker.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="min-h-screen bg-paper">
      <AdminHeader active="/admin/walkers" />
      <div className="mx-auto max-w-4xl px-6 py-10 sm:px-10">
        <h1 className="font-display text-2xl font-semibold text-ink">Walkers</h1>
        <p className="mb-8 mt-1 text-sm text-ink/60">
          Dog walkers are added and managed here — there's no walker
          self-signup yet.
        </p>
        <WalkerList initialWalkers={walkers} />
      </div>
    </main>
  );
}
