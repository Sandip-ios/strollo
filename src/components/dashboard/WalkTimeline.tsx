import { Check } from "lucide-react";

type Step = {
  label: string;
  detail: string;
  done: boolean;
  active: boolean;
  time: string | null;
};

export function buildTimelineSteps(params: {
  walkerAssigned: boolean;
  status: string;
  startTime: Date | null;
  endTime: Date | null;
}): Step[] {
  const { walkerAssigned, status, startTime, endTime } = params;
  const fmt = (d: Date | null) =>
    d ? d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" }) : null;

  return [
    {
      label: "Walker assigned",
      detail: walkerAssigned ? "Your walker is on the way" : "Waiting for admin to assign a walker",
      done: walkerAssigned,
      active: false,
      time: null,
    },
    {
      label: "Walk started",
      detail: startTime ? "Live tracking is active" : "Not started yet",
      done: Boolean(startTime),
      active: status === "ON_GOING" && !startTime,
      time: fmt(startTime),
    },
    {
      label: "Walking",
      detail: status === "ON_GOING" ? "Your dog is enjoying the walk" : "Pending",
      done: status === "COMPLETED",
      active: status === "ON_GOING",
      time: null,
    },
    {
      label: "Walk completed",
      detail: endTime ? "Photos & report are ready" : "You'll get photos & a report",
      done: Boolean(endTime),
      active: false,
      time: fmt(endTime),
    },
  ];
}

export default function WalkTimeline({ steps }: { steps: Step[] }) {
  return (
    <ol className="space-y-0">
      {steps.map((step, i) => (
        <li key={step.label} className="flex gap-3">
          <div className="flex flex-col items-center">
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                step.done
                  ? "bg-emerald-500 text-white"
                  : step.active
                    ? "bg-blue-600 text-white"
                    : "bg-sand text-ink/30"
              }`}
            >
              {step.done ? (
                <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
              ) : (
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
              )}
            </span>
            {i < steps.length - 1 && (
              <span className={`w-px flex-1 ${step.done ? "bg-emerald-400" : "bg-sand"}`} style={{ minHeight: "28px" }} />
            )}
          </div>
          <div className="pb-6">
            <div className="flex items-center gap-2">
              <p className={`text-sm font-semibold ${step.done || step.active ? "text-ink" : "text-ink/40"}`}>
                {step.label}
              </p>
              {step.time && <span className="text-xs text-ink/40">{step.time}</span>}
            </div>
            <p className="text-xs text-ink/50">{step.detail}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
