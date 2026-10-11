import { describe, expect, it, vi } from "vitest";
import { computeWellInsights, refreshAreaInsights } from "./jobs";

describe("Aquifer Insights Server Jobs", () => {
  it("stores insufficient status when readings data is insufficient", async () => {
    const upsertMock = vi.fn().mockResolvedValue({ error: null });
    const mockClient = {
      from: vi.fn((table: string) => {
        if (table === "wells") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: "w-1", depth_m: 50, aquifer_types: null },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "nodes") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{ id: "n-1" }],
                error: null,
              }),
            }),
          };
        }
        if (table === "readings") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  range: vi.fn().mockResolvedValue({
                    // Only 2 readings over 1 day -> insufficient span
                    data: [
                      {
                        recorded_at: "2026-01-01T00:00:00Z",
                        depth_to_water_m: 10,
                        quality: "good",
                      },
                      {
                        recorded_at: "2026-01-02T00:00:00Z",
                        depth_to_water_m: 10.1,
                        quality: "good",
                      },
                    ],
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        if (table === "well_insights") {
          return {
            upsert: upsertMock,
          };
        }
        return {};
      }),
    } as unknown as Parameters<typeof computeWellInsights>[2];

    const result = await computeWellInsights("w-1", "2026-01-02", mockClient);
    expect(result).not.toBeNull();
    expect(result?.isSufficient).toBe(false);
    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        well_id: "w-1",
        is_sufficient: false,
        health_score: null,
      }),
      { onConflict: "well_id,as_of" },
    );
  });

  it("enforces k >= 3 privacy threshold during area insights aggregation", async () => {
    const upsertAreaMock = vi.fn().mockResolvedValue({ error: null });
    const mockClient = {
      from: vi.fn((table: string) => {
        if (table === "admin_areas") {
          return {
            select: vi.fn().mockResolvedValue({
              data: [
                {
                  id: "v-small",
                  level: "village",
                  parent_id: "b-1",
                  names: { en: "Small Village" },
                },
                {
                  id: "v-large",
                  level: "village",
                  parent_id: "b-1",
                  names: { en: "Large Village" },
                },
                { id: "b-1", level: "block", parent_id: null, names: { en: "Main Block" } },
              ],
              error: null,
            }),
          };
        }
        if (table === "well_insights") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [
                  // 2 wells in v-small (< 3 -> privacy masked)
                  {
                    well_id: "w-1",
                    is_sufficient: true,
                    health_score: 80,
                    health_band: "healthy",
                    depletion: { depletionRateMPerYear: 0.1 },
                    recharge: { estimatedRechargeVolumeMCM: 0.05 },
                    wells: { admin_area_id: "v-small" },
                  },
                  {
                    well_id: "w-2",
                    is_sufficient: true,
                    health_score: 82,
                    health_band: "healthy",
                    depletion: { depletionRateMPerYear: 0.1 },
                    recharge: { estimatedRechargeVolumeMCM: 0.05 },
                    wells: { admin_area_id: "v-small" },
                  },
                  // 3 wells in v-large (>= 3 -> sufficient)
                  {
                    well_id: "w-3",
                    is_sufficient: true,
                    health_score: 70,
                    health_band: "moderate",
                    depletion: { depletionRateMPerYear: 0.2 },
                    recharge: { estimatedRechargeVolumeMCM: 0.1 },
                    wells: { admin_area_id: "v-large" },
                  },
                  {
                    well_id: "w-4",
                    is_sufficient: true,
                    health_score: 72,
                    health_band: "moderate",
                    depletion: { depletionRateMPerYear: 0.2 },
                    recharge: { estimatedRechargeVolumeMCM: 0.1 },
                    wells: { admin_area_id: "v-large" },
                  },
                  {
                    well_id: "w-5",
                    is_sufficient: true,
                    health_score: 68,
                    health_band: "moderate",
                    depletion: { depletionRateMPerYear: 0.2 },
                    recharge: { estimatedRechargeVolumeMCM: 0.1 },
                    wells: { admin_area_id: "v-large" },
                  },
                ],
                error: null,
              }),
            }),
          };
        }
        if (table === "area_insights") {
          return {
            upsert: upsertAreaMock,
          };
        }
        return {};
      }),
    } as unknown as Parameters<typeof refreshAreaInsights>[0];

    const results = await refreshAreaInsights(mockClient);
    expect(results).toHaveLength(3);

    // v-small has 2 wells -> masked
    const smallVillage = results.find((r) => r.areaId === "v-small");
    expect(smallVillage?.isSufficient).toBe(false);
    expect(smallVillage?.avgScore).toBeNull();
    expect(upsertAreaMock).toHaveBeenCalledWith(
      expect.objectContaining({
        area_id: "v-small",
        is_sufficient: false,
        wells_count: 2,
        avg_health_score: null,
      }),
      { onConflict: "area_id,as_of" },
    );

    // v-large has 3 wells -> sufficient
    const largeVillage = results.find((r) => r.areaId === "v-large");
    expect(largeVillage?.isSufficient).toBe(true);
    expect(largeVillage?.avgScore).toBe(70);
    expect(upsertAreaMock).toHaveBeenCalledWith(
      expect.objectContaining({
        area_id: "v-large",
        is_sufficient: true,
        wells_count: 3,
        avg_health_score: 70,
      }),
      { onConflict: "area_id,as_of" },
    );

    // b-1 rolls up both children: total 5 wells -> sufficient
    const block = results.find((r) => r.areaId === "b-1");
    expect(block?.isSufficient).toBe(true);
    expect(block?.wellsCount).toBe(5);
  });
});
