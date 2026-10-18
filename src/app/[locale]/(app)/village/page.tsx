import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getSession } from "@/server/auth";
import { createServerComponentClient } from "@/server/supabase/server-component";
import { getVillageDashboardData } from "@/server/official/village-service";
import { VillageDashboardView } from "@/features/official/VillageDashboardView";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function VillageDashboardPage({ params }: PageProps) {
  const { locale } = await params;
  const session = await getSession();

  if (
    !session ||
    !session.user.role ||
    !["village_admin", "admin", "official"].includes(session.user.role)
  ) {
    redirect(`/${locale}/auth/login`);
  }

  const supabase = await createServerComponentClient();
  const [t, data] = await Promise.all([
    getTranslations({ locale, namespace: "official" }),
    getVillageDashboardData(supabase, locale),
  ]);

  if (!data) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-12 text-center">
        <h1 className="text-xl font-bold text-foreground">{t("village.title")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("needsAttention.empty")}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-6">
      <VillageDashboardView data={data} locale={locale} />
    </div>
  );
}
