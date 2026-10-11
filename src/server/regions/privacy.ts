export const MIN_PRIVACY_SAMPLE_SIZE = 3;

export interface RegionStats {
  wells_count: number;
  nodes_online: number;
  avg_depth_m: number | null;
  median_depth_m: number | null;
  pct_critical: number;
  pct_warning: number;
  pct_offline: number;
  avg_change_30d_m: number;
  worst_well_id?: string | null;
  [key: string]: unknown;
}

export interface MaskedRegionStats<T extends RegionStats = RegionStats> {
  stats: T;
  isPrivacySuppressed: boolean;
  minSampleSize: number;
}

/**
 * Enforces k-anonymity / privacy thresholds for aggregated groundwater statistics.
 * If wells_count < MIN_PRIVACY_SAMPLE_SIZE and the viewer is not an admin,
 * depth metrics and individual worst wells are masked to protect individual well owners.
 */
export function applyPrivacyThreshold<T extends RegionStats>(
  stats: T,
  hasBypassPermission = false,
): MaskedRegionStats<T> {
  const isPrivacySuppressed = !hasBypassPermission && stats.wells_count < MIN_PRIVACY_SAMPLE_SIZE;

  if (isPrivacySuppressed) {
    return {
      stats: {
        ...stats,
        avg_depth_m: null,
        median_depth_m: null,
        pct_critical: 0,
        pct_warning: 0,
        pct_offline: 0,
        avg_change_30d_m: 0,
        worst_well_id: null,
      },
      isPrivacySuppressed: true,
      minSampleSize: MIN_PRIVACY_SAMPLE_SIZE,
    };
  }

  return {
    stats,
    isPrivacySuppressed: false,
    minSampleSize: MIN_PRIVACY_SAMPLE_SIZE,
  };
}
