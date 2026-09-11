import Link from "next/link";
import { LayoutDashboard, Home, CalendarCheck, Dog, PawPrint, MapPin, User } from "lucide-react";
import Logo from "@/components/brand/Logo";
import LogoutButton from "@/components/LogoutButton";
import NotificationBell from "@/components/notifications/NotificationBell";

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
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/bookings", label: "Bookings", icon: CalendarCheck },
  { href: "/dogs", label: "My Dogs", icon: Dog },
  { href: "/profile", label: "Profile", icon: User },
];

const BOOK_LINK = { href: "/book", label: "Book a walk" };

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
        {MOBILE_NAV_LINKS.slice(0, 2).map((link) => {
          const isActive = active === link.href;
          return (
            <Link key={link.href} href={link.href} className="flex flex-col items-center gap-1 py-3">
              <span
                className={`flex h-8 w-14 items-center justify-center rounded-full transition ${
                  isActive ? "bg-sky-100" : ""
                }`}
              >
                <link.icon
                  className={`h-5 w-5 ${isActive ? "text-ink" : "text-ink/60"}`}
                  strokeWidth={1.75}
                  fill={isActive ? "currentColor" : "none"}
                />
              </span>
              <span className={`whitespace-nowrap text-[11px] font-semibold ${isActive ? "text-ink" : "text-ink/60"}`}>
                {link.label}
              </span>
              <span className={`h-1 w-1 rounded-full ${isActive ? "bg-navy-600" : "bg-transparent"}`} />
            </Link>
          );
        })}

        <Link href={BOOK_LINK.href} className="relative flex flex-col items-center">
          <span className="absolute -top-7 flex h-14 w-14 items-center justify-center rounded-full bg-navy-600 text-paper shadow-lg ring-4 ring-white transition hover:bg-navy-700">
            <PawPrint className="h-6 w-6" strokeWidth={2} />
          </span>
          {/* mt-12 lines this up with the other tabs' labels: they sit at
              py-3 (12px) + icon pill h-8 (32px) + gap-1 (4px) = 48px from
              the row's top edge, same as this 48px margin. */}
          <span className="mt-12 whitespace-nowrap pb-3 text-[11px] font-semibold text-navy-600">
            {BOOK_LINK.label}
          </span>
        </Link>

        {MOBILE_NAV_LINKS.slice(2).map((link) => {
          const isActive = active === link.href;
          return (
            <Link key={link.href} href={link.href} className="flex flex-col items-center gap-1 py-3">
              <span
                className={`flex h-8 w-14 items-center justify-center rounded-full transition ${
                  isActive ? "bg-sky-100" : ""
                }`}
              >
                <link.icon
                  className={`h-5 w-5 ${isActive ? "text-ink" : "text-ink/60"}`}
                  strokeWidth={1.75}
                  fill={isActive ? "currentColor" : "none"}
                />
              </span>
              <span className={`whitespace-nowrap text-[11px] font-semibold ${isActive ? "text-ink" : "text-ink/60"}`}>
                {link.label}
              </span>
              <span className={`h-1 w-1 rounded-full ${isActive ? "bg-navy-600" : "bg-transparent"}`} />
            </Link>
          );
        })}
      </nav>
    </>
  );
}
