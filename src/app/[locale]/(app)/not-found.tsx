import { getTranslations } from "next-intl/server";

import { EmptyState } from "@/components/jalmaps/state-components";
import { PageContainer, PageHeader } from "@/components/layout/page-scaffolding";

export default async function AppNotFound() {
  const t = await getTranslations("common.notFound");
  return (
    <PageContainer>
      <PageHeader title={t("title")} />
      <EmptyState title={t("title")} description={t("description")} />
    </PageContainer>
  );
}
