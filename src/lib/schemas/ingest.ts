import { z } from "zod";

const isoDateString = z.string().datetime();

export const ingestReadingSchema = z
  .object({
    current_ma: z.number().min(-1).max(30),
    battery_v: z.number().min(2.5).max(5.5).optional(),
    rssi: z.number().min(-130).max(0).optional(),
    recorded_at: isoDateString.optional(),
    age_s: z.number().nonnegative().optional(),
    seq: z.number().int().nonnegative().optional(),
  })
  .refine((data) => data.recorded_at !== undefined || data.age_s !== undefined, {
    message: "Either recorded_at or age_s must be provided",
    path: ["recorded_at"],
  });

export const ingestRequestSchema = z.object({
  hardware_id: z.string().min(1),
  firmware: z.string().optional(),
  sent_at: isoDateString.optional(),
  readings: z.array(ingestReadingSchema).max(200, "Maximum 200 readings per request"),
});

export type IngestReading = z.infer<typeof ingestReadingSchema>;
export type IngestRequest = z.infer<typeof ingestRequestSchema>;

export const ingestResultSchema = z.object({
  index: z.number().int().nonnegative(),
  status: z.enum(["accepted", "duplicate", "rejected"]),
  reason: z.string().optional(),
});

export const ingestResponseSchema = z.object({
  server_time: isoDateString,
  next_interval_s: z.number().int().positive(),
  accepted: z.number().int().nonnegative(),
  duplicates: z.number().int().nonnegative(),
  rejected: z.number().int().nonnegative(),
  results: z.array(ingestResultSchema),
});

export type IngestResponse = z.infer<typeof ingestResponseSchema>;

/**
 * Validates a timestamp is within acceptable bounds:
 * not > 5 minutes in future, not > 30 days in past.
 */
export function validateTimestampPlausibility(date: Date, now = new Date()): boolean {
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = diffMs / 1000 / 60;

  if (diffMinutes < -5) {
    return false; // more than 5 minutes in future
  }

  const diffDays = diffMs / 1000 / 60 / 60 / 24;
  if (diffDays > 30) {
    return false; // older than 30 days
  }

  return true;
}
