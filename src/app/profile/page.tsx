import { redirect } from "next/navigation";
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
      </div>
    </main>
  );
}
