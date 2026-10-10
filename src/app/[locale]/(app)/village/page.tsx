import { RolePlaceholderPage } from "@/features/navigation/role-placeholder-page";

export default async function VillagePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <RolePlaceholderPage locale={locale} role="village_admin" href="/village" />;
}
