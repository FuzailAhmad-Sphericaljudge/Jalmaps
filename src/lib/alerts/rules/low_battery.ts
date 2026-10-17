import { z } from "zod";
import type { EvaluatorFunction } from "../types";

export const LowBatteryParamsSchema = z.object({
  threshold_v: z.number().positive(),
  hysteresis_v: z.number().nonnegative().default(0.1),
  severity: z.enum(["info", "warning", "critical"]).default("warning"),
});

export type LowBatteryParams = z.infer<typeof LowBatteryParamsSchema>;

export const evaluateLowBattery: EvaluatorFunction = (params, context) => {
  const parsed = LowBatteryParamsSchema.parse(params);
  const { node, previousAlert } = context;

  // We can evaluate based on the node's current battery_v, or the latest reading's battery_v.
  // The context provides node which should have battery_v.
  if (node.battery_v === null || node.battery_v === undefined) {
    return { triggered: previousAlert?.status !== "resolved" ? true : false };
  }

  const currentV = node.battery_v;

  if (previousAlert && previousAlert.status !== "resolved") {
    // Check for auto-resolve (hysteresis)
    const recoverThreshold = parsed.threshold_v + parsed.hysteresis_v;
    if (currentV >= recoverThreshold) {
      return { triggered: false, shouldResolve: true };
    }
    return { triggered: true };
  }

  if (currentV <= parsed.threshold_v) {
    return {
      triggered: true,
      severity: parsed.severity,
      payload: { current_v: currentV, threshold_v: parsed.threshold_v },
    };
  }

  return { triggered: false };
};

