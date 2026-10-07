import { RolePlaceholderPage } from "@/features/navigation/role-placeholder-page";

export default async function FarmerPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <RolePlaceholderPage locale={locale} role="farmer" href="/farmer" />;
}
