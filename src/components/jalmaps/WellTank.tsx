export function WellTank({ fillPercent }: { fillPercent: number }) {
  const percent = Math.min(100, Math.max(0, fillPercent));
  return (
    <div
      className="relative flex h-48 w-24 items-end overflow-hidden rounded-b-xl border-4 border-slate-300 bg-slate-50"
      role="meter"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      aria-label="Well fill percentage"
    >
      <div
        className="relative w-full bg-blue-400 transition-all duration-1000 ease-out"
        style={{ height: `${percent}%` }}
      >
        <div className="absolute -top-1 right-0 left-0 h-2 rounded-full bg-blue-300 opacity-50" />
      </div>
    </div>
  );
}
