import { Inter, Noto_Sans_Devanagari } from "next/font/google";

/**
 * Base Latin font + Noto Sans Devanagari fallback for Hindi.
 * next/font self-hosts both — no runtime requests to Google.
 *
 * More scripts land in Phase 3 (real i18n): add the matching Noto font here
 * and switch on locale inside getFontClassName.
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

/** Font variable class names for a locale. Defaults to the base stack. */
export function getFontClassName(_locale: string = "en"): string {
  void _locale; // per-locale stacks arrive with real i18n (Phase 3)
  return `${inter.variable} ${notoDevanagari.variable}`;
}
