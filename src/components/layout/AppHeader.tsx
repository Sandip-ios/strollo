import Link from "next/link";
import { LayoutDashboard, CalendarCheck, Dog, PawPrint, MapPin, User } from "lucide-react";
import Logo from "@/components/brand/Logo";
import LogoutButton from "@/components/LogoutButton";
import NotificationBell from "@/components/notifications/NotificationBell";

// Just lucide's house outline path with the door sub-path dropped — the
// door is what forced a visible seam when filled (see the strokeWidth
// note below), and this shape's corners are already drawn with rounded
// arcs, so on its own it reads as a soft, friendly solid house glyph
// instead of a sharp architectural one.
function HomeGlyph({ className, filled }: { className?: string; filled?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={filled ? 0 : 1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </svg>
  );
}

// Desktop keeps the original, plain top nav untouched — Addresses included.
const DESKTOP_NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/bookings", label: "My Bookings", icon: CalendarCheck },
  { href: "/dogs", label: "My Dogs", icon: PawPrint },
  { href: "/addresses", label: "Addresses", icon: MapPin },
  { href: "/profile", label: "Profile", icon: User },
];

// Mobile gets its own bottom tab bar, styled and structured independently
// from desktop: "Book a walk" takes the center slot as an elevated
// button, Addresses is dropped (reachable from Profile instead) since
// five slots is already full once that center button takes one.
const MOBILE_NAV_LINKS = [
  { href: "/dashboard", label: "Home", icon: null, keepStrokeWhenFilled: false },
  { href: "/bookings", label: "Bookings", icon: CalendarCheck, keepStrokeWhenFilled: false },
  // Dog's ears/eyes/nose are drawn as open stroke paths, not closed
  // fillable shapes (unlike Home's door) — zeroing the stroke when
  // filled erases those details entirely, leaving just a blank blob
  // where the head outline is. Needs its stroke kept on top of the fill.
  { href: "/dogs", label: "My Dogs", icon: Dog, keepStrokeWhenFilled: true },
  { href: "/profile", label: "Profile", icon: User, keepStrokeWhenFilled: false },
];

const BOOK_LINK = { href: "/book", label: "Book a Walk" };

function MobileTab({ link, isActive }: { link: (typeof MOBILE_NAV_LINKS)[number]; isActive: boolean }) {
  return (
    <Link href={link.href} className="flex flex-col items-center gap-1 py-3">
      <span
        className={`flex h-8 w-14 items-center justify-center rounded-full transition ${
          isActive ? "bg-sky-100" : ""
        }`}
      >
        {/* strokeWidth 0 when filled — some icons have an internal closed
            sub-path that otherwise gets its own visible outline stroke
            even though it's the same fill color as the body, leaving a
            stray seam line inside what should read as one solid
            silhouette. HomeGlyph sidesteps this itself (no door path).
            keepStrokeWhenFilled opts an icon out of this when its detail
            marks (Dog's ears/eyes/nose) need the stroke to be visible
            at all, since they're not closed shapes a fill can render. */}
        {link.icon ? (
          <link.icon
            className={`h-[25px] w-[25px] ${isActive ? "text-ink" : "text-ink/60"}`}
            strokeWidth={isActive && !link.keepStrokeWhenFilled ? 0 : 1.75}
            fill={isActive ? "currentColor" : "none"}
          />
        ) : (
          <HomeGlyph className={`h-[25px] w-[25px] ${isActive ? "text-ink" : "text-ink/60"}`} filled={isActive} />
        )}
      </span>
      <span className={`whitespace-nowrap text-[11px] font-semibold ${isActive ? "text-ink" : "text-ink/60"}`}>
        {link.label}
      </span>
      <span className={`h-1 w-1 rounded-full ${isActive ? "bg-navy-600" : "bg-transparent"}`} />
    </Link>
  );
}

export default function AppHeader({ active }: { active?: string }) {
  return (
    <>
      <header className="border-b border-sand bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5 sm:px-10">
          <Link href="/dashboard">
            <Logo variant="full" className="h-auto w-28" />
          </Link>
          <nav className="hidden items-center gap-6 sm:flex">
            {DESKTOP_NAV_LINKS.map((link) => {
              const isActive = active === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 border-b-2 py-1 text-sm font-medium transition ${
                    isActive
                      ? "border-navy-600 text-navy-600"
                      : "border-transparent text-ink/80 hover:text-ink"
                  }`}
                >
                  <link.icon className="h-4 w-4" strokeWidth={1.75} />
                  {link.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <span className="hidden sm:block">
              <LogoutButton />
            </span>
            <span className="sm:hidden">
              <LogoutButton iconOnly />
            </span>
          </div>
        </div>
      </header>

      {/* Floating bottom tab bar — mobile only, styled independently from
          the desktop top nav. "Book a walk" sits in the center slot as an
          elevated circular button rather than a plain tab. */}
      <nav
        className="fixed inset-x-3 z-40 grid grid-cols-5 rounded-[28px] border border-sand/60 bg-white shadow-[0_10px_30px_rgba(16,37,64,0.14)] sm:hidden"
        style={{ bottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
      >
        {MOBILE_NAV_LINKS.slice(0, 2).map((link) => (
          <MobileTab key={link.href} link={link} isActive={active === link.href} />
        ))}

        <Link href={BOOK_LINK.href} className="relative flex flex-col items-center">
          {/* -top-3 on a h-16 circle pokes ~19% of it above the bar —
              mostly nested into the bar rather than floating way above it. */}
          <span className="absolute -top-3 flex h-16 w-16 items-center justify-center rounded-full bg-navy-600 text-paper shadow-lg ring-4 ring-white transition hover:bg-navy-700">
            <PawPrint className="h-[29px] w-[29px]" strokeWidth={1.5} fill="currentColor" />
          </span>
          {/* A tight, fixed gap below the circle — not lined up with the
              other tabs' labels; the circle's own size dictates this
              tab's rhythm, same as the reference. */}
          <span className="mt-[58px] whitespace-nowrap pb-2.5 text-[11px] font-semibold text-navy-600">
            {BOOK_LINK.label}
          </span>
        </Link>

        {MOBILE_NAV_LINKS.slice(2).map((link) => (
          <MobileTab key={link.href} link={link} isActive={active === link.href} />
        ))}
      </nav>
    </>
  );
}
