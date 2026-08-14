import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { homeRouteForRole } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import AdminHeader from "@/components/layout/AdminHeader";
import ServiceAreaList from "@/components/admin/ServiceAreaList";

export default async function AdminServiceAreasPage() {
  const session = getSession();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN") redirect(homeRouteForRole(session.role));

  const serviceAreas = await prisma.serviceArea.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="min-h-screen bg-paper">
      <AdminHeader active="/admin/service-areas" />
      <div className="mx-auto max-w-4xl px-6 py-10 sm:px-10">
        <h1 className="font-display text-2xl font-semibold text-ink">Service Areas</h1>
        <p className="mb-8 mt-1 text-sm text-ink/60">
          Only pincodes covered by an active service area can add an address and book a
          walk. If none are set up, every pincode is allowed.
        </p>
        <ServiceAreaList initialAreas={serviceAreas} />
      </div>
    </main>
  );
}
