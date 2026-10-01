"use server";

import { redirect } from "next/navigation";

import { isAppLocale } from "@/i18n/config";
import { profileUpdateSchema } from "@/lib/schemas/account";
import { requireAuthenticatedUser, requireUser } from "@/server/auth";
import { createRouteHandlerClient } from "@/server/supabase/route-handler";
import { createServerComponentClient } from "@/server/supabase/server-component";

export async function updateProfile(
  locale: unknown,
  input: unknown,
): Promise<{ status: "saved" | "invalid" }> {
  if (!isAppLocale(locale)) return { status: "invalid" };
  const parsed = profileUpdateSchema.safeParse(input);
  if (!parsed.success) return { status: "invalid" };

  const current = await requireUser(locale);
  const supabase = await createServerComponentClient();
  const { data, error } = await supabase
    .from("profiles")
    .update(parsed.data)
    .eq("id", current.user.id)
    .select("id")
    .single();
  if (error) throw error;
  if (!data) throw new Error("Profile update did not return the updated row.");

  return { status: "saved" };
}

export async function signOut(locale: unknown): Promise<void> {
  if (!isAppLocale(locale)) {
    throw new Error("Unsupported locale.");
  }
  await requireAuthenticatedUser(locale);

  const supabase = await createRouteHandlerClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw error;

  redirect(`/${locale}/login`);
}
