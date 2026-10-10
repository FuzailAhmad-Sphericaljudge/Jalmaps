import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Plus } from "lucide-react";

import { EmptyState } from "@/components/jalmaps/state-components";
import { PageContainer, PageHeader } from "@/components/layout/page-scaffolding";
import { ProtectedAppShell } from "@/components/layout/protected-app-shell";
import { isAppLocale } from "@/i18n/config";
import { requireRole } from "@/server/auth";
import { createServerComponentClient } from "@/server/supabase/server-component";
import { listWellsForUser } from "@/server/db/wells";
import { WellList } from "@/features/wells/well-list";
import { Button } from "@/components/ui/button";
import { notFound } from "next/navigation";

export default async function FarmerWellsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isAppLocale(locale)) notFound();

  const current = await requireRole(locale, "farmer");
  const t = await getTranslations({ locale, namespace: "wells" });

  const client = await createServerComponentClient();
  const wells = await listWellsForUser(client, current.profile.id);

  return (
    <ProtectedAppShell locale={locale} current={current}>
      <PageContainer>
        <PageHeader
          title={t("title")}
          actions={
            <Button asChild size="touch" className="min-h-12">
              <Link href={`/${locale}/app/farmer/wells/new`}>
                <Plus aria-hidden className="size-5" />
                {t("newWell")}
              </Link>
            </Button>
          }
        />
        {wells.length === 0 ? (
          <EmptyState
            title={t("emptyTitle")}
            description={t("emptyDescription")}
            action={{
              label: t("addWell"),
              onClick: undefined as unknown as () => void,
            }}
          />
        ) : (
          <WellList wells={wells} locale={locale} />
        )}
      </PageContainer>
    </ProtectedAppShell>
  );
}
