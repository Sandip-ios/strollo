import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { homeRouteForRole } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { getServiceAreaIdsWithActiveWalker } from "@/lib/service-area";
import AppHeader from "@/components/layout/AppHeader";
import BookingWizard from "@/components/booking/BookingWizard";

export default async function BookPage() {
  const session = getSession();
  if (!session) redirect("/login");
  if (session.role !== "CUSTOMER") redirect(homeRouteForRole(session.role));

  const [user, dogs, addresses, plans, walkerAreaIds] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.userId } }),
    prisma.dog.findMany({ where: { userId: session.userId, deletedAt: null }, orderBy: { createdAt: "desc" } }),
    prisma.address.findMany({
      where: { userId: session.userId, deletedAt: null },
      include: { serviceArea: { select: { name: true } } },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    }),
    prisma.plan.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: { dogQuantity: "asc" },
    }),
    getServiceAreaIdsWithActiveWalker(),
  ]);

  if (!user) redirect("/login");

  const enrichedAddresses = addresses.map((a) => ({
    ...a,
    area: a.serviceArea?.name ?? null,
    walkerAvailable: Boolean(a.serviceAreaId && walkerAreaIds.has(a.serviceAreaId)),
  }));

  return (
    <main className="min-h-screen bg-paper pb-20 sm:pb-0">
      <AppHeader active="/book" />
      <div className="mx-auto max-w-2xl px-6 py-10 sm:px-10">
        <h1 className="font-display text-2xl font-semibold text-ink">Book a Walk</h1>
        <p className="mb-8 mt-1 text-sm text-ink/60">
          Pick your dog(s) and we&apos;ll show plans that fit.
        </p>

        {plans.length === 0 ? (
          <div className="rounded-xl border border-dashed border-sand bg-white/60 p-10 text-center">
            <p className="text-sm text-ink/60">
              Booking isn't available right now — no plans have been set up
              yet. Please check back soon.
            </p>
          </div>
        ) : (
          <BookingWizard
            dogs={dogs}
            addresses={enrichedAddresses}
            plans={plans.map((p) => ({
              id: p.id,
              name: p.name,
              price: p.price,
              dogQuantity: p.dogQuantity,
            }))}
            customerName={user.name ?? ""}
            customerEmail={user.email ?? ""}
            customerMobile={user.mobileNumber}
          />
        )}
      </div>
    </main>
  );
}
