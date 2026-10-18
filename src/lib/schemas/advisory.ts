import { z } from "zod";

export const CropStageSchema = z.object({
  name_en: z.string().min(1),
  name_hi: z.string().min(1),
  duration_days: z.number().int().positive(),
  water_sensitivity: z.enum(["high", "medium", "low"]),
});

export type CropStage = z.infer<typeof CropStageSchema>;

export const SowingWindowsSchema = z.object({
  kharif: z.tuple([z.string(), z.string()]).optional(),
  rabi: z.tuple([z.string(), z.string()]).optional(),
  zaid: z.tuple([z.string(), z.string()]).optional(),
});

export type SowingWindows = z.infer<typeof SowingWindowsSchema>;

export const CropProfileSchema = z.object({
  id: z.string(),
  name_en: z.string(),
  name_hi: z.string(),
  water_sensitivity: z.enum(["high", "medium", "low"]),
  growth_stages: z.array(CropStageSchema),
  sowing_windows: SowingWindowsSchema,
});

export type CropProfile = z.infer<typeof CropProfileSchema>;

export const AdvisoryRuleConditionSchema = z.object({
  fact: z.string(),
  operator: z.enum(["==", "!=", ">", ">=", "<", "<="]),
  value: z.unknown(),
});

export const AdvisoryRuleConditionsSchema = z.object({
  all: z.array(z.lazy(() => AdvisoryRuleConditionOrGroupSchema)).optional(),
  any: z.array(z.lazy(() => AdvisoryRuleConditionOrGroupSchema)).optional(),
});

export const AdvisoryRuleConditionOrGroupSchema: z.ZodType<unknown> = z.union([
  AdvisoryRuleConditionSchema,
  AdvisoryRuleConditionsSchema,
]);

export const AdvisoryRuleSchema = z.object({
  id: z.string(),
  version: z.number().int().positive(),
  enabled: z.boolean(),
  priority: z.number().int(),
  cooldown_days: z.number().int().nonnegative(),
  conditions: AdvisoryRuleConditionsSchema,
  advice_key: z.string(),
});

export type AdvisoryRule = z.infer<typeof AdvisoryRuleSchema>;
