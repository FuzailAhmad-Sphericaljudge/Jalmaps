import { RolePlaceholderPage } from "@/features/navigation/role-placeholder-page";

export default async function OfficialSubpage({
  params,
}: {
  params: Promise<{ locale: string; path: string[] }>;
}) {
  const { locale, path } = await params;
  return (
    <RolePlaceholderPage locale={locale} role="official" href={`/official/${path.join("/")}`} />
  );
}
