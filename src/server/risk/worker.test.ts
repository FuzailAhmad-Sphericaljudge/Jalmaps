import { describe, it, expect, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/db/types";
import { runDailyRiskComputation } from "./worker";

describe("runDailyRiskComputation worker", () => {
  it("skips privacy-masked villages and computes risk for eligible villages", async () => {
    const mockVillages = [{ id: "v-masked" }, { id: "v-eligible" }];

    const mockRpc = vi.fn().mockImplementation((fn: string, params: { p_area_id: string }) => {
      if (params.p_area_id === "v-masked") {
        return Promise.resolve({
          data: [
            {
              area_id: "v-masked",
              consenting_wells_count: 1,
              privacy_masked: true,
              privacy_reason: "insufficient_consenting_sample",
              avg_depth_m: null,
              median_depth_m: null,
              pct_critical: null,
              pct_warning: null,
              pct_offline: null,
              nodes_online: null,
              as_of: "2026-10-17T00:00:00Z",
            },
          ],
          error: null,
        });
      }
      return Promise.resolve({
        data: [
          {
            area_id: "v-eligible",
            consenting_wells_count: 5,
            privacy_masked: false,
            privacy_reason: null,
            avg_depth_m: 14.5,
            median_depth_m: 14.2,
            pct_critical: 10,
            pct_warning: 20,
            pct_offline: 5,
            nodes_online: 5,
            as_of: "2026-10-17T00:00:00Z",
          },
        ],
        error: null,
      });
    });

    const mockUpsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { id: "score-1" },
          error: null,
        }),
      }),
    });

    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === "admin_areas") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: mockVillages,
              error: null,
            }),
          }),
        };
      }
      if (table === "area_risk_scores") {
        return {
          upsert: mockUpsert,
        };
      }
      return {};
    });

    const client = {
      from: mockFrom,
      rpc: mockRpc,
    } as unknown as SupabaseClient<Database>;

    const res = await runDailyRiskComputation(client, "2026-10-17");

    expect(res.processedCount).toBe(2);
    expect(res.computedCount).toBe(1);
    expect(res.skippedMaskedCount).toBe(1);
    expect(mockUpsert).toHaveBeenCalledTimes(1);
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        area_id: "v-eligible",
        model_version: "risk_v1",
      }),
      { onConflict: "area_id,model_version,as_of" },
    );
  });
});
