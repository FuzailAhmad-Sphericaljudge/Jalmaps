import { z } from "zod";

import { locales } from "@/i18n/config";

export const profileUpdateSchema = z.object({
  full_name: z.string().trim().min(1).max(120),
  preferred_locale: z.enum(locales),
  preferred_unit: z.enum(["m", "ft"]),
});
