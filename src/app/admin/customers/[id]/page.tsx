import { redirect, notFound } from "next/navigation";
import Image from "next/image";
import { PawPrint } from "lucide-react";
import { getSession } from "@/lib/auth";
import { homeRouteForRole } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format-date";
import AdminHeader from "@/components/layout/AdminHeader";
import AdminBookingCard from "@/components/admin/AdminBookingCard";
import CustomerStatusToggle from "@/components/admin/CustomerStatusToggle";

export default async function AdminCustomerDetailPage({ params }: { params: { id: string } }) {
  const session = getSession();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN") redirect(homeRouteForRole(session.role));

  const customer = await prisma.user.findFirst({
    where: { id: params.id, role: "CUSTOMER", deletedAt: null },
    include: {
      dogs: { where: { deletedAt: null }, orderBy: { createdAt: "desc" } },
      addresses: { where: { deletedAt: null }, orderBy: { isDefault: "desc" } },
      bookings: {
        where: { deletedAt: null, status: { not: "PENDING_PAYMENT" } },
        include: {
          customer: true,
          address: true,
          walker: true,
          bookingDogs: { include: { dog: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!customer) notFound();

  return (
    <main className="min-h-screen bg-paper">
      <AdminHeader active="/admin/customers" />
      <div className="mx-auto max-w-2xl px-6 py-10 sm:px-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink">
              {customer.name ?? customer.mobileNumber}
            </h1>
            <p className="mt-1 text-sm text-ink/60">
              {customer.isActive ? "Active" : "Inactive"} · Joined {formatDate(customer.createdAt)}
            </p>
          </div>
          <CustomerStatusToggle customerId={customer.id} isActive={customer.isActive} />
        </div>

        <div className="mt-6 grid gap-4 rounded-xl border border-sand bg-white p-5 text-sm sm:grid-cols-2">
          <Detail label="Mobile" value={customer.mobileNumber} />
          <Detail label="Email" value={customer.email ?? "—"} />
        </div>

        <h2 className="mb-3 mt-8 font-display text-lg font-semibold text-ink">
          Dogs ({customer.dogs.length})
        </h2>
        {customer.dogs.length === 0 ? (
          <p className="text-sm text-ink/50">No dogs added yet.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {customer.dogs.map((dog) => (
              <div key={dog.id} className="flex items-center gap-3 rounded-xl border border-sand bg-white p-4">
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full border border-sand bg-sand/20">
                  {dog.photoUrl ? (
                    <Image src={dog.photoUrl} alt={dog.name} width={48} height={48} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-sky-50">
                      <PawPrint className="h-5 w-5 text-navy-300" strokeWidth={1.5} />
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink">{dog.name}</p>
                  <p className="text-xs text-ink/50">
                    {dog.breed} · {dog.age} yr{dog.age === 1 ? "" : "s"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        <h2 className="mb-3 mt-8 font-display text-lg font-semibold text-ink">
          Addresses ({customer.addresses.length})
        </h2>
        {customer.addresses.length === 0 ? (
          <p className="text-sm text-ink/50">No addresses added yet.</p>
        ) : (
          <div className="space-y-3">
            {customer.addresses.map((address) => (
              <div key={address.id} className="rounded-xl border border-sand bg-white p-4">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-ink">{address.label}</p>
                  {address.isDefault && (
                    <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-700">
                      Default
                    </span>
                  )}
                </div>
                <p className="text-xs text-ink/50">
                  {address.houseNumber}, {address.line1}, {address.city}
                </p>
              </div>
            ))}
          </div>
        )}

        <h2 className="mb-3 mt-8 font-display text-lg font-semibold text-ink">
          Bookings ({customer.bookings.length})
        </h2>
        {customer.bookings.length === 0 ? (
          <p className="text-sm text-ink/50">No bookings yet.</p>
        ) : (
          <div className="space-y-3">
            {customer.bookings.map((b) => (
              <AdminBookingCard key={b.id} booking={b} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-ink/40">{label}</p>
      <p className="text-ink">{value}</p>
    </div>
  );
}
