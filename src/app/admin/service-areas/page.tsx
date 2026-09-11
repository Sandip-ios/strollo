import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { homeRouteForRole } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import AdminHeader from "@/components/layout/AdminHeader";
import CityServiceAreaManager from "@/components/admin/CityServiceAreaManager";

export default async function AdminServiceAreasPage() {
  const session = getSession();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN") redirect(homeRouteForRole(session.role));

  const [cities, serviceAreasRaw] = await Promise.all([
    prisma.city.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" } }),
    prisma.serviceArea.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
      include: { _count: { select: { walkers: { where: { isActive: true, deletedAt: null } } } } },
    }),
  ]);

  const serviceAreas = serviceAreasRaw.map((a) => ({
    id: a.id,
    name: a.name,
    cityId: a.cityId,
    isActive: a.isActive,
    walkerCount: a._count.walkers,
  }));

  return (
    <main className="min-h-screen bg-paper">
      <AdminHeader active="/admin/master" />
      <div className="mx-auto max-w-4xl px-6 py-10 sm:px-10">
        <h1 className="font-display text-2xl font-semibold text-ink">Cities & Service Areas</h1>
        <p className="mb-8 mt-1 text-sm text-ink/60">
          Add a city, then the areas within it. Only an address in an active area can be added
          and booked — if no cities are set up yet, every address is allowed.
        </p>
        <CityServiceAreaManager initialCities={cities} initialAreas={serviceAreas} />
      </div>
    </main>
  );
}
