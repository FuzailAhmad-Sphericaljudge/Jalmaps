export function WellTank({ fillPercent }: { fillPercent: number }) {
  const percent = Math.min(100, Math.max(0, fillPercent));
  return (
    <div 
      className="relative w-24 h-48 border-4 border-slate-300 rounded-b-xl overflow-hidden bg-slate-50 flex items-end"
      role="meter"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      aria-label="Well fill percentage"
    >
      <div 
        className="w-full bg-blue-400 transition-all duration-1000 ease-out relative"
        style={{ height: `${percent}%` }}
      >
        <div className="absolute -top-1 left-0 right-0 h-2 bg-blue-300 rounded-full opacity-50" />
      </div>
    </div>
  );
}
