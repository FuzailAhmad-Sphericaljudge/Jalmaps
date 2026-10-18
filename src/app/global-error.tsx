"use client";

import { useSyncExternalStore } from "react";
import { RefreshCw } from "lucide-react";
import { NextIntlClientProvider, useTranslations } from "next-intl";

import englishErrors from "@/i18n/messages/en/errors.json";
import hindiErrors from "@/i18n/messages/hi/errors.json";
import { getFontClassName } from "@/i18n/fonts";
import type { AppLocale } from "@/i18n/config";

function GlobalErrorContent({ reset }: { reset: () => void }) {
  const t = useTranslations("errors");
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-4 px-5 text-center">
      <h1 className="text-3xl font-semibold">{t("genericTitle")}</h1>
      <p className="text-muted-foreground">{t("genericDescription")}</p>
      <button
        type="button"
        onClick={reset}
        className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-primary px-5 font-medium text-primary-foreground focus-visible:outline-2 focus-visible:outline-ring"
      >
        <RefreshCw aria-hidden="true" className="size-4" />
        {t("retry")}
      </button>
    </main>
  );
}

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const locale = useSyncExternalStore(
    () => () => {},
    () => (window.location.pathname.split("/")[1] === "hi" ? "hi" : "en"),
    (): AppLocale => "en",
  );
  const messages = locale === "hi" ? { errors: hindiErrors } : { errors: englishErrors };

  return (
    <html lang={locale} className={getFontClassName(locale)}>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages} timeZone="Asia/Kolkata">
          <GlobalErrorContent reset={reset} />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
