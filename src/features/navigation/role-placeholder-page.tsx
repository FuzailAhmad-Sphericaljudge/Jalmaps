import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { EmptyState } from "@/components/jalmaps/state-components";
import { PageContainer, PageHeader } from "@/components/layout/page-scaffolding";
import { ProtectedAppShell } from "@/components/layout/protected-app-shell";
import { getNavItems } from "@/features/navigation/nav-config";
import { isAppLocale } from "@/i18n/config";
import type { UserRole } from "@/server/auth";
import { requireRole } from "@/server/auth";

export async function RolePlaceholderPage({
  locale,
  role,
  href,
}: {
  locale: string;
  role: UserRole;
  href: string;
}) {
  if (!isAppLocale(locale)) notFound();
  const current = await requireRole(locale, role);

  const item = getNavItems(role)
    .filter((candidate) => href === candidate.href || href.startsWith(`${candidate.href}/`))
    .sort((left, right) => right.href.length - left.href.length)[0];
  const activeItem =
    item ??
    getNavItems(role).find((candidate) => candidate.href.split("/").filter(Boolean).length === 1);
  if (!activeItem) notFound();

  const t = await getTranslations({ locale, namespace: "shell" });
  const title = t(`nav.${activeItem.labelKey}`);

  return (
    <ProtectedAppShell locale={locale} current={current}>
      <PageContainer>
        <PageHeader title={title} />
        <EmptyState
          title={t("empty.title")}
          description={t("empty.description", { section: title })}
        />
      </PageContainer>
    </ProtectedAppShell>
  );
}
