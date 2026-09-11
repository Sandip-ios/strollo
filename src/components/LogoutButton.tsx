"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { startNavProgress } from "@/lib/nav-progress";

export default function LogoutButton({ iconOnly }: { iconOnly?: boolean } = {}) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    startNavProgress();
    router.push("/login");
    router.refresh();
  }

  if (iconOnly) {
    return (
      <button
        onClick={handleLogout}
        aria-label="Logout"
        className="rounded-lg border border-sand p-2 text-ink/70 transition hover:bg-sand/30"
      >
        <LogOut className="h-4 w-4" strokeWidth={1.75} />
      </button>
    );
  }

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-1.5 rounded-lg border border-sand px-4 py-2 text-sm font-medium text-ink/70 transition hover:bg-sand/30"
    >
      Logout
      <LogOut className="h-3.5 w-3.5" strokeWidth={1.75} />
    </button>
  );
}
