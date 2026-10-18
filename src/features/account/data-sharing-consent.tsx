"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ShieldCheck, Info } from "lucide-react";

import type { AppLocale } from "@/i18n/config";
import { saveConsentSettings } from "@/app/[locale]/(app)/app/settings/consent-actions";

export function DataSharingConsentToggle({
  initialConsent,
  locale,
}: {
  initialConsent: boolean;
  locale: AppLocale;
}) {
  const t = useTranslations("settings");
  const [consent, setConsent] = useState(initialConsent);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  async function handleToggle(checked: boolean) {
    setBusy(true);
    setMessage(null);
    setIsError(false);

    try {
      const res = await saveConsentSettings(locale, { data_sharing_consent: checked });
      if (res.status === "saved") {
        setConsent(checked);
        setMessage(t("saved"));
      } else {
        setIsError(true);
        setMessage(t("saveError"));
      }
    } catch {
      setIsError(true);
      setMessage(t("saveError"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      className="space-y-4 rounded-xl border border-border p-4"
      aria-labelledby="data-sharing-heading"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" aria-hidden="true" />
          <h2 id="data-sharing-heading" className="font-semibold">
            {t("dataSharingTitle")}
          </h2>
        </div>
        <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
          {t("legalReviewNote")}
        </span>
      </div>

      <p className="text-sm text-muted-foreground">{t("dataSharingDescription")}</p>

      <div className="flex items-center justify-between rounded-lg border border-input p-4">
        <div>
          <label htmlFor="settings-data-sharing" className="block font-medium">
            {t("dataSharingConsentLabel")}
          </label>
          <p className="text-xs text-muted-foreground">
            {consent ? t("dataSharingConsentActive") : t("dataSharingConsentInactive")}
          </p>
        </div>
        <div className="relative inline-block w-12 align-middle select-none">
          <input
            type="checkbox"
            id="settings-data-sharing"
            disabled={busy}
            checked={consent}
            onChange={(e) => handleToggle(e.target.checked)}
            className="toggle-checkbox absolute block h-6 w-6 cursor-pointer appearance-none rounded-full border-4 bg-white transition-transform duration-200 ease-in-out checked:translate-x-6 checked:border-primary disabled:opacity-50"
          />
          <label
            htmlFor="settings-data-sharing"
            className={`toggle-label block h-6 cursor-pointer overflow-hidden rounded-full ${
              consent ? "bg-primary" : "bg-gray-300"
            }`}
          />
        </div>
      </div>

      <div className="flex items-start gap-2 text-xs text-muted-foreground">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <p>{t("dataSharingWithdrawNotice")}</p>
      </div>

      <div aria-live="polite" className="min-h-5 text-xs">
        {message ? (
          <p
            className={
              isError ? "text-destructive" : "font-medium text-green-600 dark:text-green-400"
            }
          >
            {message}
          </p>
        ) : null}
      </div>
    </section>
  );
}
