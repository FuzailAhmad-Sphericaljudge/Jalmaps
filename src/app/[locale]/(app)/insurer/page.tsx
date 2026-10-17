import { RolePlaceholderPage } from "@/features/navigation/role-placeholder-page";

export default async function InsurerPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <RolePlaceholderPage locale={locale} role="insurer" href="/insurer" />;
}
