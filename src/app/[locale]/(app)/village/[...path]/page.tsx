import { RolePlaceholderPage } from "@/features/navigation/role-placeholder-page";

export default async function VillageSubpage({
  params,
}: {
  params: Promise<{ locale: string; path: string[] }>;
}) {
  const { locale, path } = await params;
  return (
    <RolePlaceholderPage locale={locale} role="village_admin" href={`/village/${path.join("/")}`} />
  );
}
