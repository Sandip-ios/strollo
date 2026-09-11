import Link from "next/link";
import Image from "next/image";
import { CalendarCheck, MapPin, ShieldCheck, Camera, PawPrint, Heart, User } from "lucide-react";
import SiteHeader from "@/components/marketing/SiteHeader";
import SiteFooter from "@/components/marketing/SiteFooter";
import DashedHeartDoodle from "@/components/brand/DashedHeartDoodle";
import { prisma } from "@/lib/prisma";
import { WALK_DURATION_MINUTES } from "@/lib/constants";

const HERO_BADGES = [
  { icon: ShieldCheck, label: "Verified & Trained Walkers" },
  { icon: MapPin, label: "Live Walk Tracking" },
  { icon: Camera, label: "Photo Updates" },
  { icon: Heart, label: "Poo & Health Updates" },
];

function HeroHeading() {
  return (
    <>
      <h1 className="font-display text-4xl font-extrabold leading-[1.05] sm:text-5xl lg:text-6xl">
        <span className="text-navy-800">Happy Steps,</span>
        <br />
        <span className="text-blue-600">Happy Dogs</span>
      </h1>
      <p className="mt-4 max-w-md text-base leading-relaxed text-ink/60">
        Trusted dog walking, real-time tracking, and lots of love — because
        your dog deserves the best.
      </p>
    </>
  );
}

function HeroCTAButtons() {
  return (
    <div className="mt-6 flex flex-wrap gap-3">
      <Link
        href="/signup"
        className="flex items-center gap-3 rounded-full bg-blue-600 py-3 pl-3 pr-6 text-base font-bold text-white shadow-lg shadow-blue-900/25 transition hover:bg-blue-700"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white">
          <PawPrint className="h-4 w-4 text-blue-600" strokeWidth={2.5} />
        </span>
        Book Your First Walk
      </Link>
      <Link
        href="/login"
        className="flex items-center gap-2.5 rounded-full border-2 border-navy-600 bg-white py-3 pl-5 pr-6 text-base font-bold text-navy-700 transition hover:bg-navy-50"
      >
        <User className="h-5 w-5" strokeWidth={2.25} />
        Login
      </Link>
    </div>
  );
}

// One solid white card grouping all four badges together (not four
// separate chips) — reads cleanly whether it's sitting on the busy hero
// photo (xl+ overlay layout) or the plain bg-paper stacked layout below.
function HeroBadgeRow() {
  return (
    <div className="mt-6 flex divide-x divide-sand rounded-2xl bg-white px-2 py-4 shadow-lg shadow-navy-900/10 sm:px-4">
      {HERO_BADGES.map((b) => (
        <div key={b.label} className="flex flex-1 flex-col items-center px-1.5 text-center sm:px-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-50">
            <b.icon className="h-5 w-5 text-blue-600" strokeWidth={1.75} />
          </div>
          <p className="mt-1.5 text-[11px] font-semibold leading-tight text-navy-700">{b.label}</p>
        </div>
      ))}
    </div>
  );
}

const FEATURES = [
  {
    icon: CalendarCheck,
    title: "Book in minutes",
    description: "Pick a slot, a dog, an address — pay, and you're set for the month.",
  },
  {
    icon: MapPin,
    title: "Every walk logged",
    description: "Live GPS route, duration, and distance for each visit, start to finish.",
  },
  {
    icon: Camera,
    title: "Photo updates",
    description: "See your dog mid-walk, not just a checkmark when it's done.",
  },
  {
    icon: ShieldCheck,
    title: "Trained, vetted walkers",
    description: "Trained, ID-verified, admin-assigned walkers — never a stranger's app profile.",
  },
];

const STEPS = [
  {
    step: "1",
    title: "Add your dog",
    description: "Breed, size, vaccination status, and anything a walker should know.",
  },
  {
    step: "2",
    title: "Pick a plan",
    description: "Monthly, weekly, or a custom plan sized to how many dogs you have.",
  },
  {
    step: "3",
    title: "Track every walk",
    description: "Get notified when your trained, uniformed walker starts, and watch the route live.",
  },
];

const GALLERY = [
  {
    src: "https://images.unsplash.com/photo-1624956578877-4948166c5dcb?w=800&q=80&fit=crop",
    alt: "Happy dog sitting in a green field",
    className: "row-span-2",
  },
  {
    src: "https://images.unsplash.com/photo-1544568100-847a948585b9?w=900&q=80&fit=crop",
    alt: "Dog smiling on a walking trail",
    className: "",
  },
  {
    src: "https://images.unsplash.com/photo-1608363789080-2d1f019445fa?w=800&q=80&fit=crop",
    alt: "Two small dogs on leashes on a city street",
    className: "",
  },
];

export default async function Home() {
  const plan = await prisma.plan.findFirst({
    where: { type: "MONTHLY", isActive: true, deletedAt: null },
  });

  return (
    <main className="bg-paper">
      <SiteHeader variant="transparent" />

      {/* Hero — stacked layout below xl (photo band on top, content in a
          plain paper section below — the safe, proven pattern already
          used by AuthMobileCarousel), and a full-bleed photo with text
          overlaid on its bright-sky left half at xl+. This photo is
          already a short, wide banner crop (2240x702, ~3.2:1) with both
          the walker and dog fully in frame, so the xl+ section matches
          that aspect ratio directly — short height, zero crop. A
          xl:min-h-[460px] floor guards the content (headline, buttons,
          badge card) from being clipped at the narrow end of xl widths;
          when that floor wins over the aspect-ratio height, object-cover
          just crops a bit of the side background instead, never the
          walker/dog vertically. */}
      <section className="relative overflow-hidden bg-paper xl:hidden">
        <div className="relative h-64 w-full sm:h-80">
          <Image
            src="/marketing/hero-banner.png"
            alt="A trained Strollo walker in uniform walking a golden retriever wearing a Strollo scarf"
            fill
            priority
            className="object-cover object-[60%_center]"
          />
        </div>
        <div className="px-6 py-8 sm:px-10">
          <HeroHeading />
          <HeroCTAButtons />
          <HeroBadgeRow />
        </div>
      </section>

      <section className="relative hidden overflow-hidden bg-paper xl:block xl:aspect-[2240/702] xl:min-h-[460px]">
        <Image
          src="/marketing/hero-banner.png"
          alt="A trained Strollo walker in uniform walking a golden retriever wearing a Strollo scarf"
          fill
          priority
          className="object-cover"
        />
        <DashedHeartDoodle className="absolute left-[49%] top-[8%] h-28 w-16 opacity-80" />

        <div className="relative flex h-full items-center">
          <div className="mx-auto w-full max-w-6xl px-6 xl:px-12">
            <div className="max-w-md">
              <HeroHeading />
              <HeroCTAButtons />
              <HeroBadgeRow />
            </div>
          </div>
        </div>
      </section>

      {/* Stats band */}
      <section className="bg-sky-100">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-6 py-10 text-center sm:grid-cols-4">
          {[
            { value: `${WALK_DURATION_MINUTES} min`, label: "Every walk" },
            { value: "6 days", label: "Mon–Sat coverage" },
            { value: "100%", label: "Trained & verified walkers" },
            { value: "Live", label: "GPS route tracking" },
          ].map((s) => (
            <div key={s.label}>
              <p className="font-display text-3xl font-extrabold text-navy-700 sm:text-4xl">{s.value}</p>
              <p className="mt-1 text-sm font-medium text-navy-600/70">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-1.5 text-sm font-bold uppercase tracking-wide text-sky-600">
              <PawPrint className="h-4 w-4" strokeWidth={2.5} />
              Built for peace of mind
            </span>
            <h2 className="mt-3 font-display text-4xl font-extrabold text-navy-700 sm:text-5xl">
              Everything you'd want, nothing you wouldn't.
            </h2>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-sand bg-paper p-6 transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-100">
                  <f.icon className="h-6 w-6 text-navy-600" strokeWidth={1.75} />
                </div>
                <h3 className="mt-4 font-display text-lg font-bold text-ink">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink/60">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Photo gallery */}
      <section className="bg-sand/40">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="max-w-xl font-display text-4xl font-extrabold text-navy-700 sm:text-5xl">
            Dogs love their Strollo days.
          </h2>
          <div className="mt-10 grid grid-cols-2 grid-rows-2 gap-4" style={{ height: "min(80vw, 560px)" }}>
            {GALLERY.map((g) => (
              <div key={g.src} className={`relative overflow-hidden rounded-2xl ${g.className}`}>
                <Image src={g.src} alt={g.alt} fill className="object-cover" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 md:grid-cols-2">
          <div>
            <h2 className="font-display text-4xl font-extrabold text-navy-700 sm:text-5xl">How it works</h2>
            <div className="mt-10 space-y-8">
              {STEPS.map((s) => (
                <div key={s.step} className="flex gap-5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-navy-600 font-display text-lg font-bold text-white">
                    {s.step}
                  </span>
                  <div>
                    <h3 className="font-display text-xl font-bold text-ink">{s.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-ink/60">{s.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative aspect-[4/5] overflow-hidden rounded-3xl">
            <Image
              src="/marketing/walker-uniform.png"
              alt="A trained Strollo walker in uniform walking a golden retriever wearing a Strollo scarf"
              fill
              className="object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-navy-900/70 to-transparent p-5">
              <p className="text-sm font-semibold text-white">
                Every walk led by a trained, uniformed Strollo walker.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing teaser */}
      {plan && (
        <section className="bg-navy-50">
          <div className="mx-auto max-w-6xl px-6 py-20 text-center">
            <span className="text-sm font-bold uppercase tracking-wide text-sky-600">Simple pricing</span>
            <p className="mt-4 font-display text-5xl font-extrabold text-navy-700 sm:text-6xl">
              ₹{(plan.price / 100).toLocaleString("en-IN")}
              <span className="text-2xl font-semibold text-navy-600/60">/month</span>
            </p>
            <p className="mx-auto mt-4 max-w-md text-base text-ink/60">
              One dog, six walks a week. Need something else? Weekly plans and
              custom multi-dog plans are available too.
            </p>
            <Link
              href="/signup"
              className="mt-8 inline-block rounded-full bg-navy-600 px-8 py-4 text-base font-bold text-paper shadow-lg shadow-navy-900/10 transition hover:bg-navy-700"
            >
              Start your plan
            </Link>
          </div>
        </section>
      )}

      {/* CTA banner */}
      <section className="relative overflow-hidden bg-navy-800">
        <Image
          src="https://images.unsplash.com/photo-1618946019619-9d7b7d86b48f?w=1800&q=80&fit=crop"
          alt="Walker with a small dog on a forest path"
          fill
          className="object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-navy-900/90 via-navy-900/60 to-navy-900/90" />
        <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-4 px-6 py-20 text-center">
          <h2 className="font-display text-4xl font-extrabold text-white sm:text-5xl">
            Ready for happier walks?
          </h2>
          <p className="max-w-md text-base text-white/70">
            Add your dog, pick a plan, and your first tracked walk can happen
            this week.
          </p>
          <Link
            href="/signup"
            className="mt-4 rounded-full bg-sky-400 px-8 py-4 text-base font-bold text-navy-900 shadow-lg transition hover:bg-sky-300"
          >
            Get started free
          </Link>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
