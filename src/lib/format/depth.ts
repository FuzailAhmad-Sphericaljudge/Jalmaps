/**
 * Unit preference + depth formatting.
 *
 * Ground rules: the database always stores metres. Display converts to feet
 * only when the user's preference says so, and conversion happens at render
 * time — the stored value is never rewritten.
 *
 * - 1 foot = 0.3048 m exactly (international foot).
 * - Display rounds to 1 decimal place for metres (sensor precision) and
 *   either 1 decimal or whole feet for feet (configurable).
 */
import { localeToFormatLocale, type AppLocale } from "@/i18n/config";

export type UnitPreference = "m" | "ft";

export const METRES_PER_FOOT = 0.3048;

/** Parse a stored/preference string into a UnitPreference (defaults to m). */
export function parseUnitPreference(candidate: unknown): UnitPreference {
  return candidate === "ft" ? "ft" : "m";
}

/** Convert metres to feet (display only). */
export function metresToFeet(metres: number): number {
  return metres / METRES_PER_FOOT;
}

/** Convert feet to metres — only ever used for parsing user input. */
export function feetToMetres(feet: number): number {
  return feet * METRES_PER_FOOT;
}

/**
 * Round to `digits` decimals avoiding float artifacts:
 * roundTo(1.05 * 100 / 100 style errors) — e.g. roundTo(2.675, 2) → 2.68
 * ( naïve Math.round(2.675 * 100) / 100 gives 2.67 due to binary floats).
 */
export function roundTo(value: number, digits: number): number {
  const factor = 10 ** digits;
  // Number.EPSILON nudges values sitting exactly on a .5 boundary that binary
  // floats represent as slightly below (e.g. 2.675 → 2.67499999...).
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

/**
 * Format a depth value for display.
 *
 * @param valueInMetres the stored metric value (metres below ground level).
 * @param unit the user's unit preference.
 * @param locale routing locale — supplies number formatting (lakh grouping,
 *   Devanagari digits for hi-IN) and, for feet, the display unit label.
 * @param options `fractionDigits` overrides display precision (metres:
 *   default 1; feet: default 1, or 0 with `wholeFeet`).
 */
export function formatDepth(
  valueInMetres: number,
  unit: UnitPreference,
  locale: AppLocale,
  options?: { fractionDigits?: number },
): string {
  const formatLocale = localeToFormatLocale[locale];

  if (unit === "m") {
    const digits = options?.fractionDigits ?? 1;
    const rounded = roundTo(valueInMetres, digits);
    return new Intl.NumberFormat(formatLocale, {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(rounded);
  }

  const feet = metresToFeet(valueInMetres);
  const digits = options?.fractionDigits ?? 1;
  const rounded = roundTo(feet, digits);
  return new Intl.NumberFormat(formatLocale, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(rounded);
}

/**
 * Format a depth with its unit label, e.g. "11.3 m" / "37.1 ft".
 * The label is intentionally plain and unit-symbol based (m/ft) — it is
 * locale-neutral enough to sit next to numbers in dense UI, while full
 * sentences live in message files.
 */
export function formatDepthWithUnit(
  valueInMetres: number,
  unit: UnitPreference,
  locale: AppLocale,
  options?: { fractionDigits?: number },
): string {
  const value = formatDepth(valueInMetres, unit, locale, options);
  return unit === "m" ? `${value} m` : `${value} ft`;
}
