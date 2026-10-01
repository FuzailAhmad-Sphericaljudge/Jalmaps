import { z } from "zod";

import { locales } from "@/i18n/config";
import { uuidSchema } from "@/lib/schemas/ids";

export const cropIds = [
  "rice",
  "wheat",
  "cotton",
  "millet",
  "maize",
  "pulses",
  "groundnut",
  "sugarcane",
] as const;

export const onboardingSchema = z.object({
  locale: z.enum(locales),
  preferred_locale: z.enum(locales),
  preferred_unit: z.enum(["m", "ft"]),
  state_id: uuidSchema,
  district_id: uuidSchema,
  block_id: uuidSchema,
  village_id: uuidSchema,
  crops: z.array(z.enum(cropIds)).min(1).max(cropIds.length),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;
