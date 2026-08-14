import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { homeRouteForRole } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import AdminHeader from "@/components/layout/AdminHeader";
import CustomerList from "@/components/admin/CustomerList";

export default async function AdminCustomersPage() {
  const session = getSession();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN") redirect(homeRouteForRole(session.role));

  const customers = await prisma.user.findMany({
    where: { role: "CUSTOMER", deletedAt: null },
    include: {
      _count: {
        select: {
          dogs: { where: { deletedAt: null } },
          bookings: { where: { deletedAt: null } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="min-h-screen bg-paper">
      <AdminHeader active="/admin/customers" />
      <div className="mx-auto max-w-4xl px-6 py-10 sm:px-10">
        <h1 className="font-display text-2xl font-semibold text-ink">Customers</h1>
        <p className="mb-8 mt-1 text-sm text-ink/60">
          {customers.length} customer{customers.length === 1 ? "" : "s"} signed up.
        </p>

        <CustomerList
          customers={customers.map((c) => ({
            id: c.id,
            name: c.name,
            mobileNumber: c.mobileNumber,
            email: c.email,
            isActive: c.isActive,
            createdAt: c.createdAt.toISOString(),
            dogCount: c._count.dogs,
            bookingCount: c._count.bookings,
          }))}
        />
      </div>
    </main>
  );
}
