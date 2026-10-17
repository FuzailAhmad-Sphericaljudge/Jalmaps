"use client";

import { useSharedClock } from "@/lib/realtime/use-clock";
import { useTranslations } from "next-intl";
import { AlertTriangle } from "lucide-react";

export function StaleBanner({
  lastSeenAt,
  reportingIntervalSec = 300, // default 5 minutes
}: {
  lastSeenAt: string | null;
  reportingIntervalSec?: number;
}) {
  const now = useSharedClock(60000); // update every minute
  const t = useTranslations("realtime");

  if (!lastSeenAt) return null;

  const diffMs = now - new Date(lastSeenAt).getTime();
  const diffSec = diffMs / 1000;

  // Stale if no data for twice the reporting interval
  const isStale = diffSec > reportingIntervalSec * 2;

  if (!isStale) return null;

  const minutes = Math.floor(diffSec / 60);

  return (
    <div className="flex items-center gap-2 rounded-md bg-warning-soft p-3 text-sm text-warning-foreground">
      <AlertTriangle className="size-4" aria-hidden="true" />
      <span>{t("staleData", { minutes, fallback: `No data for ${minutes} minutes` })}</span>
    </div>
  );
}
