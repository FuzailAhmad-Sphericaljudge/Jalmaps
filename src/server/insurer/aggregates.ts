import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/db/types";

export interface InsurerVillageStatsResult {
  area_id: string;
  consenting_wells_count: number;
  privacy_masked: boolean;
  privacy_reason: string | null;
  avg_depth_m: number | null;
  median_depth_m: number | null;
  pct_critical: number | null;
  pct_warning: number | null;
  pct_offline: number | null;
  nodes_online: number | null;
  as_of: string;
}

export interface InsurerTimeseriesBucket {
  bucket_ts: string;
  consenting_wells_count: number;
  privacy_masked: boolean;
  avg_depth_m: number | null;
  median_depth_m: number | null;
}

/**
 * Fetches village-level groundwater stats strictly from consenting farmers.
 * If fewer than `minWells` consenting farmers exist, metrics are privacy-masked.
 */
export async function fetchInsurerVillageStats(
  client: SupabaseClient<Database>,
  areaId: string,
  minWells = 3,
): Promise<InsurerVillageStatsResult> {
  const { data, error } = await client.rpc("get_insurer_village_stats", {
    p_area_id: areaId,
    p_min_wells: minWells,
  });

  if (error) {
    throw new Error(`Failed to fetch insurer village stats: ${error.message}`);
  }

  const row = (data as unknown as InsurerVillageStatsResult[])?.[0];
  if (!row) {
    return {
      area_id: areaId,
      consenting_wells_count: 0,
      privacy_masked: true,
      privacy_reason: "no_data_available",
      avg_depth_m: null,
      median_depth_m: null,
      pct_critical: null,
      pct_warning: null,
      pct_offline: null,
      nodes_online: null,
      as_of: new Date().toISOString(),
    };
  }

  return row;
}

/**
 * Fetches bucketed timeseries metrics for a village, masking buckets where fewer
 * than `minWells` consenting wells reported data.
 */
export async function fetchInsurerVillageTimeseries(
  client: SupabaseClient<Database>,
  params: {
    areaId: string;
    startDate: string;
    endDate: string;
    bucket?: "day" | "week" | "month";
    minWells?: number;
  },
): Promise<InsurerTimeseriesBucket[]> {
  const { data, error } = await client.rpc("get_insurer_village_timeseries", {
    p_area_id: params.areaId,
    p_start_date: params.startDate,
    p_end_date: params.endDate,
    p_bucket: params.bucket ?? "day",
    p_min_wells: params.minWells ?? 3,
  });

  if (error) {
    throw new Error(`Failed to fetch insurer village timeseries: ${error.message}`);
  }

  return (data as unknown as InsurerTimeseriesBucket[]) ?? [];
}
