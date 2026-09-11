import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AppHeader from "@/components/layout/AppHeader";
import AdminHeader from "@/components/layout/AdminHeader";
import WalkerHeader from "@/components/layout/WalkerHeader";
import NotificationRow from "@/components/notifications/NotificationRow";
import MarkAllReadButton from "@/components/notifications/MarkAllReadButton";

export default async function NotificationsPage() {
  const session = getSession();
  if (!session) redirect("/login");

  const notifications = await prisma.notification.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
  });
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const walker =
    session.role === "WALKER"
      ? await prisma.walker.findFirst({ where: { userId: session.userId, deletedAt: null } })
      : null;

  return (
    <main className="min-h-screen bg-paper pb-28 sm:pb-0">
      {session.role === "ADMIN" ? (
        <AdminHeader />
      ) : session.role === "WALKER" ? (
        <WalkerHeader walkerName={walker?.name} />
      ) : (
        <AppHeader />
      )}
      <div className="mx-auto max-w-2xl px-6 py-10 sm:px-10">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="font-display text-2xl font-semibold text-ink">Notifications</h1>
          <MarkAllReadButton disabled={unreadCount === 0} />
        </div>

        <div className="overflow-hidden rounded-xl border border-sand bg-white">
          {notifications.length === 0 ? (
            <p className="p-6 text-sm text-ink/50">No notifications yet.</p>
          ) : (
            <ul className="divide-y divide-sand">
              {notifications.map((n) => (
                <NotificationRow
                  key={n.id}
                  notification={{
                    id: n.id,
                    type: n.type,
                    title: n.title,
                    message: n.message,
                    link: n.link,
                    isRead: n.isRead,
                    createdAt: n.createdAt.toISOString(),
                  }}
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}
