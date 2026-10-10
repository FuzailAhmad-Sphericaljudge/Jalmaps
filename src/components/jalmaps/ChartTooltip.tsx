"use client";

import { useTranslations } from "next-intl";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ChartTooltip({ active, payload, label }: any) {
  const t = useTranslations("history");

  if (active && payload && payload.length) {
    const value = payload[0].value;
    const date = new Date(label as number).toLocaleString();

    return (
      <div className="rounded-lg border border-border bg-popover p-2 text-popover-foreground shadow-sm">
        <p className="mb-1 text-sm font-medium">{date}</p>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-primary" />
          <p className="text-sm">
            {`${typeof value === "number" ? value.toFixed(2) : value} ${t("unit.m")}`}
          </p>
        </div>
      </div>
    );
  }

  return null;
}
