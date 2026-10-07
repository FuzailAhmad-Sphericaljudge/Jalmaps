import { RolePlaceholderPage } from "@/features/navigation/role-placeholder-page";

export default async function AdminSubpage({
  params,
}: {
  params: Promise<{ locale: string; path: string[] }>;
}) {
  const { locale, path } = await params;
  return <RolePlaceholderPage locale={locale} role="admin" href={`/admin/${path.join("/")}`} />;
}
