import { redirect } from "next/navigation";
import Link from "next/link";
import { MapPin, Headphones, ArrowRight } from "lucide-react";
import { getSession } from "@/lib/auth";
import { homeRouteForRole } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import AppHeader from "@/components/layout/AppHeader";
import ProfileForm from "@/components/profile/ProfileForm";

export default async function ProfilePage() {
  const session = getSession();
  if (!session) redirect("/login");
  if (session.role !== "CUSTOMER") redirect(homeRouteForRole(session.role));

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) redirect("/login");

  return (
    <main className="min-h-screen bg-paper pb-20 sm:pb-0">
      <AppHeader active="/profile" />
      <div className="mx-auto max-w-3xl px-6 py-10 sm:px-10">
        <h1 className="font-display text-2xl font-semibold text-ink">Profile</h1>
        <p className="mb-8 mt-1 text-sm text-ink/60">Manage your account details.</p>
        <ProfileForm
          initialName={user.name ?? ""}
          initialEmail={user.email ?? ""}
          mobileNumber={user.mobileNumber}
        />

        <div className="mt-8 max-w-md space-y-3">
          <Link
            href="/addresses"
            className="flex items-center justify-between rounded-xl border border-sand bg-white p-4 transition hover:border-navy-300 hover:shadow-sm"
          >
            <span className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-50">
                <MapPin className="h-4 w-4 text-sky-600" strokeWidth={2} />
              </span>
              <span className="text-sm font-semibold text-ink">Addresses</span>
            </span>
            <ArrowRight className="h-4 w-4 text-ink/40" />
          </Link>
          <Link
            href="/contact"
            className="flex items-center justify-between rounded-xl border border-sand bg-white p-4 transition hover:border-navy-300 hover:shadow-sm"
          >
            <span className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-50">
                <Headphones className="h-4 w-4 text-sky-600" strokeWidth={2} />
              </span>
              <span className="text-sm font-semibold text-ink">Support</span>
            </span>
            <ArrowRight className="h-4 w-4 text-ink/40" />
          </Link>
        </div>
      </div>
    </main>
  );
}
