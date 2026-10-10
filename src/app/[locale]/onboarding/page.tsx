import { notFound } from "next/navigation";

import { headers } from "next/headers";

import { isAppLocale, localeMetadata } from "@/i18n/config";
import { redirect } from "@/i18n/navigation";
import { createServerComponentClient } from "@/server/supabase/server-component";
import { requireAuthenticatedUser } from "@/server/auth";

import { OnboardingWizard } from "./onboarding-wizard";

export default async function OnboardingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: requestedLocale } = await params;
  if (!isAppLocale(requestedLocale)) notFound();
  const locale = requestedLocale;
  const current = await requireAuthenticatedUser(locale);
  if (current.profile?.onboarding_completed_at) {
    redirect({ href: "/", locale });
  }

  const supabase = await createServerComponentClient();
  const { data: states, error } = await supabase
    .from("admin_areas")
    .select("id,parent_id,level,names")
    .eq("level", "state")
    .order("code");
  if (error) throw error;

  const preferredLocale = current.profile?.preferred_locale;
  const reqHeaders = await headers();
  const region = reqHeaders.get("x-vercel-ip-country-region");

  let suggestedLocale = isAppLocale(preferredLocale) ? preferredLocale : locale;
  if (!current.profile?.preferred_locale && region) {
    const match = Object.values(localeMetadata).find((meta) => meta.defaultStates.includes(region));
    if (match) {
      suggestedLocale = match.code;
    }
  }

  return <OnboardingWizard locale={locale} states={states} initialLocale={suggestedLocale} />;
}
