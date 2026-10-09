"use client";

import { useTranslations } from "next-intl";

interface HistoryChartProps {
  wellId: string;
}

export function HistoryChart({ wellId }: HistoryChartProps) {
  const t = useTranslations("history");

  return (
    <div className="flex h-72 w-full items-center justify-center rounded-lg border border-border bg-card">
      <p className="text-muted-foreground">{t("loading")}</p>
    </div>
  );
}
