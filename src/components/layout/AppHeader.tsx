import Link from "next/link";
import { LayoutDashboard, CalendarCheck, PawPrint, MapPin, User } from "lucide-react";
import Logo from "@/components/brand/Logo";
import LogoutButton from "@/components/LogoutButton";
import NotificationBell from "@/components/notifications/NotificationBell";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/bookings", label: "My Bookings", icon: CalendarCheck },
  { href: "/dogs", label: "My Dogs", icon: PawPrint },
  { href: "/addresses", label: "Addresses", icon: MapPin },
  { href: "/profile", label: "Profile", icon: User },
];

export default function AppHeader({ active }: { active?: string }) {
  return (
    <>
      <header className="border-b border-sand bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5 sm:px-10">
          <Link href="/dashboard">
            <Logo variant="full" className="h-auto w-28" />
          </Link>
          <nav className="hidden items-center gap-6 sm:flex">
            {NAV_LINKS.map((link) => {
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

      {/* Fixed bottom tab bar — mobile only */}
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-sand bg-white pb-[env(safe-area-inset-bottom)] sm:hidden">
        {NAV_LINKS.map((link) => {
          const isActive = active === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition ${
                isActive ? "text-navy-600" : "text-ink/50"
              }`}
            >
              <link.icon className="h-5 w-5" strokeWidth={isActive ? 2.25 : 1.75} />
              {link.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
