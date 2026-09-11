import { prisma } from "@/lib/prisma";

// Gates address creation by a customer-picked Service Area (no pincode
// matching). If no Cities exist at all, nothing is blocked yet — that's
// the bootstrapping state before an admin has configured any coverage.
// Once at least one City exists, the address must reference an active,
// non-deleted ServiceArea or it's rejected as "not serviceable".
export async function resolveServiceArea(
  serviceAreaId: string | null | undefined
): Promise<{ serviceable: boolean; serviceAreaId: string | null }> {
  const totalCities = await prisma.city.count({ where: { deletedAt: null } });
  if (totalCities === 0) {
    return { serviceable: true, serviceAreaId: null };
  }

  if (!serviceAreaId) {
    return { serviceable: false, serviceAreaId: null };
  }

  const area = await prisma.serviceArea.findFirst({
    where: { id: serviceAreaId, deletedAt: null, isActive: true },
  });

  return area
    ? { serviceable: true, serviceAreaId: area.id }
    : { serviceable: false, serviceAreaId: null };
}

// Service areas that currently have at least one active walker assigned —
// an address can be in a perfectly valid, active service area and still
// have nobody to walk the dog if admin hasn't assigned a walker there yet.
export async function getServiceAreaIdsWithActiveWalker(): Promise<Set<string>> {
  const areas = await prisma.serviceArea.findMany({
    where: {
      deletedAt: null,
      isActive: true,
      walkers: { some: { isActive: true, deletedAt: null } },
    },
    select: { id: true },
  });
  return new Set(areas.map((a) => a.id));
}

export const NOT_SERVING_CITY_MESSAGE =
  "We're not currently serving your area. We're expanding — hang tight, and we've let our team know.";

export const NO_WALKER_AVAILABLE_MESSAGE =
  "There's no walker available in your area just yet. Please check back soon.";

export const NOT_SERVICEABLE_MESSAGE =
  "We don't currently serve your area. We're expanding — hang tight, and we've let our team know.";

// Fired when a customer's address falls outside any configured service
// area, so an admin can see real demand for a locality and decide
// whether to open it up (add the City/Area, then assign a walker).
export async function notifyAdminsOfUnservedAreaRequest(params: { userId: string; cityName: string }) {
  const [admins, customer] = await Promise.all([
    prisma.user.findMany({ where: { role: "ADMIN", deletedAt: null } }),
    prisma.user.findUnique({ where: { id: params.userId } }),
  ]);
  if (admins.length === 0 || !customer) return;

  await prisma.notification.createMany({
    data: admins.map((admin) => ({
      userId: admin.id,
      type: "GENERAL" as const,
      title: "Service area request",
      message: `${customer.name ?? customer.mobileNumber} tried to add an address in "${params.cityName}", which isn't covered by a service area yet.`,
    })),
  });
}
