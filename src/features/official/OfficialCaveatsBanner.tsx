"use client";

import { useTranslations } from "next-intl";
import { AlertCircle, ShieldAlert } from "lucide-react";

interface OfficialCaveatsBannerProps {
  offlineSensorsPct: number;
  offlineSensorsCount: number;
  privacySuppressedCount: number;
}

export function OfficialCaveatsBanner({
  offlineSensorsPct,
  offlineSensorsCount,
  privacySuppressedCount,
}: OfficialCaveatsBannerProps) {
  const t = useTranslations("official");

  const showOfflineWarning = offlineSensorsPct >= 10 && offlineSensorsCount > 0;
  const showPrivacyNotice = privacySuppressedCount > 0;

  if (!showOfflineWarning && !showPrivacyNotice) {
    return null;
  }

  return (
    <div
      role="alert"
      className="space-y-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-900 dark:text-amber-200"
    >
      <div className="flex items-center gap-2 font-semibold">
        <AlertCircle
          className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400"
          aria-hidden="true"
        />
        <span>{t("caveats.banner")}</span>
      </div>

      <div className="space-y-1 pl-6">
        {showOfflineWarning && (
          <p>
            {t("caveats.offlineWarning", {
              pct: offlineSensorsPct,
              count: offlineSensorsCount,
            })}
          </p>
        )}
        {showPrivacyNotice && (
          <p className="flex items-center gap-1.5">
            <ShieldAlert
              className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400"
              aria-hidden="true"
            />
            <span>{t("caveats.privacyNotice", { count: privacySuppressedCount })}</span>
          </p>
        )}
      </div>
    </div>
  );
}
