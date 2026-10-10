"use server";

import { cookies } from "next/headers";

import { isAppLocale } from "@/i18n/config";
import { settingsSchema } from "@/lib/schemas/settings";
import { requireUser } from "@/server/auth";
import { createServerComponentClient } from "@/server/supabase/server-component";
import { serializeThemeCookieValue, THEME_COOKIE_NAME } from "@/server/theme";

const cookieAge = 60 * 60 * 24 * 365;

export async function saveSettings(locale: unknown, input: unknown) {
  if (!isAppLocale(locale)) return { status: "invalid" as const };
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) return { status: "invalid" as const };

  const current = await requireUser(locale);
  const supabase = await createServerComponentClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      preferred_locale: parsed.data.preferred_locale,
      preferred_unit: parsed.data.preferred_unit,
      preferred_text_size: parsed.data.text_size,
      preferred_theme: parsed.data.theme,
    })
    .eq("id", current.user.id);
  if (error) throw error;

  const cookieStore = await cookies();
  cookieStore.set(THEME_COOKIE_NAME, serializeThemeCookieValue(parsed.data.theme), {
    path: "/",
    maxAge: cookieAge,
    sameSite: "lax",
  });
  cookieStore.set("jalmaps-text-size", parsed.data.text_size, {
    path: "/",
    maxAge: cookieAge,
    sameSite: "lax",
  });

  return { status: "saved" as const };
}
