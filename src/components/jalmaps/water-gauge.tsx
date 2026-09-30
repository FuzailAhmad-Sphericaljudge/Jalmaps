import { cn } from "@/lib/utils";

import { describeArc, polarToCartesian, ratio } from "./gauge-geometry";
import type { WellStatus } from "./status-pill";

const CX = 60;
const CY = 58;
const R = 44;
const START_ANGLE = 180; // left
const END_ANGLE = 360; // right

const STATUS_STROKE: Record<WellStatus, string> = {
  good: "stroke-success",
  warning: "stroke-warning",
  critical: "stroke-danger",
  offline: "stroke-offline",
};

export type WaterGaugeThreshold = {
  /** Threshold value in the same units as `value`. */
  value: number;
  status: WellStatus;
};

/**
 * Semicircular water-level gauge (SVG). The value arc colour reflects the
 * highest threshold reached. Always pair with visible text (StatTile or
 * `aria-valuetext`) — the gauge supplements text, never replaces it.
 */
export function WaterGauge({
  value,
  min,
  max,
  thresholds = [],
  /** Accessible name, e.g. "Water level at Well #4". */
  name,
  /** Full text alternative, e.g. "11.3 metres below ground level". */
  valueText,
  /** Optional centre label (big value). */
  centerLabel,
  unitLabel,
  className,
}: {
  value: number;
  min: number;
  max: number;
  thresholds?: WaterGaugeThreshold[];
  name: string;
  valueText: string;
  centerLabel?: string;
  unitLabel?: string;
  className?: string;
}) {
  const t = ratio(value, min, max);
  const angle = START_ANGLE + t * (END_ANGLE - START_ANGLE);

  const active = [...thresholds]
    .filter((threshold) => value >= threshold.value)
    .sort((a, b) => b.value - a.value)[0];
  const stroke = STATUS_STROKE[active?.status ?? "offline"];

  const needle = polarToCartesian(CX, CY, R - 6, angle);
  const track = describeArc(CX, CY, R, START_ANGLE, END_ANGLE);
  const arc = describeArc(CX, CY, R, START_ANGLE, angle);

  return (
    <svg
      viewBox="0 0 120 72"
      role="img"
      aria-label={`${name}: ${valueText}`}
      className={cn("h-auto w-full max-w-56", className)}
    >
      <path
        d={track}
        fill="none"
        strokeWidth={10}
        strokeLinecap="round"
        className="stroke-border"
      />
      {t > 0 && (
        <path d={arc} fill="none" strokeWidth={10} strokeLinecap="round" className={stroke} />
      )}
      {t > 0 && <circle cx={needle.x} cy={needle.y} r={4} className={cn("fill-current", stroke)} />}
      {centerLabel && (
        <text
          x={CX}
          y={CY - 8}
          textAnchor="middle"
          className="fill-foreground text-2xl font-semibold tabular-nums"
        >
          {centerLabel}
        </text>
      )}
      {unitLabel && (
        <text x={CX} y={CY + 8} textAnchor="middle" className="fill-foreground-muted text-xs">
          {unitLabel}
        </text>
      )}
    </svg>
  );
}
