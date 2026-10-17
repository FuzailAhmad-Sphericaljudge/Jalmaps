import type { SupabaseClient } from "@supabase/supabase-js";
import { applyPrivacyThreshold, type RegionStats } from "./privacy";
import {
  type RankedRegionItem,
  type RegionSortDirection,
  type RegionSortKey,
  sortRankedRegions,
} from "./rollups";

export interface ListRegionsOptions {
  level?: "state" | "district" | "block" | "village";
  parentId?: string | null;
  sort?: RegionSortKey;
  order?: RegionSortDirection;
  locale?: string;
  bypassPrivacy?: boolean;
}

export interface RegionDetail {
  id: string;
  code: string;
  level: "state" | "district" | "block" | "village";
  name: string;
  names: Record<string, string>;
  parent_id: string | null;
  stats: RegionStats;
  isPrivacySuppressed: boolean;
  minSampleSize: number;
  breadcrumbs: Array<{ id: string; name: string; level: string }>;
  dailyHistory: Array<{
    recorded_date: string;
    avg_depth_m: number | null;
    pct_critical: number;
    wells_count: number;
  }>;
}

export async function listRegions(
  supabase: SupabaseClient,
  options: ListRegionsOptions = {},
): Promise<RankedRegionItem[]> {
  const {
    level,
    parentId,
    sort = "critical",
    order = "desc",
    locale = "en",
    bypassPrivacy = false,
  } = options;

  let query = supabase.from("admin_areas").select(`
      id,
      code,
      level,
      names,
      parent_id,
      area_stats (
        wells_count,
        nodes_online,
        avg_depth_m,
        median_depth_m,
        pct_critical,
        pct_warning,
        pct_offline,
        avg_change_30d_m,
        worst_well_id
      )
    `);

  if (level) {
    query = query.eq("level", level);
  }

  if (parentId !== undefined) {
    if (parentId === null) {
      query = query.is("parent_id", null);
    } else {
      query = query.eq("parent_id", parentId);
    }
  }

  const { data, error } = await query;
  if (error || !data) {
    throw new Error(`Failed to list regions: ${error?.message}`);
  }

  const items: RankedRegionItem[] = data.map((row) => {
    const rawStats: RegionStats = (Array.isArray(row.area_stats)
      ? row.area_stats[0]
      : row.area_stats) ?? {
      wells_count: 0,
      nodes_online: 0,
      avg_depth_m: null,
      median_depth_m: null,
      pct_critical: 0,
      pct_warning: 0,
      pct_offline: 0,
      avg_change_30d_m: 0,
      worst_well_id: null,
    };

    const masked = applyPrivacyThreshold(rawStats, bypassPrivacy);
    const names = (row.names as Record<string, string>) || {};
    const localizedName = names[locale] || names.en || row.code;

    return {
      id: row.id,
      code: row.code,
      name: localizedName,
      level: row.level as "state" | "district" | "block" | "village",
      stats: masked.stats,
      isPrivacySuppressed: masked.isPrivacySuppressed,
    };
  });

  return sortRankedRegions(items, sort, order, locale);
}

export async function getRegionDetail(
  supabase: SupabaseClient,
  id: string,
  options: { locale?: string; bypassPrivacy?: boolean } = {},
): Promise<RegionDetail | null> {
  const { locale = "en", bypassPrivacy = false } = options;

  const { data: area, error } = await supabase
    .from("admin_areas")
    .select(
      `
      id,
      code,
      level,
      names,
      parent_id,
      area_stats (
        wells_count,
        nodes_online,
        avg_depth_m,
        median_depth_m,
        pct_critical,
        pct_warning,
        pct_offline,
        avg_change_30d_m,
        worst_well_id
      )
    `,
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !area) {
    return null;
  }

  const rawStats: RegionStats = (Array.isArray(area.area_stats)
    ? area.area_stats[0]
    : area.area_stats) ?? {
    wells_count: 0,
    nodes_online: 0,
    avg_depth_m: null,
    median_depth_m: null,
    pct_critical: 0,
    pct_warning: 0,
    pct_offline: 0,
    avg_change_30d_m: 0,
    worst_well_id: null,
  };

  const masked = applyPrivacyThreshold(rawStats, bypassPrivacy);
  const names = (area.names as Record<string, string>) || {};

  // Build breadcrumbs ancestors recursively or upwards
  const breadcrumbs: Array<{ id: string; name: string; level: string }> = [];
  let currentParentId = area.parent_id;

  while (currentParentId) {
    const { data: parent } = await supabase
      .from("admin_areas")
      .select("id, code, level, names, parent_id")
      .eq("id", currentParentId)
      .maybeSingle();

    if (!parent) break;

    const parentNames = (parent.names as Record<string, string>) || {};
    breadcrumbs.unshift({
      id: parent.id,
      name: parentNames[locale] || parentNames.en || parent.code,
      level: parent.level,
    });

    currentParentId = parent.parent_id;
  }

  // Fetch last 30 daily data points
  const { data: dailyData } = await supabase
    .from("area_stats_daily")
    .select("recorded_date, avg_depth_m, pct_critical, wells_count")
    .eq("area_id", id)
    .order("recorded_date", { ascending: true })
    .limit(30);

  const dailyHistory = (dailyData || []).map((row) => ({
    recorded_date: row.recorded_date,
    avg_depth_m: masked.isPrivacySuppressed ? null : row.avg_depth_m,
    pct_critical: masked.isPrivacySuppressed ? 0 : row.pct_critical,
    wells_count: row.wells_count,
  }));

  return {
    id: area.id,
    code: area.code,
    level: area.level as "state" | "district" | "block" | "village",
    name: names[locale] || names.en || area.code,
    names,
    parent_id: area.parent_id,
    stats: masked.stats,
    isPrivacySuppressed: masked.isPrivacySuppressed,
    minSampleSize: masked.minSampleSize,
    breadcrumbs,
    dailyHistory,
  };
}

export function generateRegionsCSV(regions: RankedRegionItem[]): string {
  const headers = [
    "Code",
    "Name",
    "Level",
    "Total Wells",
    "Online Nodes",
    "Avg Depth (m)",
    "Critical (%)",
    "Warning (%)",
    "Offline (%)",
    "30-Day Change (m)",
    "Privacy Suppressed",
  ];

  const rows = regions.map((r) => [
    `"${r.code}"`,
    `"${r.name.replace(/"/g, '""')}"`,
    `"${r.level}"`,
    r.stats.wells_count,
    r.stats.nodes_online,
    r.isPrivacySuppressed || r.stats.avg_depth_m === null ? '""' : r.stats.avg_depth_m,
    r.isPrivacySuppressed ? '""' : r.stats.pct_critical,
    r.isPrivacySuppressed ? '""' : r.stats.pct_warning,
    r.isPrivacySuppressed ? '""' : r.stats.pct_offline,
    r.isPrivacySuppressed ? '""' : r.stats.avg_change_30d_m,
    r.isPrivacySuppressed ? '"yes"' : '"no"',
  ]);

  return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
}
