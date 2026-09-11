import Image from "next/image";
import { PlayCircle, CheckCircle2 } from "lucide-react";
import { walkEventMeta } from "@/lib/walk-events";

export type TimelineEvent = {
  id: string;
  type: string;
  note: string | null;
  photoUrl: string | null;
  occurredAt: string | Date;
};

type Props = {
  startTime: string | Date | null;
  endTime: string | Date | null;
  events: TimelineEvent[];
};

function timeLabel(d: string | Date) {
  return new Date(d).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });
}

export default function WalkTimeline({ startTime, endTime, events }: Props) {
  const sorted = [...events].sort(
    (a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime()
  );

  const rows: {
    key: string;
    time: string | Date;
    label: string;
    note?: string | null;
    photoUrl?: string | null;
    icon: typeof PlayCircle;
    iconClass: string;
    dotClass: string;
  }[] = [];

  if (startTime) {
    rows.push({
      key: "start",
      time: startTime,
      label: "Walk started",
      note: "Walk has been started",
      icon: PlayCircle,
      iconClass: "text-emerald-600",
      dotClass: "bg-emerald-500",
    });
  }
  for (const e of sorted) {
    const meta = walkEventMeta(e.type);
    rows.push({
      key: e.id,
      time: e.occurredAt,
      label: meta.label,
      note: e.note,
      photoUrl: e.photoUrl,
      icon: meta.icon,
      iconClass: meta.iconClass,
      dotClass: meta.dotClass,
    });
  }
  if (endTime) {
    rows.push({
      key: "end",
      time: endTime,
      label: "Walk completed",
      note: "Walk has been completed",
      icon: CheckCircle2,
      iconClass: "text-navy-600",
      dotClass: "bg-navy-600",
    });
  }

  if (rows.length === 0) {
    return <p className="py-6 text-center text-sm text-ink/50">No timeline yet.</p>;
  }

  return (
    <ol className="space-y-0">
      {rows.map((row, i) => (
        <li key={row.key} className="relative flex gap-3 pb-5 last:pb-0">
          {i < rows.length - 1 && (
            <span className="absolute left-[9px] top-5 h-full w-px bg-sand" aria-hidden="true" />
          )}
          <span className={`relative z-10 mt-1 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full ${row.dotClass}`}>
            <span className="h-1.5 w-1.5 rounded-full bg-white" />
          </span>
          <div className="min-w-0 flex-1 pt-0.5">
            <div className="flex items-center gap-2">
              <p className="text-xs font-medium text-ink/40">{timeLabel(row.time)}</p>
            </div>
            <p className="flex items-center gap-1.5 text-sm font-semibold text-ink">
              <row.icon className={`h-3.5 w-3.5 ${row.iconClass}`} strokeWidth={2} />
              {row.label}
            </p>
            {row.note && <p className="mt-0.5 text-xs text-ink/50">{row.note}</p>}
            {row.photoUrl && (
              <a
                href={row.photoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="relative mt-2 block h-16 w-16 overflow-hidden rounded-lg border border-sand"
              >
                <Image src={row.photoUrl} alt={row.label} fill className="object-cover" />
              </a>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
