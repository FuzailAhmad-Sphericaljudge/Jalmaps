import { z } from "zod";
import type { EvaluatorFunction } from "../types";

export const DropRateParamsSchema = z.object({
  threshold_m_per_24h: z.number().positive(),
  min_data_coverage_hours: z.number().positive().default(12),
  severity: z.enum(["info", "warning", "critical"]).default("warning"),
});

export type DropRateParams = z.infer<typeof DropRateParamsSchema>;

export const evaluateDropRate: EvaluatorFunction = (params, context) => {
  const parsed = DropRateParamsSchema.parse(params);
  const { readings, previousAlert, now } = context;

  // Filter to good quality readings only
  const goodReadings = readings
    .filter((r) => r.quality !== "bad" && r.depth_to_water_m !== null)
    .sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime()); // newest first

  if (goodReadings.length === 0) {
    return { triggered: previousAlert?.status !== "resolved" ? true : false };
  }

  // Compare rolling 24-hour medians
  const nowMs = now.getTime();
  const ONE_DAY = 24 * 60 * 60 * 1000;
  
  const window1Readings = goodReadings.filter(r => {
    const t = new Date(r.recorded_at).getTime();
    return t > nowMs - ONE_DAY && t <= nowMs;
  });
  
  const window2Readings = goodReadings.filter(r => {
    const t = new Date(r.recorded_at).getTime();
    return t > nowMs - 2 * ONE_DAY && t <= nowMs - ONE_DAY;
  });

type Reading = { recorded_at: string | Date; depth_to_water_m: number | null };

  const hasCoverage = (window: Reading[]) => {
    if (window.length === 0) return false;
    const first = new Date(window[window.length - 1]!.recorded_at).getTime();
    const last = new Date(window[0]!.recorded_at).getTime();
    const coverageHours = (last - first) / (60 * 60 * 1000);
    return coverageHours >= parsed.min_data_coverage_hours;
  };

  if (!hasCoverage(window1Readings) || !hasCoverage(window2Readings)) {
    // Insufficient data
    if (previousAlert && previousAlert.status !== "resolved") {
      return { triggered: true };
    }
    return { triggered: false };
  }

  const getMedian = (window: Reading[]): number => {
    if (window.length === 0) return 0;
    const sorted = window.map(r => r.depth_to_water_m!).sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2.0;
  };

  const median1 = getMedian(window1Readings); // recent 24h
  const median2 = getMedian(window2Readings); // previous 24h

  // depth_to_water_m is larger when water level is deeper
  const drop = median1 - median2;
  const triggered = drop >= parsed.threshold_m_per_24h;

  if (previousAlert && previousAlert.status !== "resolved") {
    // Auto-resolve if drop rate is well below threshold (e.g. < 80%)
    if (drop < parsed.threshold_m_per_24h * 0.8) {
      return { triggered: false, shouldResolve: true };
    }
    return { triggered: true, payload: { drop_m: drop } };
  }

  if (triggered) {
    return {
      triggered: true,
      severity: parsed.severity,
      payload: { drop_m: drop, threshold_m_per_24h: parsed.threshold_m_per_24h },
    };
  }

  return { triggered: false };
};

