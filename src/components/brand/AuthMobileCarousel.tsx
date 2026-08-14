"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ShieldCheck, MapPin, Camera, ChevronRight, PawPrint } from "lucide-react";
import Logo from "./Logo";
import AuthTrustCard from "./AuthTrustCard";
import OtpAuthForm from "@/components/OtpAuthForm";

const FEATURES = [
  { icon: ShieldCheck, title: "Verified & trained", description: "ID-verified, trained, and personally assigned." },
  { icon: MapPin, title: "Live walk tracking", description: "Watch the route update in real time." },
  { icon: Camera, title: "Photo updates", description: "Real photos from every visit." },
];

type Props = {
  mode: "LOGIN" | "SIGNUP";
  heading: string;
  subheading: string;
  footerText: string;
  footerLinkHref: string;
  footerLinkLabel: string;
};

// A 2-screen swipeable carousel for the mobile auth flow — screen 1 is the
// brand intro (photo, headline, features), screen 2 is the actual OTP
// form. Uses native CSS scroll-snap for touch-swipe, same technique as the
// dashboard's PhotoMemories carousel — no gesture library needed. Desktop
// keeps the existing side-by-side AuthBrandPanel layout untouched.
export default function AuthMobileCarousel({
  mode,
  heading,
  subheading,
  footerText,
  footerLinkHref,
  footerLinkLabel,
}: Props) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  function handleScroll() {
    const el = scrollerRef.current;
    if (!el) return;
    setActive(Math.round(el.scrollLeft / el.clientWidth));
  }

  function goToSlide(i: number) {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
    setActive(i);
  }

  return (
    <div className="relative h-[100dvh] overflow-hidden md:hidden">
      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        className="flex h-full snap-x snap-mandatory overflow-x-auto scroll-smooth"
        style={{ scrollbarWidth: "none" }}
      >
        {/* Slide 1 — brand intro */}
        <div className="flex h-full w-full shrink-0 snap-start flex-col overflow-y-auto">
          <div className="relative h-[42%] w-full shrink-0 overflow-hidden rounded-b-[2.5rem]">
            <Image
              src="/marketing/dashboard-hero.png"
              alt="A trained Strollo walker in uniform walking a golden retriever wearing a Strollo scarf"
              fill
              priority
              className="object-cover"
              style={{ objectPosition: "68% 30%" }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-navy-900/20 via-transparent to-transparent" />
            <div className="absolute left-5 top-5">
              <Logo variant="full" priority className="h-auto w-28 brightness-0 invert" />
            </div>
          </div>

          <div className="flex flex-1 flex-col px-6 pb-6 pt-5">
            <p className="font-display text-3xl font-extrabold leading-[1.1]">
              <span className="text-navy-700">Happy Steps,</span>
              <br />
              <span className="text-sky-600">Happy Dogs</span>
            </p>
            <p className="mt-2 text-sm leading-relaxed text-ink/60">
              Trusted walkers, tracked routes, and a happier dog waiting for
              you at the door.
            </p>

            <div className="mt-4 space-y-3">
              {FEATURES.map((f) => (
                <div key={f.title} className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-50">
                    <f.icon className="h-4 w-4 text-navy-600" strokeWidth={1.75} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-navy-700">{f.title}</p>
                    <p className="text-xs leading-snug text-ink/50">{f.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => goToSlide(1)}
              className="mt-auto flex w-full items-center justify-center gap-1.5 rounded-full bg-navy-600 px-5 py-3 text-sm font-bold text-paper transition hover:bg-navy-700"
            >
              {mode === "LOGIN" ? "Login" : "Get started"}
              <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Slide 2 — the actual form */}
        <div className="h-full w-full shrink-0 snap-start overflow-y-auto">
          <div className="relative px-6 py-8">
            <PawPrint className="absolute -top-1 right-8 h-6 w-6 text-sky-200" strokeWidth={2} />
            <PawPrint className="absolute -top-5 right-16 h-4 w-4 text-sky-200" strokeWidth={2} />

            <Logo variant="full" priority className="mb-8 h-auto w-32" />
            <h1 className="font-display text-3xl font-semibold text-ink">{heading}</h1>
            <p className="mb-8 mt-2 text-sm text-ink/60">{subheading}</p>

            <OtpAuthForm purpose={mode} />

            <p className="mt-8 text-sm text-ink/60">
              {footerText}{" "}
              <Link href={footerLinkHref} className="font-medium text-navy-600 underline underline-offset-2">
                {footerLinkLabel}
              </Link>
            </p>

            <AuthTrustCard />
          </div>
        </div>
      </div>

      {/* dot indicators */}
      <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center gap-1.5">
        {[0, 1].map((i) => (
          <span
            key={i}
            className={`h-1.5 rounded-full transition-all ${
              active === i ? "w-5 bg-navy-600" : "w-1.5 bg-sand"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
