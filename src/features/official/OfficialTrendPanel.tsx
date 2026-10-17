"use client";

import { useTranslations } from "next-intl";
import { TrendingDown, LineChart as ChartIcon } from "lucide-react";
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
import type { OfficialTrendPoint } from "@/server/official/service";

interface OfficialTrendPanelProps {
  trendHistory: OfficialTrendPoint[];
  selectedPreset: "7d" | "30d" | "90d" | "1y";
  onSelectPreset?: (preset: "7d" | "30d" | "90d" | "1y") => void;
}

export function OfficialTrendPanel({
  trendHistory,
  selectedPreset,
  onSelectPreset,
}: OfficialTrendPanelProps) {
  const t = useTranslations("official");

  const formattedData = trendHistory.map((d) => ({
    date: d.date.length > 5 ? d.date.slice(5) : d.date,
    currentDepth: d.avgDepthM !== null ? Number(d.avgDepthM.toFixed(2)) : null,
    lastYearDepth:
      d.lastYearAvgDepthM !== undefined && d.lastYearAvgDepthM !== null
        ? Number(d.lastYearAvgDepthM.toFixed(2))
        : null,
  }));

  const hasLastYearData = formattedData.some((d) => d.lastYearDepth !== null);

  return (
    <div className="space-y-4 rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
      <div className="flex flex-col justify-between gap-3 border-b border-border/50 pb-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground">
            <TrendingDown className="h-5 w-5 text-primary" aria-hidden="true" />
            {t("trend.title")}
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">{t("trend.subtitle")}</p>
        </div>

        <div className="flex items-center gap-1 self-start rounded-xl bg-muted p-1 sm:self-auto">
          {(["7d", "30d", "90d", "1y"] as const).map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => onSelectPreset?.(preset)}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                selectedPreset === preset
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {preset === "7d"
                ? t("trend.preset7d")
                : preset === "30d"
                  ? t("trend.preset30d")
                  : preset === "90d"
                    ? t("trend.preset90d")
                    : t("trend.preset1y")}
            </button>
          ))}
        </div>
      </div>

      {formattedData.length === 0 ? (
        <div className="py-12 text-center">
          <ChartIcon className="mx-auto h-7 w-7 text-muted-foreground/50" aria-hidden="true" />
          <p className="mt-2 text-xs text-muted-foreground">{t("trend.empty")}</p>
        </div>
      ) : (
        <div className="h-[300px] w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={formattedData} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.25} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "currentColor" }}
                className="text-muted-foreground"
              />
              <YAxis
                reversed
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "currentColor" }}
                className="text-muted-foreground"
                domain={["auto", "auto"]}
                unit=" m"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  borderColor: "var(--border)",
                  borderRadius: "0.75rem",
                  fontSize: "12px",
                }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: "10px", fontSize: "12px" }}
              />
              <Line
                type="monotone"
                dataKey="currentDepth"
                name={t("trend.currentYear")}
                stroke="#0284c7"
                strokeWidth={2.5}
                dot={{ r: 2.5 }}
                activeDot={{ r: 5 }}
                connectNulls
              />
              {hasLastYearData && (
                <Line
                  type="monotone"
                  dataKey="lastYearDepth"
                  name={t("trend.lastYear")}
                  stroke="#94a3b8"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                  connectNulls
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
