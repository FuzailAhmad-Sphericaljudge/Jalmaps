"use client";

import { useTranslations } from "next-intl";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ChartTooltip({ active, payload, label }: any) {
  const t = useTranslations("history");

  if (active && payload && payload.length) {
    const date = new Date(label as number).toLocaleString();

    return (
      <div className="rounded-lg border border-border bg-popover p-2 text-popover-foreground shadow-sm">
        <p className="mb-2 text-sm font-medium">{date}</p>
        <div className="flex flex-col gap-1">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {payload.map((entry: any, index: number) => {
            // skip if it's the band
            if (entry.dataKey === "band") return null;

            const val = entry.value;
            if (typeof val !== "number") return null;

            return (
              <div key={index} className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <p className="flex w-full min-w-32 justify-between gap-4 text-sm">
                  <span className="text-muted-foreground">
                    {entry.name || "Depth"}
                    {":"}
                  </span>
                  <span className="font-semibold">
                    {val.toFixed(2)} {t("unit.m")}
                  </span>
                </p>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
}
