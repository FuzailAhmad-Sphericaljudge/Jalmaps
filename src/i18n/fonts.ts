import {
  Inter,
  Noto_Sans_Devanagari,
  Noto_Sans_Gurmukhi,
  Noto_Sans_Gujarati,
  Noto_Sans_Bengali,
  Noto_Sans_Tamil,
  Noto_Sans_Telugu,
  Noto_Sans_Kannada,
  Noto_Sans_Malayalam,
  Noto_Sans_Oriya,
} from "next/font/google";

import type { AppLocale } from "./config";

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

const notoGurmukhi = Noto_Sans_Gurmukhi({
  variable: "--font-noto-gurmukhi",
  subsets: ["gurmukhi"],
  display: "swap",
});

const notoGujarati = Noto_Sans_Gujarati({
  variable: "--font-noto-gujarati",
  subsets: ["gujarati"],
  display: "swap",
});

const notoBengali = Noto_Sans_Bengali({
  variable: "--font-noto-bengali",
  subsets: ["bengali"],
  display: "swap",
});

const notoTamil = Noto_Sans_Tamil({
  variable: "--font-noto-tamil",
  subsets: ["tamil"],
  display: "swap",
});

const notoTelugu = Noto_Sans_Telugu({
  variable: "--font-noto-telugu",
  subsets: ["telugu"],
  display: "swap",
});

const notoKannada = Noto_Sans_Kannada({
  variable: "--font-noto-kannada",
  subsets: ["kannada"],
  display: "swap",
});

const notoMalayalam = Noto_Sans_Malayalam({
  variable: "--font-noto-malayalam",
  subsets: ["malayalam"],
  display: "swap",
});

const notoOriya = Noto_Sans_Oriya({
  variable: "--font-noto-oriya",
  subsets: ["oriya"],
  display: "swap",
});

/** next/font variable classes to apply on <html> per locale. */
const localeFontClasses: Record<AppLocale, string> = {
  en: inter.variable,
  hi: `${inter.variable} ${notoDevanagari.variable}`,
  pa: `${inter.variable} ${notoGurmukhi.variable}`,
  mr: `${inter.variable} ${notoDevanagari.variable}`,
  gu: `${inter.variable} ${notoGujarati.variable}`,
  bn: `${inter.variable} ${notoBengali.variable}`,
  ta: `${inter.variable} ${notoTamil.variable}`,
  te: `${inter.variable} ${notoTelugu.variable}`,
  kn: `${inter.variable} ${notoKannada.variable}`,
  ml: `${inter.variable} ${notoMalayalam.variable}`,
  or: `${inter.variable} ${notoOriya.variable}`,
};

const LATIN_FALLBACK = inter.variable;

export function getFontClassName(locale: string): string {
  return localeFontClasses[locale as AppLocale] ?? LATIN_FALLBACK;
}
