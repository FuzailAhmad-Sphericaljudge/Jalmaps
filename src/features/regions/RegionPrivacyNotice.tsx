"use client";

import React from "react";
import { ShieldAlert } from "lucide-react";
import { useTranslations } from "next-intl";

interface RegionPrivacyNoticeProps {
  minSampleSize: number;
}

export function RegionPrivacyNotice({ minSampleSize }: RegionPrivacyNoticeProps) {
  const t = useTranslations("regions");

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-900 dark:text-amber-200"
    >
      <div className="flex min-h-[48px] min-w-[48px] items-center justify-center rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400">
        <ShieldAlert className="h-6 w-6" aria-hidden="true" />
      </div>
      <div className="flex-1 self-center">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-md bg-amber-500/20 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-300">
            {t("privacy.badge")}
          </span>
        </div>
        <p className="mt-1 text-sm font-medium">{t("privacy.notice", { min: minSampleSize })}</p>
      </div>
    </div>
  );
}
