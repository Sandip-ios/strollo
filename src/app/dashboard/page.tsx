import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  CalendarCheck,
  PawPrint,
  MapPin,
  Headphones,
  User as UserIcon,
  Crown,
  ShieldCheck,
  Camera,
  Receipt,
  Footprints,
  Route,
  Clock,
  Heart,
  ArrowRight,
  Star,
  Plus,
} from "lucide-react";
import { getSession } from "@/lib/auth";
import { homeRouteForRole, getWalkSlotStart, WALK_SLOTS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format-date";
import AppHeader from "@/components/layout/AppHeader";
import LeashPath from "@/components/brand/LeashPath";
import DogChip from "@/components/dashboard/DogChip";
import WalkTimeline, { buildTimelineSteps } from "@/components/dashboard/WalkTimeline";
import PhotoMemories from "@/components/dashboard/PhotoMemories";
import SkipWalkDayCard from "@/components/dashboard/SkipWalkDayCard";
import RateWalkerCard from "@/components/dashboard/RateWalkerCard";

const STATUS_PRIORITY: Record<string, number> = {
  ACTIVE: 0,
  WALKER_ASSIGNED: 1,
  APPROVED: 2,
  CONFIRMED: 3,
  PENDING_PAYMENT: 4,
  COMPLETED: 5,
};

// DD-MM-YYYY app-wide per the shared formatDate — this used to spell out
// "Friday, 11 September 2026", now just delegates for consistency.
const formatDateLong = formatDate;

function slotCountdownLabel(scheduledDate: Date, slot: string): string {
  const start = getWalkSlotStart(scheduledDate, slot);
  const now = new Date();
  const diffMin = Math.round((start.getTime() - now.getTime()) / 60000);
  if (diffMin <= 0) return "Starting shortly";
  if (diffMin < 60) return `Starts in ~${diffMin} min`;
  const hours = Math.floor(diffMin / 60);
  const mins = diffMin % 60;
  return `Starts in ~${hours}h${mins > 0 ? ` ${mins}m` : ""}`;
}

export default async function DashboardPage() {
  const session = getSession();
  if (!session) redirect("/login");
  if (session.role !== "CUSTOMER") redirect(homeRouteForRole(session.role));

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) redirect("/login");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const bookings = await prisma.booking.findMany({
    where: { customerId: user.id, deletedAt: null, status: { notIn: ["CANCELLED", "EXPIRED"] } },
    include: {
      plan: true,
      address: true,
      walker: true,
      bookingDogs: { include: { dog: true } },
      walks: { orderBy: { scheduledDate: "asc" } },
      rating: true,
    },
  });

  const inCycle = bookings.filter((b) => b.endDate >= today);
  inCycle.sort(
    (a, b) =>
      (STATUS_PRIORITY[a.status] ?? 9) - (STATUS_PRIORITY[b.status] ?? 9) ||
      b.startDate.getTime() - a.startDate.getTime()
  );
  const currentBooking = inCycle[0] ?? null;

  const ongoingWalk = currentBooking?.walks.find((w) => w.status === "ON_GOING") ?? null;
  const upcomingScheduled =
    currentBooking?.walks.filter((w) => w.status === "SCHEDULED" && w.scheduledDate >= today) ?? [];
  const nextWalk = ongoingWalk ?? upcomingScheduled[0] ?? null;

  // Distinct from `nextWalk` above — that can be a future day's walk (used
  // for the "Next Walk" hero banner, which shows its own date). This is
  // specifically whatever walk instance is dated today, whatever its status
  // (scheduled/ongoing/completed/cancelled), so the "Today's Walk Progress"
  // card never shows a different day's timeline under a "Today" label.
  const todaysWalk =
    currentBooking?.walks.find((w) => w.scheduledDate.toDateString() === today.toDateString()) ?? null;

  const cancelledUpcoming =
    currentBooking?.walks.filter((w) => w.status === "CANCELLED" && w.scheduledDate >= today).length ?? 0;

  const dogs = currentBooking
    ? currentBooking.bookingDogs.map((bd) => bd.dog)
    : await prisma.dog.findMany({ where: { userId: user.id, deletedAt: null }, orderBy: { createdAt: "desc" } });

  const [recentPhotos, completedWalks] = await Promise.all([
    prisma.walkPhoto.findMany({
      where: { walkInstance: { booking: { customerId: user.id } } },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.walkInstance.findMany({
      where: { booking: { customerId: user.id }, status: "COMPLETED" },
      select: { distanceMeters: true, durationSec: true, scheduledDate: true },
    }),
  ]);

  const totalWalks = completedWalks.length;
  const totalDistanceKm = completedWalks.reduce((s, w) => s + (w.distanceMeters ?? 0), 0) / 1000;
  const totalHours = completedWalks.reduce((s, w) => s + (w.durationSec ?? 0), 0) / 3600;
  const happyDays = new Set(completedWalks.map((w) => w.scheduledDate.toDateString())).size;

  const todaysTimelineSteps = todaysWalk
    ? buildTimelineSteps({
        walkerAssigned: Boolean(currentBooking?.walkerId),
        status: todaysWalk.status,
        startTime: todaysWalk.startTime,
        endTime: todaysWalk.endTime,
      })
    : [];

  const slotInfo = currentBooking ? WALK_SLOTS.find((s) => s.value === currentBooking.slot) : null;

  // Rating is per-subscription, not per-walk — prompt once a booking's
  // duration has actually run its course (or it's marked COMPLETED), and
  // only if it hasn't been rated yet. Most recently finished one first.
  const now = new Date();
  const rateableBooking = bookings
    .filter((b) => b.walkerId && !b.rating && (b.endDate < now || b.status === "COMPLETED"))
    .sort((a, b) => b.endDate.getTime() - a.endDate.getTime())[0];

  const walkerAggregate = currentBooking?.walker
    ? await prisma.walkerRating.aggregate({
        where: { walkerId: currentBooking.walker.id },
        _avg: { score: true },
        _count: true,
      })
    : null;

  return (
    <main className="min-h-screen bg-paper pb-28 sm:pb-0">
      <AppHeader active="/dashboard" />

      <div className="mx-auto max-w-6xl px-6 py-8 sm:px-10">
        {/* Hero: greeting + next walk */}
        <div className="relative grid gap-6 lg:grid-cols-[1fr_1.1fr] lg:items-stretch">
          <PawPrint className="pointer-events-none absolute right-10 top-0 h-6 w-6 rotate-12 text-sky-200 sm:hidden" strokeWidth={2} />
          <PawPrint className="pointer-events-none absolute right-0 top-10 h-5 w-5 -rotate-12 text-sky-100 sm:hidden" strokeWidth={2} />
          <PawPrint className="pointer-events-none absolute right-20 top-16 h-4 w-4 rotate-6 text-sky-100 sm:hidden" strokeWidth={2} />
          <div className="flex flex-col justify-between">
            <div>
              <p className="text-lg text-ink/80">
                Good {greetingWord()}, <span className="font-display text-2xl font-bold text-ink">{user.name?.split(" ")[0] ?? "there"}!</span> 👋
              </p>
              <p className="mt-1 font-mono text-sm text-ink/40">{user.mobileNumber}</p>
            </div>

            {nextWalk && currentBooking ? (
              <div className="relative mt-6 flex-1 overflow-hidden rounded-2xl bg-navy-800 p-6 text-white">
                <PawPrint className="pointer-events-none absolute bottom-8 left-44 h-9 w-9 text-white/[0.06]" />
                <PawPrint className="pointer-events-none absolute bottom-16 left-60 h-6 w-6 text-white/[0.06]" />
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-sm font-medium text-white/70">
                    <CalendarCheck className="h-4 w-4" strokeWidth={1.75} />
                    Next Walk
                  </div>
                  <span className="rounded-full bg-emerald-700 px-3 py-1 text-xs font-bold text-emerald-50">
                    {nextWalk.scheduledDate.toDateString() === today.toDateString() ? "Today" : formatDateLong(nextWalk.scheduledDate)}
                  </span>
                </div>

                {/* Mobile layout — walker beside the time, full-width button */}
                <div className="relative mt-4 sm:hidden">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      {slotInfo && (
                        <p className="font-display text-4xl font-extrabold">{slotInfo.time.split(" – ")[0]}</p>
                      )}
                      <p className="mt-1 text-sm text-white/60">{formatDateLong(nextWalk.scheduledDate)}</p>
                    </div>
                    {currentBooking.walker && (
                      <div className="flex items-center gap-2.5">
                        <div className="text-right">
                          <p className="text-xs text-white/50">Walker</p>
                          <p className="text-sm font-bold">{currentBooking.walker.name}</p>
                          {walkerAggregate && walkerAggregate._count > 0 && (
                            <span className="flex items-center justify-end gap-0.5 text-xs font-bold text-amber-400">
                              <Star className="h-3 w-3 fill-amber-400" strokeWidth={0} />
                              {walkerAggregate._avg.score?.toFixed(1)}
                            </span>
                          )}
                        </div>
                        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-white/10">
                          {currentBooking.walker.photoUrl ? (
                            <Image src={currentBooking.walker.photoUrl} alt={currentBooking.walker.name} fill className="object-cover" />
                          ) : (
                            <UserIcon className="h-full w-full p-2 text-white/50" />
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-4">
                    {nextWalk.status === "ON_GOING" ? (
                      <span className="inline-flex items-center gap-1.5 text-base font-bold text-emerald-400">
                        <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" /> Walk in progress
                      </span>
                    ) : (
                      <>
                        <p className="text-sm text-white/50">Walker arriving in</p>
                        <p className="text-lg font-bold text-emerald-400">
                          {slotCountdownLabel(nextWalk.scheduledDate, currentBooking.slot)}
                        </p>
                      </>
                    )}
                  </div>

                  <Link
                    href={`/bookings/${currentBooking.id}`}
                    className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-full bg-white px-5 py-3 text-sm font-bold text-navy-800 transition hover:bg-sky-50"
                  >
                    <MapPin className="h-4 w-4" strokeWidth={2} />
                    Track Walk
                  </Link>
                </div>

                {/* Desktop layout — two columns with a divider */}
                <div className="relative mt-5 hidden gap-6 sm:flex">
                  <div className="sm:pr-6">
                    {slotInfo && (
                      <p className="font-display text-4xl font-extrabold">{slotInfo.time.split(" – ")[0]}</p>
                    )}
                    <p className="mt-1 text-sm text-white/60">{formatDateLong(nextWalk.scheduledDate)}</p>

                    <Link
                      href={`/bookings/${currentBooking.id}`}
                      className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-navy-800 transition hover:bg-sky-50"
                    >
                      <MapPin className="h-4 w-4" strokeWidth={2} />
                      Track Walk
                    </Link>
                  </div>

                  <div className="w-px self-stretch bg-white/15" />

                  <div>
                    {currentBooking.walker ? (
                      <>
                        <div className="flex items-center gap-3">
                          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-white/10">
                            {currentBooking.walker.photoUrl ? (
                              <Image src={currentBooking.walker.photoUrl} alt={currentBooking.walker.name} fill className="object-cover" />
                            ) : (
                              <UserIcon className="h-full w-full p-2.5 text-white/50" />
                            )}
                          </div>
                          <div>
                            <p className="text-xs text-white/50">Walker</p>
                            <p className="flex items-center gap-1.5 text-sm font-bold">
                              {currentBooking.walker.name}
                              {walkerAggregate && walkerAggregate._count > 0 && (
                                <span className="flex items-center gap-0.5 text-xs font-bold text-amber-400">
                                  <Star className="h-3.5 w-3.5 fill-amber-400" strokeWidth={0} />
                                  {walkerAggregate._avg.score?.toFixed(1)}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="mt-5">
                          {nextWalk.status === "ON_GOING" ? (
                            <>
                              <p className="text-sm text-white/50">Status</p>
                              <span className="inline-flex items-center gap-1.5 text-lg font-bold text-emerald-400">
                                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" /> In progress
                              </span>
                            </>
                          ) : (
                            <>
                              <p className="text-sm text-white/50">Walk status</p>
                              <p className="text-lg font-bold text-emerald-400">
                                {slotCountdownLabel(nextWalk.scheduledDate, currentBooking.slot)}
                              </p>
                            </>
                          )}
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-white/60">Walker not assigned yet</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative mt-6 flex-1 overflow-hidden rounded-2xl border border-navy-200 bg-navy-50 p-6">
                <LeashPath className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.08]" />
                <div className="relative z-10">
                  <h2 className="font-display text-lg font-semibold text-navy-700">Ready for a walk?</h2>
                  <p className="mt-1 text-sm text-navy-600/70">
                    Book a plan — Monday to Saturday, 30-minute walks, tracked start to finish.
                  </p>
                  <Link
                    href="/book"
                    className="relative z-10 mt-4 inline-block rounded-lg bg-navy-600 px-5 py-2.5 text-sm font-semibold text-paper transition hover:bg-navy-700"
                  >
                    Book a walk
                  </Link>
                </div>
              </div>
            )}
          </div>

          <div className="relative hidden overflow-hidden rounded-2xl lg:block">
            <Image
              src="/marketing/dashboard-hero.png"
              alt="A trained Strollo walker in uniform walking a golden retriever wearing a Strollo scarf"
              fill
              priority
              className="object-cover"
              style={{ objectPosition: "70% 8%" }}
            />
          </div>
        </div>

        {/* Hidden on mobile — the bottom tab bar's "Book a Walk" button
            already covers this there, so it'd just be a redundant second
            way to do the same thing. Desktop has no such persistent
            button, so it stays visible there. */}
        {currentBooking && (
          <div className="mt-6 hidden items-center justify-between gap-3 rounded-xl border border-dashed border-sand bg-white/60 px-5 py-4 sm:flex">
            <p className="text-sm text-ink/60">
              Another dog to walk? You can book anytime.
            </p>
            <Link
              href="/book"
              className="flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-navy-600 px-4 py-2 text-sm font-semibold text-paper transition hover:bg-navy-700"
            >
              <Plus className="h-4 w-4" strokeWidth={2.5} />
              Book another walk
            </Link>
          </div>
        )}

        {rateableBooking && rateableBooking.walker && (
          <div className="mt-6">
            <RateWalkerCard
              bookingId={rateableBooking.id}
              walkerName={rateableBooking.walker.name}
              planName={rateableBooking.plan.name}
            />
          </div>
        )}

        {/* Plan / Dogs / Walker */}
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-sand bg-white p-5">
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-100">
                  <Crown className="h-4 w-4 text-amber-600" strokeWidth={2} />
                </span>
                Current Plan
              </p>
              {currentBooking && (
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    ["ACTIVE", "WALKER_ASSIGNED"].includes(currentBooking.status)
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {currentBooking.status === "ACTIVE" ? "Active" : currentBooking.status.replace("_", " ")}
                </span>
              )}
            </div>
            {currentBooking ? (
              <>
                <p className="mt-2 font-display text-lg font-bold text-ink">{currentBooking.plan.name}</p>
                <p className="text-xs text-ink/50">30-min walks · Mon to Sat</p>
                <div className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2">
                  <CalendarCheck className="h-4 w-4 text-emerald-600" strokeWidth={2} />
                  <div>
                    <p className="text-sm font-bold text-emerald-700">{upcomingScheduled.length} Days Remaining</p>
                    <p className="text-[11px] text-ink/40">Plan ends {formatDateLong(currentBooking.endDate)}</p>
                  </div>
                </div>
                <Link
                  href={`/bookings/${currentBooking.id}`}
                  className="mt-3 flex items-center justify-between text-sm font-bold text-navy-600"
                >
                  Manage Plan <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </>
            ) : (
              <p className="mt-3 text-sm text-ink/50">No active plan right now.</p>
            )}
          </div>

          <div className="rounded-xl border border-sand bg-white p-5">
            <p className="flex items-center gap-2 text-sm font-semibold text-ink">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-100">
                <PawPrint className="h-4 w-4 text-sky-600" strokeWidth={2} />
              </span>
              {dogs.length === 1 ? "My Dog" : "My Dogs"}
            </p>
            <div className="mt-3 space-y-2">
              {dogs.length > 0 ? (
                dogs.slice(0, 2).map((dog) => <DogChip key={dog.id} dog={dog} />)
              ) : (
                <p className="text-sm text-ink/50">No dogs added yet.</p>
              )}
            </div>
            <Link href="/dogs" className="mt-3 flex items-center justify-between text-sm font-bold text-navy-600">
              View Profile <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="rounded-xl border border-sand bg-white p-5">
            <p className="flex items-center gap-2 text-sm font-semibold text-ink">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-100">
                <UserIcon className="h-4 w-4 text-violet-600" strokeWidth={2} />
              </span>
              Today's Walker
            </p>
            {currentBooking?.walker ? (
              <div className="mt-3 flex items-center gap-3">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-sky-50">
                  {currentBooking.walker.photoUrl ? (
                    <Image src={currentBooking.walker.photoUrl} alt={currentBooking.walker.name} fill className="object-cover" />
                  ) : (
                    <UserIcon className="h-full w-full p-3 text-navy-300" />
                  )}
                </div>
                <div>
                  <p className="font-display text-base font-bold text-ink">{currentBooking.walker.name}</p>
                  <div className="mt-0.5 flex items-center gap-1 text-xs font-bold text-amber-500">
                    {walkerAggregate && walkerAggregate._count > 0 ? (
                      <>
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" strokeWidth={0} />
                        {walkerAggregate._avg.score?.toFixed(1)}
                        <span className="font-medium text-ink/40">
                          ({walkerAggregate._count} rating{walkerAggregate._count === 1 ? "" : "s"})
                        </span>
                      </>
                    ) : (
                      <span className="font-medium text-ink/40">No ratings yet</span>
                    )}
                  </div>
                  {currentBooking.walker.govIdPhotoUrl && (
                    <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-bold text-violet-700">
                      <ShieldCheck className="h-3 w-3" strokeWidth={2.5} /> Verified
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <p className="mt-3 text-sm text-ink/50">Not assigned yet — an admin will assign one shortly.</p>
            )}
            <Link href="/bookings" className="mt-3 flex items-center justify-between text-sm font-bold text-navy-600">
              View Profile <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Timeline + Memories */}
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-sand bg-white p-5">
            <p className="flex items-center gap-2 text-sm font-semibold text-ink">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100">
                <CalendarCheck className="h-4 w-4 text-blue-600" strokeWidth={2} />
              </span>
              Today's Walk Progress
            </p>
            {todaysWalk && todaysWalk.status !== "CANCELLED" ? (
              <>
                <div className="mt-4">
                  <WalkTimeline steps={todaysTimelineSteps} />
                </div>
                {currentBooking && (
                  <Link
                    href={`/bookings/${currentBooking.id}`}
                    className="flex items-center gap-1 text-sm font-bold text-navy-600"
                  >
                    <MapPin className="h-3.5 w-3.5" /> Track Live <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                )}
              </>
            ) : todaysWalk?.status === "CANCELLED" ? (
              <p className="mt-4 text-sm text-ink/50">Today's walk was skipped.</p>
            ) : (
              <p className="mt-4 text-sm text-ink/50">No walk scheduled today.</p>
            )}
          </div>

          <div className="rounded-xl border border-sand bg-white p-5">
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-pink-100">
                  <Camera className="h-4 w-4 text-pink-600" strokeWidth={2} />
                </span>
                Walk Memories
              </p>
              <Link href="/bookings" className="text-xs font-bold text-navy-600">
                View All
              </Link>
            </div>
            <div className="mt-4">
              {recentPhotos.length > 0 ? (
                <PhotoMemories photos={recentPhotos} />
              ) : (
                <p className="text-sm text-ink/50">Photos from your dog's walks will show up here.</p>
              )}
            </div>
          </div>
        </div>

        {/* Skip a day */}
        {currentBooking && (
          <div className="mt-6">
            <SkipWalkDayCard
              bookingId={currentBooking.id}
              slot={currentBooking.slot}
              upcomingWalks={upcomingScheduled}
              cancelledCount={cancelledUpcoming}
            />
          </div>
        )}

        {/* Quick actions */}
        <div className="mt-6 rounded-xl border border-sand bg-white p-5">
          <p className="text-sm font-semibold text-ink">Quick Actions</p>
          <div className="mt-4 grid grid-cols-3 gap-4 text-center sm:grid-cols-6">
            <QuickAction href="/book" icon={CalendarCheck} label="Book a Walk" />
            <QuickAction href="/bookings" icon={CalendarCheck} label="My Bookings" />
            <QuickAction href="/dogs" icon={PawPrint} label="My Dogs" />
            <QuickAction href="/addresses" icon={MapPin} label="Addresses" />
            <QuickAction href="/contact" icon={Headphones} label="Support" />
            <QuickAction href="/profile" icon={UserIcon} label="Profile" />
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatTile icon={Footprints} value={totalWalks.toString()} label="Total Walks" tone="sky" />
          <StatTile icon={Route} value={`${totalDistanceKm.toFixed(0)} km`} label="Total Distance" tone="emerald" />
          <StatTile icon={Clock} value={`${totalHours.toFixed(0)} hrs`} label="Total Walk Time" tone="violet" />
          <StatTile icon={Heart} value={happyDays.toString()} label="Happy Days" tone="amber" />
        </div>

        {/* Trust strip */}
        <div className="relative mt-6 overflow-hidden rounded-xl border border-sand bg-white p-6">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-ink">
            <ShieldCheck className="h-4 w-4 text-navy-600" strokeWidth={1.75} />
            Why Pet Parents Love Strollo
          </p>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-5">
            <TrustItem icon={ShieldCheck} title="Verified Walkers" description="ID checked" tone="indigo" />
            <TrustItem icon={MapPin} title="Live Tracking" description="Real-time updates" tone="emerald" />
            <TrustItem icon={Camera} title="Walk Photos" description="Every visit" tone="pink" />
            <TrustItem icon={PawPrint} title="Poo & Pee Updates" description="We keep it clean" tone="teal" />
            <TrustItem icon={Receipt} title="GST Invoices" description="Every payment" tone="amber" />
          </div>
          <Image
            src="/marketing/dog-illustration.png"
            alt=""
            width={767}
            height={304}
            className="pointer-events-none absolute -bottom-2 -right-4 hidden w-48 opacity-90 sm:block"
          />
        </div>
      </div>
    </main>
  );
}

function greetingWord() {
  const hour = new Date().getHours();
  if (hour < 12) return "Morning";
  if (hour < 17) return "Afternoon";
  return "Evening";
}

function QuickAction({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) {
  return (
    <Link href={href} className="group flex flex-col items-center gap-2">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-sky-50 text-navy-600 transition group-hover:bg-navy-100">
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </span>
      <span className="text-xs font-medium text-ink/70">{label}</span>
    </Link>
  );
}

function StatTile({
  icon: Icon,
  value,
  label,
  tone,
}: {
  icon: React.ElementType;
  value: string;
  label: string;
  tone: "sky" | "emerald" | "violet" | "amber";
}) {
  const tones: Record<string, string> = {
    sky: "bg-sky-100 text-sky-700",
    emerald: "bg-emerald-100 text-emerald-700",
    violet: "bg-violet-100 text-violet-700",
    amber: "bg-amber-100 text-amber-700",
  };
  return (
    <div className={`rounded-xl p-4 ${tones[tone]}`}>
      <Icon className="h-5 w-5" strokeWidth={2} />
      <p className="mt-2 font-display text-2xl font-extrabold">{value}</p>
      <p className="text-xs font-medium opacity-70">{label}</p>
    </div>
  );
}

const TRUST_TONES: Record<string, string> = {
  indigo: "bg-indigo-100 text-indigo-600",
  emerald: "bg-emerald-100 text-emerald-600",
  pink: "bg-pink-100 text-pink-600",
  teal: "bg-teal-100 text-teal-600",
  amber: "bg-amber-100 text-amber-600",
};

function TrustItem({
  icon: Icon,
  title,
  description,
  tone,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  tone: keyof typeof TRUST_TONES;
}) {
  return (
    <div className="flex flex-col items-start gap-1.5">
      <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${TRUST_TONES[tone]}`}>
        <Icon className="h-4 w-4" strokeWidth={2} />
      </span>
      <p className="text-xs font-bold text-ink">{title}</p>
      <p className="text-[11px] text-ink/50">{description}</p>
    </div>
  );
}
