import { MapViewPage } from "@/features/map/map-view-page";

export default async function OfficialMapPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <MapViewPage locale={locale} role="official" />;
}
