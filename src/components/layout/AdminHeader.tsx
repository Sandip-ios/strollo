import Link from "next/link";
import Logo from "@/components/brand/Logo";
import LogoutButton from "@/components/LogoutButton";
import NotificationBell from "@/components/notifications/NotificationBell";

const ADMIN_NAV_LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/walkers", label: "Walkers" },
  { href: "/admin/ratings", label: "Ratings" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/master", label: "Master" },
];

export default function AdminHeader({ active }: { active?: string }) {
  return (
    <header className="border-b border-sand">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4 sm:px-10">
        <Link href="/admin" className="flex items-center gap-3">
          <Logo variant="mark" className="h-8 w-8" />
          <span className="font-display text-lg font-semibold text-navy-700">Admin</span>
        </Link>
        <nav className="hidden items-center gap-6 sm:flex">
          {ADMIN_NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition ${
                active === link.href ? "text-navy-600" : "text-ink/50 hover:text-ink"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <NotificationBell />
          <LogoutButton />
        </div>
      </div>
      <nav
        className="flex items-center gap-5 overflow-x-auto border-t border-sand px-6 py-2 sm:hidden"
        style={{ scrollbarWidth: "none" }}
      >
        {ADMIN_NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`shrink-0 text-xs font-medium transition ${
              active === link.href ? "text-navy-600" : "text-ink/50"
            }`}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
