import { MapViewPage } from "@/features/map/map-view-page";

export default async function FarmerMapPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <MapViewPage locale={locale} role="farmer" />;
}
