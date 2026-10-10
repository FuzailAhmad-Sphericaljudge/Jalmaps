import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

import type { AppLocale } from "@/i18n/config";
import type { Database } from "@/lib/db/types";
import { createServerComponentClient } from "@/server/supabase/server-component";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type UserRole = Database["public"]["Enums"]["user_role"];

export type AuthenticatedUser = {
  user: User;
  profile: Profile | null;
};

export async function getSession() {
  const supabase = await createServerComponentClient();
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    throw error;
  }
  return data.session;
}

export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  const supabase = await createServerComponentClient();
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    throw sessionError;
  }
  if (!sessionData.session) {
    return null;
  }

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) {
    throw userError;
  }
  if (!userData.user) {
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userData.user.id)
    .maybeSingle();
  if (profileError) {
    throw profileError;
  }

  if (profile?.deleted_at) {
    return null;
  }

  return { user: userData.user, profile };
}

export async function requireAuthenticatedUser(locale: AppLocale): Promise<AuthenticatedUser> {
  const current = await getCurrentUser();
  if (!current) {
    redirect(`/${locale}/login`);
  }
  return current;
}

export async function requireUser(
  locale: AppLocale,
): Promise<AuthenticatedUser & { profile: Profile }> {
  const current = await requireAuthenticatedUser(locale);
  if (!current.profile || !current.profile.onboarding_completed_at) {
    redirect(`/${locale}/onboarding`);
  }
  return { ...current, profile: current.profile };
}

export async function requireRole(
  locale: AppLocale,
  ...roles: UserRole[]
): Promise<AuthenticatedUser & { profile: Profile }> {
  const current = await requireUser(locale);
  if (!roles.includes(current.profile.role)) {
    redirect(`/${locale}/403`);
  }
  return current;
}
