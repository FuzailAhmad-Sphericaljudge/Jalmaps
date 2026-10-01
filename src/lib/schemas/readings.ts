import { z } from "zod";

import { uuidSchema } from "./ids";

export const readingCreateSchema = z.object({
  node_id: uuidSchema,
  recorded_at: z.iso.datetime(),
  column_m: z.number().nonnegative(),
  depth_to_water_m: z.number().nullable().optional(),
  current_ma: z.number().nonnegative().nullable().optional(),
  battery_v: z.number().nonnegative().nullable().optional(),
  rssi: z.number().int().nullable().optional(),
  quality: z.enum(["good", "suspect", "bad"]).optional(),
  raw: z.record(z.string(), z.json()).optional(),
});

export const readingQuerySchema = z.object({
  node_id: uuidSchema,
  from: z.iso.datetime().optional(),
  to: z.iso.datetime().optional(),
  limit: z.number().int().min(1).max(1000).default(100),
});

export type ReadingCreateInput = z.infer<typeof readingCreateSchema>;
export type ReadingQuery = z.input<typeof readingQuerySchema>;
