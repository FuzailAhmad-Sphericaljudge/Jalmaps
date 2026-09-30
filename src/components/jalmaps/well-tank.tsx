"use client";

import { useId } from "react";

import { cn } from "@/lib/utils";

import { clamp, ratio } from "./gauge-geometry";
import type { WellStatus } from "./status-pill";

const W = 120;
const H = 160;
const WALL = 10;
const INNER_X = WALL;
const INNER_Y = 24; /* leave room for the ground line/coping */
const INNER_W = W - WALL * 2;
const INNER_H = H - INNER_Y - WALL;

const STATUS_FILL: Record<WellStatus, string> = {
  good: "fill-success/70",
  warning: "fill-warning/70",
  critical: "fill-danger/70",
  offline: "fill-offline/50",
};

/**
 * Well/tank illustration with a water level. The gentle wave animation is
 * disabled under `prefers-reduced-motion` (see globals.css), leaving a fully
 * readable static image. Text alternatives are mandatory props.
 */
export function WellTank({
  fillRatio,
  status,
  /** Accessible name, e.g. "Well #4". */
  name,
  /** Full text alternative, e.g. "Water level 11.3 metres below ground level". */
  valueText,
  className,
}: {
  /** 0..1 fraction of the well that is water. Clamped. */
  fillRatio: number;
  status: WellStatus;
  name: string;
  valueText: string;
  className?: string;
}) {
  const t = clamp(fillRatio, 0, 1);
  const waveId = useId().replace(/[^a-zA-Z0-9]/g, "");

  const waterTop = INNER_Y + INNER_H * (1 - t);
  const waterH = INNER_H * t;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`${name}: ${valueText}`}
      className={cn("h-auto w-full max-w-40", className)}
    >
      <defs>
        {/* Vertical bob of the surface — cheap, no layout cost. */}
        <animate
          xlinkHref={`#wave-${waveId}`}
          attributeName="transform"
          type="translate"
          values={`0 0; 0 -1.5; 0 0`}
          dur="3s"
          repeatCount="indefinite"
        />
      </defs>

      {/* Casing walls */}
      <rect x={0} y={0} width={WALL} height={H} className="fill-stone-400 dark:fill-stone-600" />
      <rect
        x={W - WALL}
        y={0}
        width={WALL}
        height={H}
        className="fill-stone-400 dark:fill-stone-600"
      />
      <rect
        x={0}
        y={H - WALL}
        width={W}
        height={WALL}
        className="fill-stone-400 dark:fill-stone-600"
      />

      {/* Bore interior background */}
      <rect
        x={INNER_X}
        y={INNER_Y}
        width={INNER_W}
        height={INNER_H}
        className="fill-surface-muted"
      />

      {/* Water column */}
      {waterH > 0.5 && (
        <g>
          <rect
            id={`wave-${waveId}`}
            x={INNER_X}
            y={waterTop}
            width={INNER_W}
            height={waterH}
            className={STATUS_FILL[status]}
          />
          <rect
            x={INNER_X}
            y={waterTop}
            width={INNER_W}
            height={2}
            className={cn("fill-current", STATUS_FILL[status], "opacity-90")}
          />
        </g>
      )}

      {/* Ground/coping line */}
      <rect x={0} y={14} width={W} height={4} className="fill-stone-500 dark:fill-stone-400" />
      <text x={WALL + 2} y={11} className="fill-foreground-muted text-[7px]">
        ⌂
      </text>
    </svg>
  );
}
