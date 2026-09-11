"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { notificationIcon, formatRelativeTime } from "./notification-icons";
import { startNavProgress } from "@/lib/nav-progress";

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
};

export default function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  async function load() {
    const res = await fetch("/api/notifications");
    if (!res.ok) return;
    const data = await res.json();
    setNotifications(data.notifications ?? []);
    setUnreadCount(data.unreadCount ?? 0);
    setLoaded(true);
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  function handleClick(n: Notification) {
    if (!n.isRead) markRead(n.id);
    if (n.link) {
      setOpen(false);
      startNavProgress();
      router.push(n.link);
    }
  }

  async function markRead(id: string) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    setUnreadCount((prev) => Math.max(0, prev - 1));
    await fetch(`/api/notifications/${id}`, { method: "PATCH" });
  }

  async function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    await fetch("/api/notifications/mark-all-read", { method: "POST" });
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => {
          setOpen((v) => !v);
          if (!loaded) load();
        }}
        aria-label="Notifications"
        className="relative rounded-lg border border-sand p-2 text-ink/60 transition hover:bg-sand/30"
      >
        <Bell className="h-4 w-4" strokeWidth={1.75} />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-xl border border-sand bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-sand px-4 py-3">
            <p className="text-sm font-semibold text-ink">Notifications</p>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs font-medium text-navy-600">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="p-4 text-sm text-ink/50">No notifications yet.</p>
            ) : (
              <ul className="divide-y divide-sand">
                {notifications.slice(0, 8).map((n) => {
                  const Icon = notificationIcon(n.type);
                  return (
                    <li key={n.id}>
                      <button
                        onClick={() => handleClick(n)}
                        className={`flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-sand/20 ${
                          n.isRead ? "" : "bg-sky-50/60"
                        }`}
                      >
                        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-navy-500" strokeWidth={1.75} />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-ink">{n.title}</p>
                          <p className="mt-0.5 text-xs text-ink/60">{n.message}</p>
                          <p className="mt-1 text-[11px] text-ink/40">{formatRelativeTime(n.createdAt)}</p>
                        </div>
                        {!n.isRead && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-navy-500" />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <Link
            href="/notifications"
            onClick={() => setOpen(false)}
            className="block border-t border-sand px-4 py-2.5 text-center text-xs font-medium text-navy-600 hover:bg-sand/20"
          >
            View all
          </Link>
        </div>
      )}
    </div>
  );
}
