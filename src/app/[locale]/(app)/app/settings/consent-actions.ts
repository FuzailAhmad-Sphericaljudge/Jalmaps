"use server";

import { isAppLocale } from "@/i18n/config";
import { consentSchema } from "@/lib/schemas/consent";
import { requireUser } from "@/server/auth";
import { createServerComponentClient } from "@/server/supabase/server-component";
import { updateConsentForUser } from "@/server/consent/service";

export async function saveConsentSettings(locale: unknown, input: unknown) {
  if (!isAppLocale(locale)) return { status: "invalid" as const };
  const parsed = consentSchema.safeParse(input);
  if (!parsed.success) return { status: "invalid" as const };

  const current = await requireUser(locale);
  const supabase = await createServerComponentClient();

  await updateConsentForUser(supabase, current.user.id, parsed.data.data_sharing_consent);

  return {
    status: "saved" as const,
    data_sharing_consent: parsed.data.data_sharing_consent,
  };
}

