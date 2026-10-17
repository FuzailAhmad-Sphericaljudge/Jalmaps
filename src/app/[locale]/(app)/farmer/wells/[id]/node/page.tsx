import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { isAppLocale } from "@/i18n/config";
import { requireRole } from "@/server/auth";
import { createServerComponentClient } from "@/server/supabase/server-component";
import { getWell, getWellNode } from "@/server/db/wells";
import { getNodeConnectionState } from "@/lib/wells/status";
import { PageContainer, PageHeader } from "@/components/layout/page-scaffolding";
import { ProtectedAppShell } from "@/components/layout/protected-app-shell";
import { NodeManagement } from "@/features/wells/node-management";

export default async function NodeManagementPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id: wellId } = await params;
  if (!isAppLocale(locale)) notFound();

  const current = await requireRole(locale, "farmer", "admin");
  const t = await getTranslations({ locale, namespace: "wells" });
  const client = await createServerComponentClient();

  let well;
  try {
    well = await getWell(client, wellId);
  } catch {
    notFound();
  }

  // Only the owner or admin can manage nodes
  if (well.owner_id !== current.profile.id && current.profile.role !== "admin") {
    notFound();
  }

  const activeNode = await getWellNode(client, wellId);
  if (!activeNode) notFound();

  const connectionState = getNodeConnectionState(activeNode);

  return (
    <ProtectedAppShell locale={locale} current={current}>
      <PageContainer>
        <PageHeader title={t("node.title")} description={well.name} />
        <NodeManagement
          well={{ id: well.id, owner_id: well.owner_id ?? "" }}
          activeNode={activeNode}
          connectionState={connectionState}
          locale={locale}
        />
      </PageContainer>
    </ProtectedAppShell>
  );
}
