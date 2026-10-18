import { MapViewPage } from "@/features/map/map-view-page";

export default async function VillageMapPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <MapViewPage locale={locale} role="village_admin" />;
}
