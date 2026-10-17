"use client";

import React from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useTranslations } from "next-intl";

interface DailyHistoryPoint {
  recorded_date: string;
  avg_depth_m: number | null;
  pct_critical: number;
  wells_count: number;
}

interface RegionHistoryChartProps {
  data: DailyHistoryPoint[];
}

export function RegionHistoryChart({ data }: RegionHistoryChartProps) {
  const t = useTranslations("regions");

  if (!data || data.length === 0) {
    return null;
  }

  // Format data for chart
  const formattedData = data.map((d) => ({
    date: d.recorded_date.slice(5), // MM-DD
    depth: d.avg_depth_m !== null ? Number(d.avg_depth_m.toFixed(1)) : null,
    critical: Number(d.pct_critical.toFixed(1)),
  }));

  return (
    <div className="space-y-4 rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold text-foreground">{t("historyTitle")}</h2>
        <p className="text-xs text-muted-foreground">{t("subtitle")}</p>
      </div>

      <div className="h-[280px] w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
            <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
            <YAxis
              yAxisId="depth"
              orientation="left"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11 }}
              domain={["auto", "auto"]}
            />
            <YAxis
              yAxisId="critical"
              orientation="right"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11 }}
              domain={[0, 100]}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="rounded-lg border bg-background p-3 text-xs shadow-md">
                      <div className="font-semibold text-foreground">{label}</div>
                      <div className="mt-1 flex flex-col gap-1">
                        <div className="flex items-center justify-between gap-4 text-blue-600 dark:text-blue-400">
                          <span>{t("metrics.avgDepth")}</span>
                          <span className="font-medium">
                            {payload[0]?.value != null
                              ? t("units.meters", { value: String(payload[0].value) })
                              : t("units.unrecorded")}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-4 text-rose-600 dark:text-rose-400">
                          <span>{t("metrics.criticalPct")}</span>
                          <span className="font-medium">
                            {t("units.percent", { value: String(payload[1]?.value ?? 0) })}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Line
              yAxisId="depth"
              type="monotone"
              dataKey="depth"
              name={t("metrics.avgDepth")}
              stroke="#2563eb"
              strokeWidth={2}
              dot={false}
            />
            <Line
              yAxisId="critical"
              type="monotone"
              dataKey="critical"
              name={t("metrics.criticalPct")}
              stroke="#e11d48"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
