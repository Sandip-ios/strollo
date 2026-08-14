import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { homeRouteForRole } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import AppHeader from "@/components/layout/AppHeader";
import DogList from "@/components/dogs/DogList";

export default async function DogsPage() {
  const session = getSession();
  if (!session) redirect("/login");
  if (session.role !== "CUSTOMER") redirect(homeRouteForRole(session.role));

  const dogs = await prisma.dog.findMany({
    where: { userId: session.userId, deletedAt: null },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="min-h-screen bg-paper pb-20 sm:pb-0">
      <AppHeader active="/dogs" />
      <div className="mx-auto max-w-3xl px-6 py-10 sm:px-10">
        <h1 className="font-display text-2xl font-semibold text-ink">My Dogs</h1>
        <p className="mb-8 mt-1 text-sm text-ink/60">
          Add every dog you'd like walked, with the details your walker needs.
        </p>
        <DogList initialDogs={dogs} />
      </div>
    </main>
  );
}
