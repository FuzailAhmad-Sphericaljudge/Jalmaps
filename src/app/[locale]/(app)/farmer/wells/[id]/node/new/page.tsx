import { requireRole } from "@/server/auth";
import { createServerComponentClient } from "@/server/supabase/server-component";
import { getWell } from "@/server/db/wells";
import { notFound, redirect } from "next/navigation";
import { PageContainer, PageHeader } from "@/components/layout/page-scaffolding";
import { NodeWizard } from "@/features/wells/node-wizard";
import { getTranslations } from "next-intl/server";

export default async function NewNodePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const { user } = await requireRole(locale as "en" | "hi", "farmer");
  const client = await createServerComponentClient();

  const [well, t] = await Promise.all([
    getWell(client, id).catch(() => null),
    getTranslations({ locale, namespace: "wells" }),
  ]);

  if (!well || well.owner_id !== user.id) {
    notFound();
  }

  // If node already exists, redirect to node details (or settings)
  const activeNode = well.nodes?.find(
    (n: Record<string, unknown>) => n.status !== "retired" && n.status !== "fault",
  );
  if (activeNode) {
    redirect(`/${locale}/app/farmer/wells/${id}/node`);
  }

  return (
    <PageContainer>
      <PageHeader title={t("nodeWizard.title")} />
      <div className="py-6">
        <NodeWizard wellId={id} locale={locale} />
      </div>
    </PageContainer>
  );
}
