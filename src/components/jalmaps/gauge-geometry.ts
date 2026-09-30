/**
 * Geometry helpers for the semicircular WaterGauge SVG.
 * Exported for unit testing and reuse.
 */

export type Point = { x: number; y: number };

/** Clamp a value into [min, max]. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Normalise a value into a 0..1 ratio across [min, max] (clamped). */
export function ratio(value: number, min: number, max: number): number {
  if (max === min) return 0;
  return clamp((value - min) / (max - min), 0, 1);
}

/** Point on a circle centred at (cx, cy). Angle in degrees, 0 = 3 o'clock. */
export function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number): Point {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

/**
 * SVG arc path from startAngleDeg to endAngleDeg (degrees, 0 = 3 o'clock,
 * increasing clockwise because SVG y grows downward).
 */
export function describeArc(
  cx: number,
  cy: number,
  r: number,
  startAngleDeg: number,
  endAngleDeg: number,
): string {
  const start = polarToCartesian(cx, cy, r, startAngleDeg);
  const end = polarToCartesian(cx, cy, r, endAngleDeg);
  const largeArc = endAngleDeg - startAngleDeg > 180 ? 1 : 0;
  return ["M", start.x, start.y, "A", r, r, 0, largeArc, 1, end.x, end.y].join(" ");
}
