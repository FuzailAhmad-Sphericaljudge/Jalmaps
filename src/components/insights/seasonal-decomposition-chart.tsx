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
  Legend,
} from "recharts";
import { useTranslations } from "next-intl";

interface DailyMedianPoint {
  date: string;
  depthM: number;
}

interface SeasonalDecompositionChartProps {
  dailyMedians: DailyMedianPoint[];
  residualStdDevM?: number;
}

export function SeasonalDecompositionChart({ dailyMedians }: SeasonalDecompositionChartProps) {
  const t = useTranslations("insights");

  if (!dailyMedians || dailyMedians.length === 0) {
    return null;
  }

  // Format data for Recharts
  const data = dailyMedians.map((d) => ({
    date: d.date.slice(5), // MM-DD
    depth: d.depthM,
  }));

  return (
    <div className="space-y-4 rounded-2xl border bg-card p-6 shadow-xs">
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-semibold text-foreground">{t("seasonalChart.title")}</h3>
        <p className="text-xs text-muted-foreground">{t("seasonalChart.subtitle")}</p>
      </div>

      <div className="h-[260px] w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
            <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11 }}
              domain={["auto", "auto"]}
              reversed // In groundwater, deeper depth means lower water table
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="rounded-lg border bg-background p-3 text-xs shadow-md">
                      <div className="font-semibold text-foreground">{label}</div>
                      <div className="mt-1 flex items-center justify-between gap-4 text-blue-600 dark:text-blue-400">
                        <span>{t("seasonalChart.observed")}</span>
                        <span className="font-medium">{`${payload[0]?.value} m`}</span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
            <Line
              type="monotone"
              dataKey="depth"
              name={t("seasonalChart.observed")}
              stroke="#2563eb"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
