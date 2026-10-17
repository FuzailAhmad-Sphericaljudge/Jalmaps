import { RolePlaceholderPage } from "@/features/navigation/role-placeholder-page";

export default async function InsurerSubpage({
  params,
}: {
  params: Promise<{ locale: string; path: string[] }>;
}) {
  const { locale, path } = await params;
  return <RolePlaceholderPage locale={locale} role="insurer" href={`/insurer/${path.join("/")}`} />;
}
