"use client";

import { useState } from "react";
import { notificationIcon, formatRelativeTime } from "./notification-icons";

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

export default function NotificationRow({ notification }: { notification: Notification }) {
  const [isRead, setIsRead] = useState(notification.isRead);
  const Icon = notificationIcon(notification.type);

  async function markRead() {
    if (isRead) return;
    setIsRead(true);
    await fetch(`/api/notifications/${notification.id}`, { method: "PATCH" });
  }

  return (
    <li>
      <button
        onClick={markRead}
        className={`flex w-full items-start gap-3 px-5 py-4 text-left transition hover:bg-sand/20 ${
          isRead ? "" : "bg-sky-50/60"
        }`}
      >
        <Icon className="mt-0.5 h-5 w-5 shrink-0 text-navy-500" strokeWidth={1.75} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink">{notification.title}</p>
          <p className="mt-0.5 text-sm text-ink/60">{notification.message}</p>
          <p className="mt-1 text-xs text-ink/40">{formatRelativeTime(notification.createdAt)}</p>
        </div>
        {!isRead && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-navy-500" />}
      </button>
    </li>
  );
}
