import Link from "next/link";
import { LayoutDashboard, CheckCircle2 } from "lucide-react";
import Logo from "@/components/brand/Logo";
import LogoutButton from "@/components/LogoutButton";
import NotificationBell from "@/components/notifications/NotificationBell";

const NAV_LINKS = [
  { href: "/walker", label: "Dashboard", icon: LayoutDashboard },
  { href: "/walker/completed", label: "Completed", icon: CheckCircle2 },
];

export default function WalkerHeader({ walkerName, active }: { walkerName?: string; active?: string }) {
  return (
    <>
      <header className="flex items-center justify-between border-b border-sand px-6 py-4 sm:px-10">
        <div className="flex items-center gap-3">
          <Logo variant="mark" className="h-8 w-8" />
          <div>
            <span className="block font-display text-lg font-semibold text-navy-700">Walker</span>
            {walkerName && <span className="block text-xs text-ink/50">{walkerName}</span>}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <NotificationBell />
          <LogoutButton />
        </div>
      </header>

      {/* Fixed bottom tab bar — walkers are mobile-only, so this is the
          primary way to move between "what's next" and "what's done". */}
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-2 border-t border-sand bg-white pb-[env(safe-area-inset-bottom)]">
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
