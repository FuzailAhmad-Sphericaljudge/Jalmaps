import { z } from "zod";
import type { EvaluatorFunction } from "../types";

export const NoDataParamsSchema = z.object({
  max_hours_without_data: z.number().positive(),
  severity: z.enum(["info", "warning", "critical"]).default("critical"),
});

export type NoDataParams = z.infer<typeof NoDataParamsSchema>;

export const evaluateNoData: EvaluatorFunction = (params, context) => {
  const parsed = NoDataParamsSchema.parse(params);
  const { readings, previousAlert, now } = context;

  const newestReading = readings.length > 0 ? readings[0] : null;

  let triggered = false;
  let hoursSinceLast = -1;

  if (!newestReading) {
    triggered = true;
  } else {
    const lastTime = new Date(newestReading.recorded_at).getTime();
    hoursSinceLast = (now.getTime() - lastTime) / (60 * 60 * 1000);
    if (hoursSinceLast >= parsed.max_hours_without_data) {
      triggered = true;
    }
  }

  if (previousAlert && previousAlert.status !== "resolved") {
    if (!triggered) {
      // If triggered is false, it means we have data that is recent enough
      return { triggered: false, shouldResolve: true };
    }
    return { triggered: true };
  }

  if (triggered) {
    return {
      triggered: true,
      severity: parsed.severity,
      payload: { hours_since_last_reading: hoursSinceLast },
    };
  }

  return { triggered: false };
};

