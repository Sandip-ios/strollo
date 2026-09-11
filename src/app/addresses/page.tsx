import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { homeRouteForRole } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import AppHeader from "@/components/layout/AppHeader";
import AddressList from "@/components/addresses/AddressList";

export default async function AddressesPage() {
  const session = getSession();
  if (!session) redirect("/login");
  if (session.role !== "CUSTOMER") redirect(homeRouteForRole(session.role));

  const addresses = await prisma.address.findMany({
    where: { userId: session.userId, deletedAt: null },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });

  return (
    <main className="min-h-screen bg-paper pb-28 sm:pb-0">
      <AppHeader active="/addresses" />
      <div className="mx-auto max-w-3xl px-6 py-10 sm:px-10">
        <h1 className="font-display text-2xl font-semibold text-ink">Addresses</h1>
        <p className="mb-8 mt-1 text-sm text-ink/60">
          Manage the locations where your walker can pick up your dog.
        </p>
        <AddressList initialAddresses={addresses} />
      </div>
    </main>
  );
}
