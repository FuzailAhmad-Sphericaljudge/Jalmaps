import { describe, it, expect, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/db/types";

import { fetchInsurerVillageStats, fetchInsurerVillageTimeseries } from "./aggregates";

describe("fetchInsurerVillageStats", () => {
  it("returns privacy masked statistics when consenting wells count is below threshold", async () => {
    const mockRpc = vi.fn().mockResolvedValue({
      data: [
        {
          area_id: "area-1",
          consenting_wells_count: 2,
          privacy_masked: true,
          privacy_reason: "insufficient_consenting_sample",
          avg_depth_m: null,
          median_depth_m: null,
          pct_critical: null,
          pct_warning: null,
          pct_offline: null,
          nodes_online: null,
          as_of: "2026-10-17T09:00:00Z",
        },
      ],
      error: null,
    });

    const client = { rpc: mockRpc } as unknown as SupabaseClient<Database>;
    const stats = await fetchInsurerVillageStats(client, "area-1", 3);

    expect(stats.privacy_masked).toBe(true);
    expect(stats.consenting_wells_count).toBe(2);
    expect(stats.avg_depth_m).toBeNull();
    expect(mockRpc).toHaveBeenCalledWith("get_insurer_village_stats", {
      p_area_id: "area-1",
      p_min_wells: 3,
    });
  });

  it("returns aggregated metrics when consenting wells count meets threshold", async () => {
    const mockRpc = vi.fn().mockResolvedValue({
      data: [
        {
          area_id: "area-1",
          consenting_wells_count: 5,
          privacy_masked: false,
          privacy_reason: null,
          avg_depth_m: 14.25,
          median_depth_m: 14.1,
          pct_critical: 20,
          pct_warning: 0,
          pct_offline: 0,
          nodes_online: 5,
          as_of: "2026-10-17T09:00:00Z",
        },
      ],
      error: null,
    });

    const client = { rpc: mockRpc } as unknown as SupabaseClient<Database>;
    const stats = await fetchInsurerVillageStats(client, "area-1", 3);

    expect(stats.privacy_masked).toBe(false);
    expect(stats.consenting_wells_count).toBe(5);
    expect(stats.avg_depth_m).toBe(14.25);
    expect(stats.median_depth_m).toBe(14.1);
  });

  it("throws when rpc returns an error", async () => {
    const mockRpc = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "Database connection failed" },
    });

    const client = { rpc: mockRpc } as unknown as SupabaseClient<Database>;
    await expect(fetchInsurerVillageStats(client, "area-1", 3)).rejects.toThrow(
      "Database connection failed",
    );
  });

  describe("fetchInsurerVillageTimeseries", () => {
    it("fetches bucketed timeseries correctly", async () => {
      const mockRpc = vi.fn().mockResolvedValue({
        data: [
          {
            bucket_ts: "2026-10-01T00:00:00Z",
            consenting_wells_count: 4,
            privacy_masked: false,
            avg_depth_m: 13.8,
            median_depth_m: 13.5,
          },
        ],
        error: null,
      });

      const client = { rpc: mockRpc } as unknown as SupabaseClient<Database>;
      const res = await fetchInsurerVillageTimeseries(client, {
        areaId: "village-1",
        startDate: "2026-10-01",
        endDate: "2026-10-10",
        bucket: "day",
      });

      expect(res).toHaveLength(1);
      expect(res[0]?.avg_depth_m).toBe(13.8);
      expect(mockRpc).toHaveBeenCalledWith("get_insurer_village_timeseries", {
        p_area_id: "village-1",
        p_start_date: "2026-10-01",
        p_end_date: "2026-10-10",
        p_bucket: "day",
        p_min_wells: 3,
      });
    });
  });
});
