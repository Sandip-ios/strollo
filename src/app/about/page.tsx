import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ShieldCheck, MapPin, Heart } from "lucide-react";
import SiteHeader from "@/components/marketing/SiteHeader";
import SiteFooter from "@/components/marketing/SiteFooter";

export const metadata: Metadata = {
  title: "About Us — Strollo",
  description: "Why Strollo exists, and how every walk gets tracked.",
};

const VALUES = [
  {
    icon: ShieldCheck,
    title: "Trained, verified",
    description:
      "Every walker on Strollo is trained, ID-verified, and personally assigned by our team — never a stranger's self-listed profile.",
  },
  {
    icon: MapPin,
    title: "Nothing left to guess",
    description:
      "GPS route, duration, and photo updates for every single walk, so you always know exactly how it went.",
  },
  {
    icon: Heart,
    title: "Dogs first",
    description:
      "Walk plans, slots, and pacing are all built around what's actually good for the dog — not just what's convenient to schedule.",
  },
];

export default function AboutPage() {
  return (
    <main className="bg-paper">
      <SiteHeader />

      <section className="relative overflow-hidden bg-navy-800">
        <Image
          src="https://images.unsplash.com/photo-1663840196762-04dba3d356e1?w=1600&q=80&fit=crop"
          alt="Walker with a dog in a park"
          fill
          className="object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-900 via-navy-900/60 to-navy-900/20" />
        <div className="relative mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <span className="inline-block rounded-full bg-sky-400/20 px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-sky-200 ring-1 ring-inset ring-sky-300/30">
            About Strollo
          </span>
          <h1 className="mt-6 max-w-2xl font-display text-5xl font-extrabold leading-[0.98] text-white sm:text-6xl">
            Every dog deserves a walk someone can vouch for.
          </h1>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
        <p className="text-lg leading-relaxed text-ink/70">
          Strollo started with a simple frustration familiar to any dog owner juggling a busy
          schedule in Ahmedabad: hiring a dog walker meant handing your front door key and your
          dog to someone you'd only met once, with no real way to know how the walk actually went.
        </p>
        <p className="mt-4 text-lg leading-relaxed text-ink/70">
          So we built the thing we wanted for our own dogs — a service where every walker is
          trained, personally vetted, and assigned by our team, every walk is tracked start to
          finish on a live map, and every visit comes back with photos instead of just a
          checkmark. Book a plan, add your dog, and know — not hope — that they had a good walk.
        </p>
      </section>

      <section className="border-t border-sand bg-white">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-16 sm:py-20 md:grid-cols-2">
          <div className="relative aspect-[4/5] overflow-hidden rounded-3xl md:order-2">
            <Image
              src="/marketing/walker-uniform.png"
              alt="A trained Strollo walker in uniform walking a golden retriever wearing a Strollo scarf"
              fill
              className="object-cover"
            />
          </div>
          <div className="md:order-1">
            <span className="text-sm font-bold uppercase tracking-wide text-sky-600">Who walks your dog</span>
            <h2 className="mt-3 font-display text-3xl font-extrabold text-navy-700 sm:text-4xl">
              Trained, professional, and easy to spot.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-ink/70">
              Every Strollo walker goes through training before they're assigned their first walk,
              and shows up in a Strollo uniform so you always know it's really them at your door —
              not a stranger's app profile.
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-sand bg-white">
        <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
          <h2 className="font-display text-3xl font-extrabold text-navy-700 sm:text-4xl">
            What we care about
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {VALUES.map((v) => (
              <div key={v.title} className="rounded-2xl border border-sand bg-paper p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-100">
                  <v.icon className="h-6 w-6 text-navy-600" strokeWidth={1.75} />
                </div>
                <h3 className="mt-4 font-display text-lg font-bold text-ink">{v.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink/60">{v.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-navy-50">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-14 text-center sm:flex-row sm:text-left">
          <div>
            <h2 className="font-display text-2xl font-extrabold text-navy-700">
              Want to see it for yourself?
            </h2>
            <p className="mt-1 text-sm text-navy-600/70">
              Book your dog's first tracked walk this week.
            </p>
          </div>
          <Link
            href="/signup"
            className="rounded-full bg-navy-600 px-8 py-4 text-sm font-bold text-paper shadow-lg transition hover:bg-navy-700"
          >
            Get started
          </Link>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
