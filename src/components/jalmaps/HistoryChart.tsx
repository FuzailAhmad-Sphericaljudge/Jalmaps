"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { useSeries } from "@/lib/series/use-series";
import type { TimeRangePreset } from "@/lib/series/ranges";
import { ChartRangePicker } from "./ChartRangePicker";

interface HistoryChartProps {
  wellId: string;
}

export function HistoryChart({ wellId }: HistoryChartProps) {
  const t = useTranslations("history");
  const [range, setRange] = useState<TimeRangePreset>("1y");
  const { data, isLoading, isError } = useSeries(wellId, range);

  if (isLoading) {
    return (
      <div className="flex h-72 w-full items-center justify-center rounded-lg border border-border bg-card">
        <p className="text-muted-foreground">{t("loading")}</p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex h-72 w-full items-center justify-center rounded-lg border border-border bg-card">
        <p className="text-destructive">{t("error")}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <ChartRangePicker value={range} onChange={setRange} />
      <div className="h-72 w-full rounded-lg border border-border bg-card p-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis
              dataKey="x"
              type="number"
              domain={["dataMin", "dataMax"]}
              tickFormatter={(val) => new Date(val).toLocaleDateString()}
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            {/* The user requested an INVERTED y-axis so deeper water is lower on the chart */}
            <YAxis reversed stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <Line
              type="monotone"
              dataKey="y"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={false}
              connectNulls={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
