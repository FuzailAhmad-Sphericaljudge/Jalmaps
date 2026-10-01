import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";

import { AppHeader } from "@/components/layout/app-header";
import { ThemeProvider } from "@/components/theme/theme-context";
import { THEME_SCRIPT } from "@/components/theme/theme-script";
import { isAppLocale, locales } from "@/i18n/config";
import { getFontClassName } from "@/i18n/fonts";
import { THEME_COOKIE_NAME, parseThemeCookieValue } from "@/server/theme";

import "../globals.css";

/**
 * Locale layout: every user-facing page renders under this segment, so the
 * document language, font stack, messages and metadata are correct per locale.
 *
 * `setRequestLocale` enables static rendering per locale — pages under this
 * layout are prerendered for both `/en` and `/hi` at build time.
 */
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: requested } = await params;
  const locale = isAppLocale(requested) ? requested : locales[0];

  const [commonT, homeT] = await Promise.all([
    getTranslations({ locale, namespace: "common" }),
    getTranslations({ locale, namespace: "home" }),
  ]);

  return {
    title: `${commonT("appName")} — ${commonT("tagline")}`,
    description: homeT("description"),
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f9f4" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1318" },
  ],
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: requested } = await params;
  if (!isAppLocale(requested)) {
    notFound();
  }
  const locale = requested;

  // Enable static rendering for this request's locale segment.
  setRequestLocale(locale);

  const [messages, cookieStore] = await Promise.all([getMessages(), cookies()]);
  const themeCookie = cookieStore.get(THEME_COOKIE_NAME)?.value;

  return (
    <html lang={locale} className={getFontClassName(locale)} suppressHydrationWarning>
      <head>
        {/* Applies the stored theme before first paint — prevents a flash. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="flex min-h-full flex-col font-sans">
        <ThemeProvider initialTheme={parseThemeCookieValue(themeCookie)}>
          <NextIntlClientProvider messages={messages}>
            <AppHeader />
            {children}
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
