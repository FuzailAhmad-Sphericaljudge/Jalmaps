import type { SupabaseClient } from "@supabase/supabase-js";
import type { AreaNoteRecord } from "./notes";

export interface VillageWellItem {
  id: string;
  name: string;
  wellType: string;
  status: string;
  totalDepthM: number | null;
  lastReadingAt: string | null;
  depthToWaterM: number | null;
  quality: string | null;
  nodeStatus: string | null;
}

export interface VillageDashboardData {
  villageName: string;
  villageCode: string;
  areaId: string;
  stats: {
    wellsCount: number;
    nodesOnline: number;
    pctCritical: number;
    pctOffline: number;
    avgDepthM: number | null;
    avgChange30dM: number | null;
  };
  wells: VillageWellItem[];
  alerts: Array<{
    id: string;
    wellId: string;
    wellName: string;
    severity: "critical" | "warning" | "info";
    status: string;
    messageKey: string;
    triggeredAt: string;
  }>;
  notes: AreaNoteRecord[];
}

export async function getVillageDashboardData(
  supabase: SupabaseClient,
  locale: string = "en",
): Promise<VillageDashboardData | null> {
  // 1. Get user and their assigned village area
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Query user's admin area memberships
  const { data: userAreas } = await supabase
    .from("user_admin_areas")
    .select("area_id")
    .eq("user_id", user.id);

  let targetAreaId = userAreas?.[0]?.area_id;

  // Fallback: If not in user_admin_areas, pick first village from admin_areas
  if (!targetAreaId) {
    const { data: firstVillage } = await supabase
      .from("admin_areas")
      .select("id")
      .eq("level", "village")
      .limit(1)
      .maybeSingle();

    targetAreaId = firstVillage?.id;
  }

  if (!targetAreaId) return null;

  // 2. Fetch area details
  const { data: area } = await supabase
    .from("admin_areas")
    .select("id, code, names, level")
    .eq("id", targetAreaId)
    .single();

  if (!area) return null;

  const names = (area.names as Record<string, string>) || {};
  const villageName = names[locale] || names.en || area.code;

  // 3. Fetch area stats
  const { data: stat } = await supabase
    .from("area_stats")
    .select("*")
    .eq("area_id", targetAreaId)
    .maybeSingle();

  // 4. Fetch wells in this village
  const { data: wellsData } = await supabase
    .from("wells")
    .select("id, name, well_type, status, total_depth_m, nodes (id, status, last_seen_at)")
    .eq("admin_area_id", targetAreaId)
    .order("name", { ascending: true })
    .limit(50);

  // For each well, fetch latest reading if exists
  const wellIds = (wellsData || []).map((w) => w.id);
  const { data: latestReadings } = await supabase
    .from("readings")
    .select("well_id, recorded_at, depth_to_water_m, quality")
    .in("well_id", wellIds.length > 0 ? wellIds : ["00000000-0000-0000-0000-000000000000"])
    .order("recorded_at", { ascending: false });

  const latestReadingMap = new Map<
    string,
    { recorded_at: string; depth_to_water_m: number; quality: string }
  >();
  if (latestReadings) {
    for (const r of latestReadings) {
      if (!latestReadingMap.has(r.well_id)) {
        latestReadingMap.set(r.well_id, r);
      }
    }
  }

  const wells: VillageWellItem[] = (wellsData || []).map((w) => {
    const node = Array.isArray(w.nodes) ? w.nodes[0] : w.nodes;
    const lr = latestReadingMap.get(w.id);
    return {
      id: w.id,
      name: w.name,
      wellType: w.well_type,
      status: w.status,
      totalDepthM: w.total_depth_m,
      lastReadingAt: lr?.recorded_at ?? null,
      depthToWaterM: lr?.depth_to_water_m ?? null,
      quality: lr?.quality ?? null,
      nodeStatus: node?.status ?? null,
    };
  });

  // 5. Fetch alerts for this village
  const { data: alertsData } = await supabase
    .from("alerts")
    .select("id, well_id, severity, status, message_key, triggered_at")
    .eq("status", "open")
    .order("triggered_at", { ascending: false })
    .limit(10);

  const wellNameMap = new Map(wells.map((w) => [w.id, w.name]));
  const alerts = (alertsData || [])
    .filter((a) => wellNameMap.has(a.well_id))
    .map((a) => ({
      id: a.id,
      wellId: a.well_id,
      wellName: wellNameMap.get(a.well_id) || "Well",
      severity: a.severity as "critical" | "warning" | "info",
      status: a.status,
      messageKey: a.message_key,
      triggeredAt: a.triggered_at,
    }));

  // 6. Fetch area notes
  const { data: notesData } = await supabase
    .from("area_notes")
    .select("id, area_id, author_id, text, status, due_date, created_at, updated_at")
    .eq("area_id", targetAreaId)
    .order("created_at", { ascending: false });

  return {
    villageName,
    villageCode: area.code,
    areaId: area.id,
    stats: {
      wellsCount: stat?.wells_count || wells.length,
      nodesOnline: stat?.nodes_online || 0,
      pctCritical: stat?.pct_critical || 0,
      pctOffline: stat?.pct_offline || 0,
      avgDepthM: stat?.avg_depth_m ?? null,
      avgChange30dM: stat?.avg_change_30d_m ?? null,
    },
    wells,
    alerts,
    notes: (notesData || []) as AreaNoteRecord[],
  };
}
