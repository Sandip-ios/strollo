type Row = { label: string; value: number; displayValue?: string };

export default function ReportBarList({ rows, emptyText }: { rows: Row[]; emptyText: string }) {
  if (rows.length === 0) {
    return <p className="text-sm text-ink/50">{emptyText}</p>;
  }

  const max = Math.max(...rows.map((r) => r.value), 1);

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.label}>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="text-ink/70">{row.label}</span>
            <span className="font-mono font-medium text-ink">
              {row.displayValue ?? row.value.toLocaleString("en-IN")}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-sand/40">
            <div
              className="h-full rounded-full bg-navy-500"
              style={{ width: `${Math.max(4, (row.value / max) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
