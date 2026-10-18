import { notFound, redirect } from "next/navigation";
import { getSession } from "@/server/auth";
import { createServerComponentClient } from "@/server/supabase/server-component";
import { getRegionDetail, listRegions } from "@/server/regions/service";
import { RegionDetailView } from "@/features/regions/RegionDetailView";

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

export default async function OfficialRegionDetailPage({ params }: PageProps) {
  const { locale, id } = await params;
  const session = await getSession();

  if (!session || !session.user.role || !["official", "admin"].includes(session.user.role)) {
    redirect(`/${locale}/auth/login`);
  }

  const supabase = await createServerComponentClient();
  const region = await getRegionDetail(supabase, id, {
    locale,
    bypassPrivacy: session.user.role === "admin",
  });

  if (!region) {
    notFound();
  }

  // Get child sub-regions for ranking table / choropleth
  const childRegions = await listRegions(supabase, {
    parentId: region.id,
    locale,
    bypassPrivacy: session.user.role === "admin",
  });

  // Get latest aquifer insights for this region
  const { data: areaInsight } = await supabase
    .from("area_insights")
    .select(
      "wells_count, is_sufficient, avg_health_score, worst_health_score, dominant_health_band, avg_depletion_rate_m_per_year, total_recharge_volume_mcm",
    )
    .eq("area_id", region.id)
    .order("as_of", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <RegionDetailView
        locale={locale}
        region={region}
        childRegions={childRegions}
        areaInsight={areaInsight}
      />
    </div>
  );
}
