import { z } from "zod";
import type { EvaluatorFunction } from "../types";

export const LevelBelowParamsSchema = z.object({
  threshold_m: z.number().positive(),
  consecutive_readings: z.number().int().min(1).default(3), // debounce
  hysteresis_m: z.number().nonnegative().default(0.5), // resolve when level <= threshold - hysteresis
  severity: z.enum(["info", "warning", "critical"]).default("warning"),
});

export type LevelBelowParams = z.infer<typeof LevelBelowParamsSchema>;

export const evaluateLevelBelow: EvaluatorFunction = (params, context) => {
  const parsed = LevelBelowParamsSchema.parse(params);
  const { readings, previousAlert } = context;

  // Filter to good quality readings only
  const goodReadings = readings
    .filter((r) => r.quality !== "bad" && r.depth_to_water_m !== null)
    .sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime()); // newest first

  if (previousAlert && previousAlert.status !== "resolved") {
    // Check for auto-resolve (hysteresis)
    // To resolve, the LATEST reading must be at or better than (threshold - hysteresis)
    if (goodReadings.length === 0) return { triggered: true }; // still triggered if no new good readings
    
    const latestDepth = goodReadings[0]!.depth_to_water_m!;
    const recoverThreshold = parsed.threshold_m - parsed.hysteresis_m;
    
    if (latestDepth <= recoverThreshold) {
      return { triggered: false, shouldResolve: true };
    }
    return { triggered: true }; // remains triggered
  }

  // Check for trigger
  if (goodReadings.length < parsed.consecutive_readings) {
    return { triggered: false };
  }

  const recent = goodReadings.slice(0, parsed.consecutive_readings);
  const allBelow = recent.every((r) => r.depth_to_water_m! > parsed.threshold_m); // Note: larger depth_to_water_m means deeper/lower level

  if (allBelow) {
    return {
      triggered: true,
      severity: parsed.severity,
      payload: {
        current_depth_m: recent[0]!.depth_to_water_m,
        threshold_m: parsed.threshold_m,
      },
    };
  }

  return { triggered: false };
};

