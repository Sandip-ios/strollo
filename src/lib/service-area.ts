import { prisma } from "@/lib/prisma";

// Gates address creation by pincode. If no ServiceArea rows exist at all,
// nothing is blocked yet — that's the bootstrapping state before an admin
// has configured any coverage. Once at least one exists, a pincode must be
// covered by an active one or the address is rejected as "not serviceable".
export async function resolveServiceArea(
  pincode: string
): Promise<{ serviceable: boolean; serviceAreaId: string | null }> {
  const totalAreas = await prisma.serviceArea.count({ where: { deletedAt: null } });
  if (totalAreas === 0) {
    return { serviceable: true, serviceAreaId: null };
  }

  const match = await prisma.serviceArea.findFirst({
    where: { deletedAt: null, isActive: true, pincodes: { has: pincode } },
  });

  return match
    ? { serviceable: true, serviceAreaId: match.id }
    : { serviceable: false, serviceAreaId: null };
}

export const NOT_SERVICEABLE_MESSAGE = (pincode: string) =>
  `Sorry, we don't currently serve pincode ${pincode}. We're expanding — check back soon.`;
