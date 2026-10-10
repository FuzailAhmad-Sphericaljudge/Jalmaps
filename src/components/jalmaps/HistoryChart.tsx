"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Area,
  ReferenceLine,
  Brush,
} from "recharts";
import { useSeries } from "@/lib/series/use-series";
import type { TimeRangePreset } from "@/lib/series/ranges";
import { ChartRangePicker } from "./ChartRangePicker";
import { ChartTooltip } from "./ChartTooltip";

interface AlertRule {
  threshold: number | null;
  severity: "info" | "warning" | "critical";
}

interface HistoryChartProps {
  wellId: string;
  alertRules?: AlertRule[];
}

export function HistoryChart({ wellId, alertRules = [] }: HistoryChartProps) {
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
            <Tooltip
              content={<ChartTooltip />}
              cursor={{
                stroke: "hsl(var(--muted-foreground))",
                strokeWidth: 1,
                strokeDasharray: "3 3",
              }}
            />
            <Area
              type="monotone"
              dataKey="band"
              stroke="none"
              fill="hsl(var(--primary))"
              fillOpacity={0.1}
              connectNulls={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="y"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={false}
              connectNulls={false}
              isAnimationActive={false}
            />
            {alertRules.map((rule, idx) =>
              rule.threshold !== null ? (
                <ReferenceLine
                  key={idx}
                  y={rule.threshold}
                  stroke={
                    rule.severity === "critical"
                      ? "hsl(var(--destructive))"
                      : "hsl(var(--warning, 38 92% 50%))"
                  }
                  strokeDasharray="4 4"
                  label={{
                    position: "insideBottomLeft",
                    value: t(`alerts.${rule.severity}`),
                    fill:
                      rule.severity === "critical"
                        ? "hsl(var(--destructive))"
                        : "hsl(var(--warning, 38 92% 50%))",
                    fontSize: 12,
                  }}
                />
              ) : null,
            )}
            <Brush
              dataKey="x"
              height={30}
              stroke="hsl(var(--border))"
              fill="hsl(var(--muted))"
              tickFormatter={() => ""}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
