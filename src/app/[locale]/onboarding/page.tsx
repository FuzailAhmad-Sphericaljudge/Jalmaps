import { notFound } from "next/navigation";

import { isAppLocale } from "@/i18n/config";
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
  return (
    <OnboardingWizard
      locale={locale}
      states={states}
      initialLocale={isAppLocale(preferredLocale) ? preferredLocale : locale}
    />
  );
}
