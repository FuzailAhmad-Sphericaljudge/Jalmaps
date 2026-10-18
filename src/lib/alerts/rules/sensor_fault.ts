import { z } from "zod";
import type { EvaluatorFunction } from "../types";

export const SensorFaultParamsSchema = z.object({
  window_hours: z.number().positive().default(24),
  max_bad_ratio: z.number().min(0).max(1).default(0.5),
  flatline_variance_threshold: z.number().positive().default(0.001),
  min_readings_required: z.number().positive().default(5),
  severity: z.enum(["info", "warning", "critical"]).default("critical"),
});

export type SensorFaultParams = z.infer<typeof SensorFaultParamsSchema>;

export const evaluateSensorFault: EvaluatorFunction = (params, context) => {
  const parsed = SensorFaultParamsSchema.parse(params);
  const { readings, previousAlert, now } = context;

  const nowMs = now.getTime();
  const windowMs = parsed.window_hours * 60 * 60 * 1000;
  
  const windowReadings = readings.filter(r => {
    const t = new Date(r.recorded_at).getTime();
    return t > nowMs - windowMs && t <= nowMs;
  });

  if (windowReadings.length < parsed.min_readings_required) {
    return { triggered: previousAlert?.status !== "resolved" ? true : false };
  }

  const badOrSuspectCount = windowReadings.filter(r => r.quality === "bad" || r.quality === "suspect").length;
  const badRatio = badOrSuspectCount / windowReadings.length;
  
  let isFlatline = false;
  const goodReadings = windowReadings.filter(r => r.quality !== "bad" && r.depth_to_water_m !== null);
  
  if (goodReadings.length >= parsed.min_readings_required) {
    const depths = goodReadings.map(r => r.depth_to_water_m!);
    const mean = depths.reduce((a, b) => a + b, 0) / depths.length;
    const variance = depths.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / depths.length;
    if (variance < parsed.flatline_variance_threshold) {
      isFlatline = true;
    }
  }

  const triggered = badRatio >= parsed.max_bad_ratio || isFlatline;

  if (previousAlert && previousAlert.status !== "resolved") {
    if (!triggered) {
      return { triggered: false, shouldResolve: true };
    }
    return { triggered: true };
  }

  if (triggered) {
    return {
      triggered: true,
      severity: parsed.severity,
      payload: {
        bad_ratio: badRatio,
        is_flatline: isFlatline,
      },
    };
  }

  return { triggered: false };
};

