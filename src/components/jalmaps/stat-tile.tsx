import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { StatusPill, type WellStatus } from "./status-pill";
import { TrendArrow, type TrendDirection } from "./trend-arrow";

/**
 * Stat tile: label, big value, unit, optional trend and status.
 * Value/unit text comes from props; store metres, format for display here.
 */
export function StatTile({
  label,
  value,
  unit,
  trend,
  trendLabel,
  status,
  statusLabel,
  className,
}: {
  label: string;
  /** Formatted value string, e.g. "11.3" (unit handled separately). */
  value: string;
  /** Unit label, e.g. "m bgl" or "ft". */
  unit?: string;
  trend?: TrendDirection;
  trendLabel?: string;
  status?: WellStatus;
  statusLabel?: string;
  className?: string;
}) {
  return (
    <Card className={cn("w-full", className)}>
      <CardContent className="flex flex-col gap-2 p-4">
        <span className="text-sm font-medium text-foreground-muted">{label}</span>
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl font-semibold tracking-tight tabular-nums">{value}</span>
          {unit && <span className="text-sm text-foreground-muted">{unit}</span>}
        </div>
        {(trend || status) && (
          <div className="mt-1 flex flex-wrap items-center gap-2">
            {trend && trendLabel !== undefined && (
              <TrendArrow direction={trend} label={trendLabel} />
            )}
            {status && statusLabel !== undefined && (
              <StatusPill status={status} label={statusLabel} />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
