import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { createServerComponentClient } from "@/server/supabase/server-component";
import { PageContainer, PageHeader } from "@/components/layout/page-scaffolding";
import { ProtectedAppShell } from "@/components/layout/protected-app-shell";
import { HistoryChart } from "@/components/jalmaps/HistoryChart";
import { requireRole } from "@/server/auth";
import { isAppLocale } from "@/i18n/config";

export default async function HistoryPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id, locale } = await params;
  if (!isAppLocale(locale)) notFound();

  const current = await requireRole(locale, "farmer");
  const t = await getTranslations("history");
  const supabase = await createServerComponentClient();

  const { data: well, error } = await supabase
    .from("wells")
    .select("name, id")
    .eq("id", id)
    .single();

  if (error || !well) {
    notFound();
  }

  return (
    <ProtectedAppShell locale={locale} current={current}>
      <PageContainer>
        <PageHeader title={t("title", { name: well.name })} />
        <div className="mt-6 flex flex-col gap-4">
          <HistoryChart wellId={id} />
        </div>
      </PageContainer>
    </ProtectedAppShell>
  );
}
