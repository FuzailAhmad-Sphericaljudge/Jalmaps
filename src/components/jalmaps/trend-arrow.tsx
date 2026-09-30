import { ArrowDownRight, ArrowRight, ArrowUpRight, Minus, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type TrendDirection = "rising" | "falling" | "steady";

const TREND_CONFIG: Record<TrendDirection, { icon: LucideIcon; classes: string }> = {
  rising: { icon: ArrowUpRight, classes: "text-success" },
  falling: { icon: ArrowDownRight, classes: "text-warning" },
  steady: { icon: ArrowRight, classes: "text-offline" },
};

/** Trend of the water level relative to a previous period. */
export function TrendArrow({
  direction,
  /** e.g. "+0.4 m vs last week" — wording owned by the caller (i18n-ready). */
  label,
  /** Optional numeric delta in metres; rendered with the arrow when provided. */
  delta,
  formatDelta,
  className,
}: {
  direction: TrendDirection;
  label: string;
  delta?: number;
  /** Formats a delta in metres for display; defaults to fixed 2 + " m". */
  formatDelta?: (metres: number) => string;
  className?: string;
}) {
  const config = TREND_CONFIG[direction];
  const Icon = config.icon;
  const defaultFormat = (metres: number) => `${metres > 0 ? "+" : ""}${metres.toFixed(2)} m`;

  return (
    <span
      data-direction={direction}
      title={label}
      className={cn(
        "inline-flex items-center gap-1 text-sm font-medium",
        config.classes,
        className,
      )}
    >
      <Icon aria-hidden className="size-4 shrink-0" />
      <span>{delta !== undefined ? defaultFormat(delta) : label}</span>
    </span>
  );
}

export { Minus as TrendMinusIcon };
