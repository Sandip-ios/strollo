import Link from "next/link";
import { redirect } from "next/navigation";
import { MapPinned, Tag, PawPrint, Syringe, IndianRupee } from "lucide-react";
import { getSession } from "@/lib/auth";
import { homeRouteForRole } from "@/lib/constants";
import AdminHeader from "@/components/layout/AdminHeader";

const MASTER_LINKS = [
  {
    href: "/admin/service-areas",
    icon: MapPinned,
    title: "Cities & Service Areas",
    description: "Cities Strollo operates in and the localities within each one.",
  },
  {
    href: "/admin/plans",
    icon: IndianRupee,
    title: "Plans & Pricing",
    description: "Monthly, weekly, and custom plan pricing.",
  },
  {
    href: "/admin/master/breeds",
    icon: PawPrint,
    title: "Breeds",
    description: "Breed options shown in the dog breed picker.",
  },
  {
    href: "/admin/master/temperaments",
    icon: Tag,
    title: "Temperaments",
    description: "Temperament tags customers can select for a dog.",
  },
  {
    href: "/admin/master/vaccination-types",
    icon: Syringe,
    title: "Vaccination Types",
    description: "Vaccination types tracked for dogs on the platform.",
  },
];

export default async function AdminMasterPage() {
  const session = getSession();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN") redirect(homeRouteForRole(session.role));

  return (
    <main className="min-h-screen bg-paper">
      <AdminHeader active="/admin/master" />
      <div className="mx-auto max-w-4xl px-6 py-10 sm:px-10">
        <h1 className="font-display text-2xl font-semibold text-ink">Master Data</h1>
        <p className="mb-8 mt-1 text-sm text-ink/60">
          Reference lists used across booking and the dog form.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {MASTER_LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-xl border border-sand bg-white p-6 transition hover:border-navy-300 hover:shadow-sm"
            >
              <item.icon className="h-6 w-6 text-navy-600" strokeWidth={1.75} />
              <h2 className="mt-3 font-display text-base font-semibold text-ink">{item.title}</h2>
              <p className="mt-1 text-sm text-ink/60">{item.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
