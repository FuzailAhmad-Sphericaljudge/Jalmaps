import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";

import { ThemeProvider } from "@/components/theme/theme-context";
import { THEME_SCRIPT } from "@/components/theme/theme-script";
import { getFontClassName } from "@/i18n/fonts";
import { THEME_COOKIE_NAME, parseThemeCookieValue } from "@/server/theme";

import "./globals.css";

export const metadata: Metadata = {
  title: "JalMaps — Groundwater monitoring for India",
  description:
    "Live water levels, alerts and forecasts for wells and borewells, for farmers, villages and insurers.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f9f4" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1318" },
  ],
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const cookieStore = await cookies();
  const themeCookie = cookieStore.get(THEME_COOKIE_NAME)?.value;

  return (
    <html lang="en" className={getFontClassName()} suppressHydrationWarning>
      <head>
        {/* Applies the stored theme before first paint — prevents a flash. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="flex min-h-full flex-col font-sans">
        <ThemeProvider initialTheme={parseThemeCookieValue(themeCookie)}>{children}</ThemeProvider>
      </body>
    </html>
  );
}
