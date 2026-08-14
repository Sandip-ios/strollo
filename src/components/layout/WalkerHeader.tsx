import Logo from "@/components/brand/Logo";
import LogoutButton from "@/components/LogoutButton";
import NotificationBell from "@/components/notifications/NotificationBell";

export default function WalkerHeader({ walkerName }: { walkerName?: string }) {
  return (
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
  );
}
