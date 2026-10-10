import { RolePlaceholderPage } from "@/features/navigation/role-placeholder-page";

export default async function OfficialPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <RolePlaceholderPage locale={locale} role="official" href="/official" />;
}
