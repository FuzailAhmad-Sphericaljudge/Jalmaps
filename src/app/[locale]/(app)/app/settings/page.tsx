import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { PageContainer, PageHeader, Section } from "@/components/layout/page-scaffolding";
import { ProtectedAppShell } from "@/components/layout/protected-app-shell";
import { isAppLocale } from "@/i18n/config";
import { settingsSchema } from "@/lib/schemas/settings";
import { requireUser } from "@/server/auth";
import { parseThemeCookieValue, THEME_COOKIE_NAME } from "@/server/theme";

import { NotificationPreferences } from "@/features/notifications/components/preferences";
import { DeliveryHistory } from "@/features/notifications/components/delivery-history";
import { SettingsForm } from "./settings-form";
import { createClient } from "@/server/supabase";

export default async function SettingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: requestedLocale } = await params;
  if (!isAppLocale(requestedLocale)) notFound();
  const locale = requestedLocale;
  const current = await requireUser(locale);
  const supabase = createClient();
  const [t, cookieStore, channelsRes, prefsRes, historyRes] = await Promise.all([
    getTranslations({ locale, namespace: "settings" }),
    cookies(),
    supabase.from("user_notification_channels").select("*").eq("user_id", current.user.id),
    supabase.from("user_notification_prefs").select("*").eq("user_id", current.user.id).single(),
    supabase
      .from("notification_outbox")
      .select("*")
      .eq("user_id", current.user.id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);
  const textSize = settingsSchema.shape.text_size.safeParse(current.profile.preferred_text_size);
  const preferredLocale = isAppLocale(current.profile.preferred_locale)
    ? current.profile.preferred_locale
    : locale;

  return (
    <ProtectedAppShell locale={locale} current={current}>
      <PageContainer>
        <PageHeader title={t("title")} description={t("description")} />
        <Section title={t("title")} className="max-w-4xl">
          <div className="rounded-xl border border-border bg-card p-5 sm:p-7">
            <SettingsForm
              locale={locale}
              initialLocale={preferredLocale}
              initialUnit={current.profile.preferred_unit}
              initialTextSize={textSize.success ? textSize.data : "normal"}
              initialTheme={
                settingsSchema.shape.theme.safeParse(current.profile.preferred_theme).data ??
                parseThemeCookieValue(cookieStore.get(THEME_COOKIE_NAME)?.value)
              }
            />
          </div>
        </Section>
        <Section title="Notifications" className="mt-8 max-w-4xl">
          <div className="space-y-8 rounded-xl border border-border bg-card p-5 sm:p-7">
            <NotificationPreferences
              initialPrefs={prefsRes.data || {}}
              initialChannels={channelsRes.data || []}
            />
            <DeliveryHistory history={historyRes.data || []} />
          </div>
        </Section>
      </PageContainer>
    </ProtectedAppShell>
  );
}
