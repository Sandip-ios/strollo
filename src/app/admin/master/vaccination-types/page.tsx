import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { homeRouteForRole } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import AdminHeader from "@/components/layout/AdminHeader";
import MasterListManager from "@/components/admin/MasterListManager";

export default async function AdminVaccinationTypesPage() {
  const session = getSession();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN") redirect(homeRouteForRole(session.role));

  const vaccinationTypes = await prisma.vaccinationType.findMany({
    where: { deletedAt: null },
    orderBy: { name: "asc" },
  });

  return (
    <main className="min-h-screen bg-paper">
      <AdminHeader active="/admin/master" />
      <div className="mx-auto max-w-4xl px-6 py-10 sm:px-10">
        <h1 className="font-display text-2xl font-semibold text-ink">Vaccination Types</h1>
        <p className="mb-8 mt-1 text-sm text-ink/60">
          The vaccination types tracked for dogs on the platform.
        </p>
        <MasterListManager resource="vaccination-types" label="Vaccination type" initialItems={vaccinationTypes} />
      </div>
    </main>
  );
}
