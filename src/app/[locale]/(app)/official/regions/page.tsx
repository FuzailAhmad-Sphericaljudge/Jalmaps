import { redirect } from "next/navigation";
import { getSession } from "@/server/auth";
import { createServerComponentClient } from "@/server/supabase/server-component";
import { listRegions } from "@/server/regions/service";
import { RegionsOverviewView } from "@/features/regions/RegionsOverviewView";
import type { RegionStats } from "@/server/regions/privacy";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function OfficialRegionsPage({ params }: PageProps) {
  const { locale } = await params;
  const session = await getSession();

  if (!session || !session.user.role || !["official", "admin"].includes(session.user.role)) {
    redirect(`/${locale}/auth/login`);
  }

  const supabase = await createServerComponentClient();
  const regions = await listRegions(supabase, {
    level: "state",
    locale,
    bypassPrivacy: session.user.role === "admin",
  });

  // Calculate overall summary metrics
  const totalWells = regions.reduce((acc, r) => acc + r.stats.wells_count, 0);
  const totalNodesOnline = regions.reduce((acc, r) => acc + r.stats.nodes_online, 0);

  const weightedDepthSum = regions.reduce((acc, r) => {
    if (r.stats.avg_depth_m !== null) {
      return acc + r.stats.avg_depth_m * r.stats.wells_count;
    }
    return acc;
  }, 0);

  const weightedCriticalSum = regions.reduce((acc, r) => {
    return acc + (r.stats.pct_critical ?? 0) * r.stats.wells_count;
  }, 0);

  const overallStats: RegionStats = {
    wells_count: totalWells,
    nodes_online: totalNodesOnline,
    avg_depth_m: totalWells > 0 ? weightedDepthSum / totalWells : null,
    median_depth_m: null,
    pct_critical: totalWells > 0 ? weightedCriticalSum / totalWells : 0,
    pct_warning: 0,
    pct_offline: 0,
    avg_change_30d_m: 0,
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <RegionsOverviewView locale={locale} regions={regions} overallStats={overallStats} />
    </div>
  );
}
