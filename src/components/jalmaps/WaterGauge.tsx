export function WaterGauge({ level, max }: { level: number; max: number }) {
  const percent = Math.min(100, Math.max(0, (level / max) * 100));
  return (
    <div
      className="relative h-4 w-full overflow-hidden rounded-full bg-slate-200"
      role="meter"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={level}
      aria-label="Water level"
    >
      <div
        className="absolute top-0 left-0 h-full bg-blue-500 transition-all duration-500"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
