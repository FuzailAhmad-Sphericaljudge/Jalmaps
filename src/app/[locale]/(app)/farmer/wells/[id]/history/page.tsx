import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { createServerClient } from "@/server/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { HistoryChart } from "@/components/jalmaps/HistoryChart";

export default async function HistoryPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id, locale } = await params;
  const t = await getTranslations("history");
  const supabase = await createServerClient();

  const { data: well, error } = await supabase.from("wells").select("name").eq("id", id).single();

  if (error || !well) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <PageHeader
        title={t("title", { name: well.name })}
        backHref={`/${locale}/app/farmer/wells/${id}`}
      />
      <div className="flex flex-col gap-4">
        <HistoryChart wellId={id} />
      </div>
    </div>
  );
}
