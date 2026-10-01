import { z } from "zod";

import { uuidSchema } from "./ids";

export const nodeCreateSchema = z.object({
  well_id: uuidSchema,
  hardware_id: z.string().trim().min(1).max(160),
  api_key_hash: z
    .string()
    .regex(/^[0-9a-f]{64}$/)
    .nullable()
    .optional(),
  sensor_model: z.string().max(120).nullable().optional(),
  range_m: z.number().positive().nullable().optional(),
  hang_depth_m: z.number().positive().nullable().optional(),
  calibration_offset_m: z.number().optional(),
  firmware_version: z.string().max(80).nullable().optional(),
  battery_v: z.number().nonnegative().nullable().optional(),
  signal_rssi: z.number().int().nullable().optional(),
  last_seen_at: z.iso.datetime().nullable().optional(),
  status: z.enum(["provisioning", "active", "offline", "fault", "retired"]).optional(),
  is_simulated: z.boolean().optional(),
});

export const nodeFiltersSchema = z.object({
  well_id: uuidSchema,
  status: z.enum(["provisioning", "active", "offline", "fault", "retired"]).optional(),
});

export type NodeCreateInput = z.infer<typeof nodeCreateSchema>;
export type NodeFilters = z.infer<typeof nodeFiltersSchema>;
