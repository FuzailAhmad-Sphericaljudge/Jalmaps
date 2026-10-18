import { z } from "zod";

export const AlertRuleType = z.enum([
  "level_below",
  "drop_rate",
  "no_data",
  "low_battery",
  "sensor_fault",
]);
export type AlertRuleType = z.infer<typeof AlertRuleType>;

export const AlertSeverity = z.enum(["info", "warning", "critical"]);
export type AlertSeverity = z.infer<typeof AlertSeverity>;

export const AlertStatus = z.enum(["open", "acknowledged", "snoozed", "resolved"]);
export type AlertStatus = z.infer<typeof AlertStatus>;

export const AlertResolvedReason = z.enum(["auto", "manual"]);
export type AlertResolvedReason = z.infer<typeof AlertResolvedReason>;

export interface AlertContext {
  well: { id: string; [key: string]: unknown };
  node: { id?: string; battery_v?: number | null; [key: string]: unknown };
  readings: {
    recorded_at: string | Date;
    depth_to_water_m: number | null;
    quality?: string;
    [key: string]: unknown;
  }[];
  now: Date;
  previousAlert?: { id: string; status: AlertStatus; [key: string]: unknown }; // The currently open or snoozed alert for this rule, if any
}

export interface AlertEvaluationResult {
  triggered: boolean;
  severity?: AlertSeverity;
  payload?: Record<string, unknown>;
  shouldResolve?: boolean; // True if an existing alert should auto-resolve
}

export type EvaluatorFunction = (
  ruleParams: unknown,
  context: AlertContext,
) => AlertEvaluationResult;
