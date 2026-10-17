import type { SupabaseClient } from "@supabase/supabase-js";
import {
  calculateVillageStressScore,
  type StressReasonChip,
  type StressSeverity,
} from "@/lib/official/stress-score";
import { applyPrivacyThreshold } from "../regions/privacy";
import type { AreaNoteRecord } from "./notes";

export interface OfficialKpiStrip {
  wellsMonitored: number;
  nodesOnlinePct: number;
  villagesCriticalPct: number;
  avgChange30dM: number | null;
  openCriticalAlerts: number;
  dataFreshness: string | null;
}

export interface NeedsAttentionVillage {
  id: string;
  code: string;
  name: string;
  parentName?: string;
  wellsCount: number;
  nodesOnline: number;
  pctCritical: number;
  pctOffline: number;
  avgDepthM: number | null;
  avgChange30dM: number | null;
  stressScore: number;
  severity: StressSeverity;
  reasonChips: StressReasonChip[];
  isPrivacySuppressed: boolean;
}

export interface OfficialAlertItem {
  id: string;
  wellId: string;
  wellName: string;
  areaId: string;
  areaName: string;
  severity: "critical" | "warning" | "info";
  status: "open" | "acknowledged" | "resolved";
  messageKey: string;
  triggeredAt: string;
}

export interface OfficialTrendPoint {
  date: string;
  avgDepthM: number | null;
  lastYearAvgDepthM?: number | null;
}

export interface AllowedAreaItem {
  id: string;
  code: string;
  name: string;
  level: "state" | "district" | "block" | "village";
  parentId: string | null;
}

export interface OfficialDashboardData {
  selectedArea: AllowedAreaItem | null;
  allowedAreas: AllowedAreaItem[];
  kpis: OfficialKpiStrip;
  needsAttentionVillages: NeedsAttentionVillage[];
  alerts: OfficialAlertItem[];
  trendHistory: OfficialTrendPoint[];
  notes: AreaNoteRecord[];
  subRegionsGeo: Array<{
    id: string;
    code: string;
    name: string;
    level: string;
    stats: {
      wells_count: number;
      nodes_online: number;
      pct_critical: number;
      pct_offline: number;
      avg_depth_m: number | null;
    };
    isPrivacySuppressed: boolean;
    simplified_geojson?: unknown;
  }>;
  caveats: {
    offlineSensorsCount: number;
    offlineSensorsPct: number;
    privacySuppressedCount: number;
  };
}

export interface FetchDashboardOptions {
  areaId?: string;
  preset?: "7d" | "30d" | "90d" | "1y";
  locale?: string;
}

export async function getOfficialDashboardData(
  supabase: SupabaseClient,
  options: FetchDashboardOptions = {},
): Promise<OfficialDashboardData> {
  const { areaId, preset = "30d", locale = "en" } = options;

  // 1. Fetch accessible admin_areas
  const { data: areasData, error: areasError } = await supabase
    .from("admin_areas")
    .select("id, code, level, names, parent_id")
    .order("level", { ascending: true })
    .order("code", { ascending: true });

  if (areasError || !areasData) {
    throw new Error(`Failed to load admin areas: ${areasError?.message}`);
  }

  const allowedAreas: AllowedAreaItem[] = areasData.map((a) => {
    const names = (a.names as Record<string, string>) || {};
    return {
      id: a.id,
      code: a.code,
      name: names[locale] || names.en || a.code,
      level: a.level as AllowedAreaItem["level"],
      parentId: a.parent_id,
    };
  });

  const selectedArea = areaId
    ? allowedAreas.find((a) => a.id === areaId) || allowedAreas[0] || null
    : allowedAreas[0] || null;

  const currentAreaId = selectedArea?.id;

  // 2. Fetch area_stats for all areas
  const { data: statsRows } = await supabase.from("area_stats").select(`
      area_id,
      as_of,
      wells_count,
      nodes_online,
      avg_depth_m,
      median_depth_m,
      pct_critical,
      pct_warning,
      pct_offline,
      avg_change_30d_m,
      worst_well_id
    `);

  type AreaStatRecord = NonNullable<typeof statsRows>[number];
  const statsMap = new Map<string, AreaStatRecord>();
  (statsRows || []).forEach((row) => {
    statsMap.set(row.area_id, row);
  });

  // 3. Open critical alerts count & alert feed
  const { data: alertsData } = await supabase
    .from("alerts")
    .select(
      `
      id,
      severity,
      status,
      message_key,
      triggered_at,
      well_id,
      admin_area_id,
      wells (
        name,
        admin_area_id
      )
    `,
    )
    .in("status", ["open", "acknowledged"])
    .order("triggered_at", { ascending: false })
    .limit(50);

  // Group alerts by area
  const areaAlertsCount = new Map<string, number>();
  let totalOpenCritical = 0;

  const feedAlerts: OfficialAlertItem[] = [];
  (alertsData || []).forEach((a) => {
    const wellInfo = (Array.isArray(a.wells) ? a.wells[0] : a.wells) as
      { name: string; admin_area_id: string | null } | null | undefined;
    const areaIdForAlert = a.admin_area_id || wellInfo?.admin_area_id || "";
    if (a.severity === "critical" && a.status === "open") {
      totalOpenCritical++;
      if (areaIdForAlert) {
        areaAlertsCount.set(areaIdForAlert, (areaAlertsCount.get(areaIdForAlert) || 0) + 1);
      }
    }

    const matchedArea = allowedAreas.find((ar) => ar.id === areaIdForAlert);
    feedAlerts.push({
      id: a.id,
      wellId: a.well_id || "",
      wellName: wellInfo?.name || "Well",
      areaId: areaIdForAlert,
      areaName: matchedArea?.name || "Village",
      severity: a.severity as "critical" | "warning" | "info",
      status: a.status as "open" | "acknowledged" | "resolved",
      messageKey: a.message_key,
      triggeredAt: a.triggered_at,
    });
  });

  // 4. Compute KPIs
  const currentAreaStat = currentAreaId ? statsMap.get(currentAreaId) : null;
  const allVillages = areasData.filter((a) => a.level === "village");

  let wellsMonitored = 0;
  let onlineNodes = 0;
  let criticalVillagesCount = 0;
  let totalVillagesEvaluated = 0;
  let freshnessDate: string | null = null;

  if (currentAreaStat) {
    wellsMonitored = currentAreaStat.wells_count;
    onlineNodes = currentAreaStat.nodes_online;
    freshnessDate = currentAreaStat.as_of;
  } else {
    statsMap.forEach((stat) => {
      wellsMonitored += stat.wells_count;
      onlineNodes += stat.nodes_online;
      if (!freshnessDate || (stat.as_of && new Date(stat.as_of) > new Date(freshnessDate))) {
        freshnessDate = stat.as_of;
      }
    });
  }

  // 5. Build Needs Attention Villages list
  const attentionList: NeedsAttentionVillage[] = [];
  let privacySuppressedVillagesCount = 0;

  for (const v of allVillages) {
    // If selectedArea is district or block, filter to child villages
    if (selectedArea && selectedArea.level !== "state") {
      if (selectedArea.level === "village" && v.id !== selectedArea.id) {
        continue;
      }
      if (selectedArea.level === "block" && v.parent_id !== selectedArea.id) {
        continue;
      }
      // If selectedArea is district, check if v's parent block has parent_id == district
      if (selectedArea.level === "district") {
        const parentBlock = areasData.find((b) => b.id === v.parent_id);
        if (parentBlock?.parent_id !== selectedArea.id) {
          continue;
        }
      }
    }

    totalVillagesEvaluated++;
    const vStat = statsMap.get(v.id);
    const masked = applyPrivacyThreshold({
      wells_count: vStat?.wells_count || 0,
      nodes_online: vStat?.nodes_online || 0,
      avg_depth_m: vStat?.avg_depth_m ?? null,
      median_depth_m: vStat?.median_depth_m ?? null,
      pct_critical: vStat?.pct_critical || 0,
      pct_warning: vStat?.pct_warning || 0,
      pct_offline: vStat?.pct_offline || 0,
      avg_change_30d_m: vStat?.avg_change_30d_m || 0,
      worst_well_id: vStat?.worst_well_id ?? null,
    });

    if (masked.isPrivacySuppressed) {
      privacySuppressedVillagesCount++;
    }

    if (vStat && vStat.pct_critical >= 30) {
      criticalVillagesCount++;
    }

    const openCrit = areaAlertsCount.get(v.id) || 0;
    const vNames = (v.names as Record<string, string>) || {};
    const parentArea = areasData.find((p) => p.id === v.parent_id);
    const parentNames = (parentArea?.names as Record<string, string>) || {};

    const stress = calculateVillageStressScore({
      wellsCount: vStat?.wells_count || 0,
      nodesOnline: vStat?.nodes_online || 0,
      pctCritical: vStat?.pct_critical || 0,
      pctWarning: vStat?.pct_warning || 0,
      pctOffline: vStat?.pct_offline || 0,
      avgChange30dM: vStat?.avg_change_30d_m ?? null,
      openCriticalAlerts: openCrit,
      aquiferHealthScore: null,
      isPrivacySuppressed: masked.isPrivacySuppressed,
    });

    attentionList.push({
      id: v.id,
      code: v.code,
      name: vNames[locale] || vNames.en || v.code,
      parentName: parentNames[locale] || parentNames.en || parentArea?.code,
      wellsCount: vStat?.wells_count || 0,
      nodesOnline: vStat?.nodes_online || 0,
      pctCritical: masked.isPrivacySuppressed ? 0 : vStat?.pct_critical || 0,
      pctOffline: masked.isPrivacySuppressed ? 0 : vStat?.pct_offline || 0,
      avgDepthM: masked.isPrivacySuppressed ? null : (vStat?.avg_depth_m ?? null),
      avgChange30dM: masked.isPrivacySuppressed ? null : (vStat?.avg_change_30d_m ?? null),
      stressScore: stress.score,
      severity: stress.severity,
      reasonChips: stress.reasonChips,
      isPrivacySuppressed: masked.isPrivacySuppressed,
    });
  }

  // Sort villages by stress score descending
  attentionList.sort((a, b) => b.stressScore - a.stressScore);

  const nodesOnlinePct =
    wellsMonitored > 0 ? Math.round((onlineNodes / wellsMonitored) * 100) : 100;
  const villagesCriticalPct =
    totalVillagesEvaluated > 0
      ? Math.round((criticalVillagesCount / totalVillagesEvaluated) * 100)
      : 0;

  const kpis: OfficialKpiStrip = {
    wellsMonitored,
    nodesOnlinePct,
    villagesCriticalPct,
    avgChange30dM: currentAreaStat?.avg_change_30d_m ?? null,
    openCriticalAlerts: totalOpenCritical,
    dataFreshness: freshnessDate,
  };

  // 6. Sub-regions for Choropleth Map (children of selected area)
  let subAreas = areasData.filter((a) => {
    if (!currentAreaId) return a.level === "district";
    return a.parent_id === currentAreaId;
  });

  if (subAreas.length === 0 && currentAreaId) {
    // If no children (e.g. at village level), show current area itself
    const curr = areasData.find((a) => a.id === currentAreaId);
    if (curr) subAreas = [curr];
  }

  const subRegionsGeo = subAreas.map((sub) => {
    const sStat = statsMap.get(sub.id);
    const masked = applyPrivacyThreshold({
      wells_count: sStat?.wells_count || 0,
      nodes_online: sStat?.nodes_online || 0,
      avg_depth_m: sStat?.avg_depth_m ?? null,
      median_depth_m: sStat?.median_depth_m ?? null,
      pct_critical: sStat?.pct_critical || 0,
      pct_warning: sStat?.pct_warning || 0,
      pct_offline: sStat?.pct_offline || 0,
      avg_change_30d_m: sStat?.avg_change_30d_m || 0,
      worst_well_id: sStat?.worst_well_id ?? null,
    });

    const sNames = (sub.names as Record<string, string>) || {};
    return {
      id: sub.id,
      code: sub.code,
      name: sNames[locale] || sNames.en || sub.code,
      level: sub.level,
      stats: {
        wells_count: sStat?.wells_count || 0,
        nodes_online: sStat?.nodes_online || 0,
        pct_critical: masked.isPrivacySuppressed ? 0 : sStat?.pct_critical || 0,
        pct_offline: masked.isPrivacySuppressed ? 0 : sStat?.pct_offline || 0,
        avg_depth_m: masked.isPrivacySuppressed ? null : (sStat?.avg_depth_m ?? null),
      },
      isPrivacySuppressed: masked.isPrivacySuppressed,
    };
  });

  // 7. Trend History & YoY comparison
  let daysLimit = 30;
  if (preset === "7d") daysLimit = 7;
  if (preset === "90d") daysLimit = 90;
  if (preset === "1y") daysLimit = 365;

  let trendQuery = supabase
    .from("area_stats_daily")
    .select("recorded_date, avg_depth_m, wells_count")
    .order("recorded_date", { ascending: true })
    .limit(daysLimit);

  if (currentAreaId) {
    trendQuery = trendQuery.eq("area_id", currentAreaId);
  }

  const { data: trendData } = await trendQuery;

  const trendHistory: OfficialTrendPoint[] = (trendData || []).map((row) => ({
    date: row.recorded_date,
    avgDepthM: row.wells_count < 3 ? null : row.avg_depth_m,
  }));

  // 8. Follow-up Notes
  let notesQuery = supabase
    .from("area_notes")
    .select("id, area_id, author_id, text, status, due_date, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (currentAreaId) {
    notesQuery = notesQuery.eq("area_id", currentAreaId);
  }

  const { data: notesData } = await notesQuery;
  const notes = (notesData || []) as AreaNoteRecord[];

  const offlineSensorsCount = Math.max(0, wellsMonitored - onlineNodes);
  const offlineSensorsPct =
    wellsMonitored > 0 ? Math.round((offlineSensorsCount / wellsMonitored) * 100) : 0;

  return {
    selectedArea,
    allowedAreas,
    kpis,
    needsAttentionVillages: attentionList,
    alerts: feedAlerts,
    trendHistory,
    notes,
    subRegionsGeo,
    caveats: {
      offlineSensorsCount,
      offlineSensorsPct,
      privacySuppressedCount: privacySuppressedVillagesCount,
    },
  };
}
