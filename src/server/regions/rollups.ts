import type { RegionStats } from "./privacy";

export interface RankedRegionItem {
  id: string;
  code: string;
  name: string;
  level: "state" | "district" | "block" | "village";
  stats: RegionStats;
  isPrivacySuppressed: boolean;
  simplified_geojson?: Record<string, unknown> | null;
}

export type RegionSortKey = "name" | "wells" | "critical" | "depth" | "change";
export type RegionSortDirection = "asc" | "desc";

/**
 * Sorts regional ranking lists with deterministic tie-breaking.
 * Names use Intl.Collator with the specified or fallback locale.
 */
export function sortRankedRegions(
  regions: RankedRegionItem[],
  sortKey: RegionSortKey = "critical",
  direction: RegionSortDirection = "desc",
  locale = "en",
): RankedRegionItem[] {
  const collator = new Intl.Collator(locale, { sensitivity: "base", numeric: true });
  const multiplier = direction === "asc" ? 1 : -1;

  return [...regions].sort((a, b) => {
    let cmp = 0;

    switch (sortKey) {
      case "name":
        cmp = collator.compare(a.name, b.name);
        break;
      case "wells":
        cmp = a.stats.wells_count - b.stats.wells_count;
        break;
      case "critical":
        cmp = a.stats.pct_critical - b.stats.pct_critical;
        break;
      case "depth": {
        const depthA = a.stats.avg_depth_m ?? (direction === "asc" ? Infinity : -Infinity);
        const depthB = b.stats.avg_depth_m ?? (direction === "asc" ? Infinity : -Infinity);
        cmp = depthA - depthB;
        break;
      }
      case "change":
        cmp = a.stats.avg_change_30d_m - b.stats.avg_change_30d_m;
        break;
    }

    if (cmp !== 0) {
      return cmp * multiplier;
    }

    // Tie-breaker 1: Critical percentage descending
    const critDiff = b.stats.pct_critical - a.stats.pct_critical;
    if (critDiff !== 0) {
      return critDiff;
    }

    // Tie-breaker 2: Name alphabetical via Intl.Collator
    return collator.compare(a.name, b.name);
  });
}

/**
 * Calculates roll-up summary totals for a parent area given its children's stats.
 */
export function calculateParentRollup(childStats: RegionStats[]): RegionStats {
  if (childStats.length === 0) {
    return {
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
  }

  const totalWells = childStats.reduce((sum, s) => sum + s.wells_count, 0);
  const totalNodesOnline = childStats.reduce((sum, s) => sum + s.nodes_online, 0);

  // Weighted average for depth
  let depthWeightedSum = 0;
  let depthWeightCount = 0;
  for (const s of childStats) {
    if (s.avg_depth_m !== null && s.wells_count > 0) {
      depthWeightedSum += s.avg_depth_m * s.wells_count;
      depthWeightCount += s.wells_count;
    }
  }

  const avgDepth =
    depthWeightCount > 0 ? Number((depthWeightedSum / depthWeightCount).toFixed(2)) : null;

  // Weighted average for percentages
  const weightedPct = (key: "pct_critical" | "pct_warning" | "pct_offline") => {
    if (totalWells === 0) return 0;
    const weightedSum = childStats.reduce((sum, s) => sum + s[key] * s.wells_count, 0);
    return Number((weightedSum / totalWells).toFixed(2));
  };

  const avgChange =
    totalWells > 0
      ? Number(
          (
            childStats.reduce((sum, s) => sum + s.avg_change_30d_m * s.wells_count, 0) / totalWells
          ).toFixed(2),
        )
      : 0;

  return {
    wells_count: totalWells,
    nodes_online: totalNodesOnline,
    avg_depth_m: avgDepth,
    median_depth_m: avgDepth,
    pct_critical: weightedPct("pct_critical"),
    pct_warning: weightedPct("pct_warning"),
    pct_offline: weightedPct("pct_offline"),
    avg_change_30d_m: avgChange,
    worst_well_id: null,
  };
}
