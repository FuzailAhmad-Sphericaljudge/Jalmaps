import { z } from "zod";

import { uuidSchema } from "./ids";

const wellTypeSchema = z.enum(["borewell", "open_well", "tank", "pond"]);
const wellStatusSchema = z.enum(["active", "inactive", "decommissioned"]);
const wellVisibilitySchema = z.enum(["private", "admin_area", "public"]);

export const wellCreateSchema = z.object({
  owner_id: uuidSchema.nullable().optional(),
  admin_area_id: uuidSchema,
  name: z.string().trim().min(1).max(160),
  well_type: wellTypeSchema,
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  total_depth_m: z.number().positive().nullable().optional(),
  installed_at: z.iso.date().nullable().optional(),
  status: wellStatusSchema.optional(),
  visibility: wellVisibilitySchema.optional(),
  notes: z.string().max(4000).nullable().optional(),
});

export const wellFiltersSchema = z.object({
  admin_area_id: uuidSchema.optional(),
  owner_id: uuidSchema.optional(),
  status: wellStatusSchema.optional(),
  limit: z.number().int().min(1).max(100).default(30),
});

export type WellCreateInput = z.infer<typeof wellCreateSchema>;
export type WellFilters = z.input<typeof wellFiltersSchema>;
