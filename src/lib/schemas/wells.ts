import { z } from "zod";

import { uuidSchema } from "./ids";

const wellTypeSchema = z.enum(["borewell", "open_well", "tank", "pond"]);
const wellStatusSchema = z.enum(["planned", "active", "inactive", "dry", "decommissioned"]);
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

export const NodeSettingsSchema = z.object({
  hardware_id: z.string().min(1),
  sensor_model: z.string().default("DFRobot KIT0139"),
  range_m: z.number().min(0.1).max(50),
  hang_depth_m: z.number().min(0.1).max(200),
  calibration_offset_m: z.number().min(-10).max(10).default(0),
});

export const WellMemberSchema = z.object({
  phone: z.string().regex(/^\+[1-9]\d{1,14}$/, "Must be a valid E.164 phone number"),
  role: z.enum(["viewer", "editor"]),
});

export const CsvRowSchema = z.object({
  name: z.string().min(1).max(100),
  well_type: wellTypeSchema,
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  total_depth_m: z.number().positive().optional(),
  notes: z.string().max(500).optional(),
  owner_phone: z
    .string()
    .regex(/^\+[1-9]\d{1,14}$/)
    .optional(),
});
