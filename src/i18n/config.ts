export const locales = ["en", "hi", "pa", "mr", "gu", "bn", "ta", "te", "kn", "ml", "or"] as const;

export type AppLocale = (typeof locales)[number];

export const defaultLocale: AppLocale = "en";

export interface LocaleMetadata {
  code: AppLocale;
  nativeName: string;
  script: string;
  intlLocale: string;
  fontFamily: string;
  defaultStates: string[];
}

export const localeMetadata: Record<AppLocale, LocaleMetadata> = {
  en: {
    code: "en",
    nativeName: "English",
    script: "Latn",
    intlLocale: "en-IN",
    fontFamily: "var(--font-inter)",
    defaultStates: [],
  },
  hi: {
    code: "hi",
    nativeName: "हिन्दी",
    script: "Deva",
    intlLocale: "hi-IN",
    fontFamily: "var(--font-noto-devanagari)",
    defaultStates: ["DL", "UP", "HR", "BR", "MP", "RJ", "CG", "JH", "UK", "HP"],
  },
  pa: {
    code: "pa",
    nativeName: "ਪੰਜਾਬੀ",
    script: "Guru",
    intlLocale: "pa-IN",
    fontFamily: "var(--font-noto-gurmukhi)",
    defaultStates: ["PB", "CH"],
  },
  mr: {
    code: "mr",
    nativeName: "मराठी",
    script: "Deva",
    intlLocale: "mr-IN",
    fontFamily: "var(--font-noto-devanagari)",
    defaultStates: ["MH", "GA"],
  },
  gu: {
    code: "gu",
    nativeName: "ગુજરાતી",
    script: "Gujr",
    intlLocale: "gu-IN",
    fontFamily: "var(--font-noto-gujarati)",
    defaultStates: ["GJ", "DD", "DN"],
  },
  bn: {
    code: "bn",
    nativeName: "বাংলা",
    script: "Beng",
    intlLocale: "bn-IN",
    fontFamily: "var(--font-noto-bengali)",
    defaultStates: ["WB", "TR"],
  },
  ta: {
    code: "ta",
    nativeName: "தமிழ்",
    script: "Taml",
    intlLocale: "ta-IN",
    fontFamily: "var(--font-noto-tamil)",
    defaultStates: ["TN", "PY"],
  },
  te: {
    code: "te",
    nativeName: "తెలుగు",
    script: "Telu",
    intlLocale: "te-IN",
    fontFamily: "var(--font-noto-telugu)",
    defaultStates: ["AP", "TG"],
  },
  kn: {
    code: "kn",
    nativeName: "ಕನ್ನಡ",
    script: "Knda",
    intlLocale: "kn-IN",
    fontFamily: "var(--font-noto-kannada)",
    defaultStates: ["KA"],
  },
  ml: {
    code: "ml",
    nativeName: "മലയാളം",
    script: "Mlym",
    intlLocale: "ml-IN",
    fontFamily: "var(--font-noto-malayalam)",
    defaultStates: ["KL", "LD"],
  },
  or: {
    code: "or",
    nativeName: "ଓଡ଼ିଆ",
    script: "Orya",
    intlLocale: "or-IN",
    fontFamily: "var(--font-noto-oriya)",
    defaultStates: ["OR"],
  },
};

export const localeToFormatLocale: Record<AppLocale, string> = {
  en: "en-IN",
  hi: "hi-IN",
  pa: "pa-IN",
  mr: "mr-IN",
  gu: "gu-IN",
  bn: "bn-IN",
  ta: "ta-IN",
  te: "te-IN",
  kn: "kn-IN",
  ml: "ml-IN",
  or: "or-IN",
};

export const localeNativeNames: Record<AppLocale, string> = {
  en: "English",
  hi: "हिन्दी",
  pa: "ਪੰਜਾਬੀ",
  mr: "मराठी",
  gu: "ગુજરાતી",
  bn: "বাংলা",
  ta: "தமிழ்",
  te: "తెలుగు",
  kn: "ಕನ್ನಡ",
  ml: "മലയാളം",
  or: "ଓଡ଼ିଆ",
};

export const defaultTimeZone = "Asia/Kolkata";

export function isAppLocale(candidate: unknown): candidate is AppLocale {
  return locales.includes(candidate as AppLocale);
}
