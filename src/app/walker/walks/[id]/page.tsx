import Link from "next/link";
import Image from "next/image";
import { redirect, notFound } from "next/navigation";
import { ChevronLeft, Navigation, PawPrint, ShieldAlert } from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { WALK_SLOTS, WALK_DURATION_MINUTES, homeRouteForRole } from "@/lib/constants";
import { formatDate } from "@/lib/format-date";
import WalkerHeader from "@/components/layout/WalkerHeader";
import WalkActionPanel from "@/components/walker/WalkActionPanel";

export default async function WalkerWalkDetailPage({ params }: { params: { id: string } }) {
  const session = getSession();
  if (!session) redirect("/login");
  if (session.role !== "WALKER") redirect(homeRouteForRole(session.role));

  const walker = await prisma.walker.findFirst({ where: { userId: session.userId, deletedAt: null } });
  if (!walker) redirect("/login");

  const walk = await prisma.walkInstance.findFirst({
    where: { id: params.id, walkerId: walker.id },
    include: {
      booking: {
        include: {
          customer: true,
          address: { include: { serviceArea: true } },
          bookingDogs: { include: { dog: true } },
        },
      },
      events: { orderBy: { occurredAt: "asc" } },
    },
  });

  if (!walk) notFound();

  const slotLabel = WALK_SLOTS.find((s) => s.value === walk.booking.slot);
  const address = walk.booking.address;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${address.latitude},${address.longitude}`;

  return (
    <main className="min-h-screen bg-paper pb-20">
      <WalkerHeader walkerName={walker.name} active="/walker" />
      <div className="mx-auto max-w-2xl px-6 py-10 sm:px-10">
        <Link href="/walker" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-navy-600">
          <ChevronLeft className="h-4 w-4" strokeWidth={2.25} />
          Back to walks
        </Link>

        <h1 className="font-display text-2xl font-semibold text-ink">{formatDate(walk.scheduledDate)}</h1>
        <p className="mt-1 text-sm text-ink/60">
          {slotLabel?.label} ({slotLabel?.time}) · {WALK_DURATION_MINUTES} minutes
        </p>

        <div className="mt-6 rounded-xl border border-sand bg-white p-5 text-sm">
          <div className="grid gap-4 sm:grid-cols-2">
            <Detail label="Owner" value={`${walk.booking.customer.name ?? "—"} · ${walk.booking.customer.mobileNumber}`} />
            <Detail label="Area" value={address.serviceArea?.name ?? address.city} />
          </div>
          <div className="mt-4 flex flex-col gap-3 border-t border-sand pt-4 sm:flex-row sm:items-start sm:justify-between">
            <Detail
              label="Address"
              value={`${address.houseNumber}, ${address.label} — ${address.line1}${address.line2 ? `, ${address.line2}` : ""}, ${address.city}`}
            />
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full shrink-0 items-center justify-center gap-1.5 rounded-lg border border-navy-200 px-3 py-2 text-xs font-semibold text-navy-600 transition hover:bg-navy-50 sm:w-auto"
            >
              <Navigation className="h-3.5 w-3.5" strokeWidth={2} />
              Navigate
            </a>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {walk.booking.bookingDogs.map((bd) => {
            const dog = bd.dog;
            return (
              <div key={dog.id} className="rounded-xl border border-sand bg-white p-5">
                <div className="flex items-center gap-3">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-sky-50">
                    {dog.photoUrl ? (
                      <Image src={dog.photoUrl} alt={dog.name} fill className="object-cover" />
                    ) : (
                      <PawPrint className="h-full w-full p-3 text-navy-300" strokeWidth={1.5} />
                    )}
                  </div>
                  <div>
                    <p className="font-display text-base font-bold text-ink">{dog.name}</p>
                    <p className="text-xs text-ink/50">
                      {dog.breed} · {dog.size.charAt(0) + dog.size.slice(1).toLowerCase()} ·{" "}
                      {dog.gender === "MALE" ? "Male" : "Female"} · {dog.age} {dog.age === 1 ? "yr" : "yrs"}
                    </p>
                  </div>
                </div>

                {dog.temperament.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {dog.temperament.map((tag) => (
                      <span
                        key={tag}
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          tag === "Aggressive" ? "bg-red-100 text-red-700" : "bg-sand/60 text-ink/70"
                        }`}
                      >
                        {tag === "Aggressive" && <ShieldAlert className="mr-1 inline h-3 w-3" strokeWidth={2.5} />}
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {dog.vaccinations.length > 0 && (
                  <p className="mt-2 text-xs text-emerald-700">Vaccinated: {dog.vaccinations.join(", ")}</p>
                )}

                {(dog.medicalNotes || dog.behaviourNotes) && (
                  <div className="mt-3 space-y-1 border-t border-sand pt-3 text-xs text-ink/60">
                    {dog.medicalNotes && (
                      <p>
                        <span className="font-medium text-ink/80">Medical:</span> {dog.medicalNotes}
                      </p>
                    )}
                    {dog.behaviourNotes && (
                      <p>
                        <span className="font-medium text-ink/80">Behaviour:</span> {dog.behaviourNotes}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-6">
          <WalkActionPanel
            walkId={walk.id}
            status={walk.status}
            startTime={walk.startTime?.toISOString() ?? null}
            endTime={walk.endTime?.toISOString() ?? null}
            initialEvents={walk.events.map((e) => ({
              id: e.id,
              type: e.type,
              note: e.note,
              photoUrl: e.photoUrl,
              occurredAt: e.occurredAt.toISOString(),
            }))}
            initialRoutePath={(walk.routePath as unknown as { lat: number; lng: number; ts: number }[] | null) ?? []}
          />
        </div>
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
