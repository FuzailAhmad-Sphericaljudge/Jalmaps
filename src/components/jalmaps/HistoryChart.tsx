"use client";

import { useTranslations } from "next-intl";
import { useState, useMemo } from "react";
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
import { useCompareSeries } from "@/lib/series/use-compare-series";
import { useWellRealtime } from "@/lib/realtime/use-well-realtime";
import type { TimeRangePreset } from "@/lib/series/ranges";
import { ChartRangePicker } from "./ChartRangePicker";
import { ChartTooltip } from "./ChartTooltip";
import { CompareSelector } from "./CompareSelector";
import { HistoryDataTable } from "./HistoryDataTable";

interface AlertRule {
  threshold: number | null;
  severity: "info" | "warning" | "critical";
}

export interface EventMarker {
  type: "alert" | "rain" | "pump";
  timestamp: string;
  severity?: "info" | "warning" | "critical";
  message: string;
}

interface HistoryChartProps {
  wellId: string;
  alertRules?: AlertRule[];
  otherWells?: { id: string; name: string }[];
  events?: EventMarker[];
}

const COMPARE_COLORS = ["#d95f02", "#7570b3", "#e7298a"];
const COMPARE_DASHES = ["5 5", "2 2", "10 5"];

export function HistoryChart({
  wellId,
  alertRules = [],
  otherWells = [],
  events = [],
}: HistoryChartProps) {
  const t = useTranslations("history");
  const [range, setRange] = useState<TimeRangePreset>("1y");
  const [compareWellIds, setCompareWellIds] = useState<string[]>([]);

  // Wire up realtime updates for the base well
  useWellRealtime(wellId);

  const {
    data: baseData,
    isLoading: isBaseLoading,
    isError: isBaseError,
  } = useSeries(wellId, range);
  const compareQueries = useCompareSeries(compareWellIds, range);

  const isCompareLoading = compareQueries.some((q) => q.isLoading);
  const isLoading = isBaseLoading || isCompareLoading;
  const isError = isBaseError;

  const mergedData = useMemo(() => {
    if (!baseData) return [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const map = new Map<number, any>();

    baseData.forEach((d) => {
      map.set(d.x, { ...d });
    });

    compareQueries.forEach((q) => {
      if (q.data) {
        q.data.data.forEach((d) => {
          if (!map.has(d.x)) {
            map.set(d.x, { x: d.x });
          }
          const row = map.get(d.x);
          row[`y_${q.data.wellId}`] = d.y;
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => a.x - b.x);
  }, [baseData, compareQueries]);

  const [showTable, setShowTable] = useState(false);

  if (isLoading) {
    return (
      <div className="flex h-72 w-full items-center justify-center rounded-lg border border-border bg-card">
        <p className="text-muted-foreground">{t("loading")}</p>
      </div>
    );
  }

  if (isError || !baseData) {
    return (
      <div className="flex h-72 w-full items-center justify-center rounded-lg border border-border bg-card">
        <p className="text-destructive">{t("error")}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <ChartRangePicker value={range} onChange={setRange} />
        <div className="flex items-center gap-4">
          {otherWells.length > 0 && (
            <CompareSelector
              otherWells={otherWells}
              selectedIds={compareWellIds}
              onChange={setCompareWellIds}
            />
          )}
          <button
            onClick={() => setShowTable(!showTable)}
            className="text-sm font-medium text-primary hover:underline"
          >
            {showTable
              ? t("viewChart", { fallback: "View Chart" })
              : t("viewTable", { fallback: "View Table" })}
          </button>
        </div>
      </div>
      {showTable ? (
        <HistoryDataTable
          data={mergedData}
          compareWellIds={compareWellIds}
          otherWells={otherWells}
        />
      ) : (
        <div className="h-72 w-full rounded-lg border border-border bg-card p-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={mergedData}>
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
                name={t("thisWell", { fallback: "This well" })}
              />

              {compareQueries.map((q, idx) => {
                if (!q.data) return null;
                const wName = otherWells.find((w) => w.id === q.data.wellId)?.name || q.data.wellId;
                return (
                  <Line
                    key={q.data.wellId}
                    type="monotone"
                    dataKey={`y_${q.data.wellId}`}
                    stroke={COMPARE_COLORS[idx % COMPARE_COLORS.length]}
                    strokeDasharray={COMPARE_DASHES[idx % COMPARE_DASHES.length]}
                    strokeWidth={2}
                    dot={false}
                    connectNulls={false}
                    isAnimationActive={false}
                    name={wName}
                  />
                );
              })}

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

              {events.map((event, idx) => (
                <ReferenceLine
                  key={`event-${idx}`}
                  x={new Date(event.timestamp).getTime()}
                  stroke="hsl(var(--muted-foreground))"
                  strokeDasharray="3 3"
                  label={{
                    position: "insideTopLeft",
                    value:
                      event.type === "alert"
                        ? t("alerts.alert", { fallback: "Alert" })
                        : event.type,
                    fill: "hsl(var(--muted-foreground))",
                    fontSize: 12,
                  }}
                />
              ))}
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
      )}
    </div>
  );
}
