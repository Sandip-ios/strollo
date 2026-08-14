import { Umbrella } from "lucide-react";
import CancelWalkButton from "@/components/booking/CancelWalkButton";
import { canCancelWalk, CANCELLATION_LEAD_HOURS } from "@/lib/constants";

type UpcomingWalk = { id: string; scheduledDate: Date };

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}

export default function SkipWalkDayCard({
  bookingId,
  slot,
  upcomingWalks,
  cancelledCount,
}: {
  bookingId: string;
  slot: string;
  upcomingWalks: UpcomingWalk[];
  cancelledCount: number;
}) {
  const nextFew = upcomingWalks.slice(0, 3);

  return (
    <div className="rounded-xl border border-sand bg-white p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100">
          <Umbrella className="h-4 w-4 text-blue-600" strokeWidth={2} />
        </span>
        <div>
          <p className="text-sm font-semibold text-ink">Need to take a break?</p>
          <p className="text-xs text-ink/50">
            Skip a walk day up to {CANCELLATION_LEAD_HOURS}h before it starts — it's credited
            toward your next plan.
          </p>
        </div>
      </div>

      {nextFew.length > 0 ? (
        <ul className="mt-4 divide-y divide-sand/60">
          {nextFew.map((w) => {
            const cancellable = canCancelWalk(w.scheduledDate, slot);
            return (
              <li key={w.id} className="flex items-center justify-between py-2 text-sm">
                <span className="text-ink/70">{formatDate(w.scheduledDate)}</span>
                {cancellable ? (
                  <CancelWalkButton bookingId={bookingId} walkId={w.id} dateLabel={formatDate(w.scheduledDate)} />
                ) : (
                  <span className="text-xs text-ink/30">Too close to cancel</span>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-4 text-xs text-ink/40">No upcoming walks to manage right now.</p>
      )}

      <div className="mt-4 flex items-center gap-2 rounded-lg bg-sand/30 px-3 py-2.5 text-xs text-ink/60">
        {cancelledCount > 0
          ? `${cancelledCount} day${cancelledCount === 1 ? "" : "s"} skipped — credited to your next plan.`
          : "No upcoming skipped days."}
      </div>
    </div>
  );
}
