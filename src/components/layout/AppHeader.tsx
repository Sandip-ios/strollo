import Link from "next/link";
import { LayoutDashboard, Home, CalendarCheck, Dog, PawPrint, User } from "lucide-react";
import Logo from "@/components/brand/Logo";
import LogoutButton from "@/components/LogoutButton";
import NotificationBell from "@/components/notifications/NotificationBell";

// Addresses moved off the primary nav into Profile — five slots is
// already a full bottom tab bar once "Book a walk" takes the center one,
// and address management isn't a frequent-enough action to hold a slot
// over that.
// mobileIcon lets the floating bottom bar use a different (bolder, more
// glanceable) icon than the desktop top nav for the same link, without
// duplicating href/label in two places.
const NAV_LINKS = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard, mobileIcon: Home },
  { href: "/bookings", label: "Bookings", icon: CalendarCheck },
  { href: "/dogs", label: "My Dogs", icon: PawPrint, mobileIcon: Dog },
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
            {NAV_LINKS.slice(0, 2).map((link) => {
              const isActive = active === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 whitespace-nowrap border-b-2 py-1 text-sm font-medium transition ${
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
            <Link
              href={BOOK_LINK.href}
              className="flex items-center gap-1.5 whitespace-nowrap rounded-full bg-navy-600 px-4 py-1.5 text-sm font-semibold text-paper transition hover:bg-navy-700"
            >
              <PawPrint className="h-4 w-4" strokeWidth={2} />
              {BOOK_LINK.label}
            </Link>
            {NAV_LINKS.slice(2).map((link) => {
              const isActive = active === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 whitespace-nowrap border-b-2 py-1 text-sm font-medium transition ${
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
        {NAV_LINKS.slice(0, 2).map((link) => {
          const isActive = active === link.href;
          const Icon = link.mobileIcon ?? link.icon;
          return (
            <Link key={link.href} href={link.href} className="flex flex-col items-center gap-1 py-3">
              <span
                className={`flex h-8 w-14 items-center justify-center rounded-full transition ${
                  isActive ? "bg-sky-100" : ""
                }`}
              >
                <Icon
                  className={`h-5 w-5 ${isActive ? "text-ink" : "text-ink/40"}`}
                  strokeWidth={1.75}
                  fill={isActive ? "currentColor" : "none"}
                />
              </span>
              <span className={`text-[11px] font-semibold ${isActive ? "text-ink" : "text-ink/40"}`}>
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
          <span className="mt-9 pb-2.5 text-[11px] font-semibold text-navy-600">{BOOK_LINK.label}</span>
        </Link>

        {NAV_LINKS.slice(2).map((link) => {
          const isActive = active === link.href;
          const Icon = link.mobileIcon ?? link.icon;
          return (
            <Link key={link.href} href={link.href} className="flex flex-col items-center gap-1 py-3">
              <span
                className={`flex h-8 w-14 items-center justify-center rounded-full transition ${
                  isActive ? "bg-sky-100" : ""
                }`}
              >
                <Icon
                  className={`h-5 w-5 ${isActive ? "text-ink" : "text-ink/40"}`}
                  strokeWidth={1.75}
                  fill={isActive ? "currentColor" : "none"}
                />
              </span>
              <span className={`text-[11px] font-semibold ${isActive ? "text-ink" : "text-ink/40"}`}>
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
