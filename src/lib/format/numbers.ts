/**
 * Number formatting for Indian conventions.
 *
 * India groups digits in lakhs (1,00,000) and crores (1,00,00,000) rather
 * than thousands — `Intl.NumberFormat` with the `en-IN`/`hi-IN` locales
 * produces exactly this. All helpers here are thin, testable wrappers so the
 * rest of the app never touches `Intl` options directly.
 *
 * The formatting locale comes from `localeToFormatLocale` in
 * `src/i18n/config.ts` (URL prefix `hi` formats as `hi-IN`).
 */
import { defaultTimeZone, localeToFormatLocale, type AppLocale } from "@/i18n/config";

/**
 * Format a number with locale grouping — Indian lakh/crore grouping for
 * en-IN ("1,23,45,678") and Devanagari digits possible for hi-IN.
 */
export function formatNumber(value: number, locale: AppLocale, options?: Intl.NumberFormatOptions) {
  return new Intl.NumberFormat(localeToFormatLocale[locale], options).format(value);
}

/**
 * Compact Indian numbering: lakh/crore words instead of k/m.
 * `1234567` → "12.3 लाख" / "12.3 L"; used for counts that can get large
 * (sensor readings totals, users in reports). Plain numbers below 1,000
 * (or below 1,00,000 when compact is requested but small) format normally.
 */
export function formatCompactNumber(value: number, locale: AppLocale): string {
  const formatLocale = localeToFormatLocale[locale];
  return new Intl.NumberFormat(formatLocale, {
    notation: "compact",
    compactDisplay: "long",
  }).format(value);
}

/**
 * Format a decimal measurement with a fixed number of fraction digits
 * (Indian digit grouping applies to the integer part).
 */
export function formatDecimal(value: number, locale: AppLocale, fractionDigits = 1): string {
  return formatNumber(value, locale, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

/**
 * Format a percentage (0–1 fraction or 0–100 number via `alreadyPercent`).
 */
export function formatPercent(fraction: number, locale: AppLocale, fractionDigits = 0): string {
  return formatNumber(fraction, locale, {
    style: "percent",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

/** Format a signed delta with an explicit plus sign for positive values. */
export function formatSignedNumber(value: number, locale: AppLocale, fractionDigits = 2): string {
  const sign = value > 0 ? "+" : "";
  const body = formatDecimal(value, locale, fractionDigits);
  return `${sign}${body}`;
}

/**
 * Format an ISO date-time string or Date as a locale date.
 * Timezone defaults to Asia/Kolkata — JalMaps data is India-anchored and
 * farmers should never see UTC times.
 */
export function formatDate(
  date: Date | string | number,
  locale: AppLocale,
  options: Intl.DateTimeFormatOptions = { dateStyle: "medium" },
): string {
  return new Intl.DateTimeFormat(localeToFormatLocale[locale], {
    timeZone: defaultTimeZone,
    ...options,
  }).format(new Date(date));
}

/**
 * Format a time of day (e.g. "2:30 pm"). Asia/Kolkata by default.
 */
export function formatTime(
  date: Date | string | number,
  locale: AppLocale,
  options: Intl.DateTimeFormatOptions = { timeStyle: "short" },
): string {
  return formatDate(date, locale, options);
}

/**
 * Relative time ("3 hours ago", "in 2 days") via Intl.RelativeTimeFormat.
 * Picks the largest unit that yields a value of magnitude ≥ 1 (or the fallback
 * unit for very fresh timestamps). Input is an absolute timestamp.
 */
const RELATIVE_UNITS: Array<{ unit: Intl.RelativeTimeFormatUnit; ms: number }> = [
  { unit: "year", ms: 365.25 * 24 * 60 * 60 * 1000 },
  { unit: "month", ms: 30.44 * 24 * 60 * 60 * 1000 },
  { unit: "week", ms: 7 * 24 * 60 * 60 * 1000 },
  { unit: "day", ms: 24 * 60 * 60 * 1000 },
  { unit: "hour", ms: 60 * 60 * 1000 },
  { unit: "minute", ms: 60 * 1000 },
];

export function formatRelativeTime(
  date: Date | string | number,
  locale: AppLocale,
  now: Date = new Date(),
): string {
  const target = new Date(date).getTime();
  const base = now.getTime();
  const diff = target - base; // positive = future ("in 2 days")

  const formatter = new Intl.RelativeTimeFormat(localeToFormatLocale[locale], {
    numeric: "auto",
  });

  for (const { unit, ms } of RELATIVE_UNITS) {
    if (Math.abs(diff) >= ms) {
      return formatter.format(Math.round(diff / ms), unit);
    }
  }
  return formatter.format(Math.round(diff / 1000), "second");
}
