import {
  CalendarCheck,
  BadgeCheck,
  XCircle,
  CreditCard,
  UserCheck,
  PlayCircle,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Bell,
  type LucideIcon,
} from "lucide-react";

export const NOTIFICATION_ICONS: Record<string, LucideIcon> = {
  BOOKING_CONFIRMED: CalendarCheck,
  BOOKING_APPROVED: BadgeCheck,
  BOOKING_REJECTED: XCircle,
  BOOKING_CANCELLED: XCircle,
  PAYMENT_SUCCESSFUL: CreditCard,
  WALKER_ASSIGNED: UserCheck,
  WALK_STARTED: PlayCircle,
  WALK_REACHED: MapPin,
  WALK_COMPLETED: CheckCircle2,
  PLAN_EXPIRY_REMINDER: AlertCircle,
  GENERAL: Bell,
};

export function notificationIcon(type: string): LucideIcon {
  return NOTIFICATION_ICONS[type] ?? Bell;
}

export function formatRelativeTime(date: Date | string): string {
  const d = new Date(date);
  const diffMs = Date.now() - d.getTime();
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}
