import { Inter, Noto_Sans_Devanagari } from "next/font/google";

import type { AppLocale } from "./config";

/**
 * Per-locale font loading via next/font (self-hosted — no runtime requests to
 * Google, no layout shift).
 *
 * - `en` loads only the Latin font (Inter) — Devanagari glyphs would be dead
 *   weight on English pages.
 * - `hi` loads Devanagari (Noto Sans) + Inter: the CSS stack puts Devanagari
 *   first so Hindi text renders natively and Latin digits/brand names fall
 *   back to Inter.
 *
 * Adding a script later (e.g. Tamil): add the matching Noto font here, extend
 * `localeFontClasses`, and add a `html[lang="ta"]` stack in `globals.css`.
 */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const notoDevanagari = Noto_Sans_Devanagari({
  variable: "--font-noto-devanagari",
  subsets: ["devanagari"],
  display: "swap",
});

/** next/font variable classes to apply on <html> per locale. */
const localeFontClasses: Record<AppLocale, string> = {
  en: inter.variable,
  hi: `${inter.variable} ${notoDevanagari.variable}`,
};

const LATIN_FALLBACK = inter.variable;

/**
 * Font variable class names for a locale. Falls back to the Latin stack for
 * unknown codes (defensive; callers normally pass validated locales).
 */
export function getFontClassName(locale: string): string {
  return localeFontClasses[locale as AppLocale] ?? LATIN_FALLBACK;
}
