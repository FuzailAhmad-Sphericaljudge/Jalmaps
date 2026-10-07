import { z } from "zod";

import { locales } from "@/i18n/config";

export const settingsSchema = z.object({
  preferred_locale: z.enum(locales),
  preferred_unit: z.enum(["m", "ft"]),
  text_size: z.enum(["normal", "large", "extraLarge"]),
  theme: z.enum(["system", "light", "dark"]),
});

export type SettingsInput = z.infer<typeof settingsSchema>;
