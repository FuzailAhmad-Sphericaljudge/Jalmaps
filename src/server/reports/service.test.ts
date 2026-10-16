import { describe, it, expect, vi } from "vitest";
import {
  assembleWellReportData,
  assembleVillageReportData,
  assembleDistrictReportData,
  assembleSubsidyPlanningReportData,
  generateQrCode,
} from "./service";
import type { SupabaseClient } from "@supabase/supabase-js";

function createMockSupabase(
  overrides: {
    well?: unknown;
    readings?: unknown[];
    alerts?: unknown[];
    area?: unknown;
    wells?: unknown[];
    villages?: unknown[];
  } = {},
) {
  return {
    from: vi.fn().mockImplementation((table: string) => {
      if (table === "wells") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockImplementation((col: string, val: string) => {
            if (col === "id") {
              return {
                single: vi.fn().mockResolvedValue({
                  data: overrides.well ?? {
                    id: val,
                    name: "Farmer Well #1",
                    well_type: "borewell",
                    depth_total_m: 60,
                    latitude: 26.8,
                    longitude: 80.9,
                    owner_id: "user-123",
                    admin_area_id: "village-1",
                    admin_areas: { name: "Rampur Kalan" },
                    nodes: [
                      {
                        id: "node-1",
                        battery_v: 3.65,
                        signal_rssi: -78,
                        last_seen_at: "2026-10-16T12:00:00Z",
                        status: "active",
                      },
                    ],
                    well_members: [{ user_id: "user-123", role: "owner" }],
                  },
                  error: null,
                }),
              };
            }
            if (col === "admin_area_id") {
              return Promise.resolve({
                data: overrides.wells ?? [
                  {
                    id: "w-1",
                    name: "Well Alpha",
                    well_type: "borewell",
                    status: "active",
                    depth_total_m: 50,
                    nodes: [{ status: "active", last_seen_at: "2026-10-16T12:00:00Z" }],
                  },
                  {
                    id: "w-2",
                    name: "Well Beta",
                    well_type: "borewell",
                    status: "active",
                    depth_total_m: 45,
                    nodes: [{ status: "active", last_seen_at: "2026-10-16T12:00:00Z" }],
                  },
                  {
                    id: "w-3",
                    name: "Well Gamma",
                    well_type: "open_well",
                    status: "active",
                    depth_total_m: 30,
                    nodes: [{ status: "active", last_seen_at: "2026-10-16T12:00:00Z" }],
                  },
                ],
                error: null,
              });
            }
            return {
              single: vi.fn().mockResolvedValue({ data: null, error: null }),
            };
          }),
        };
      }
      if (table === "readings") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({
            data: overrides.readings ?? [
              { timestamp: "2026-09-17T00:00:00Z", depth_to_water_m: 12.5, quality: "good" },
              { timestamp: "2026-10-01T00:00:00Z", depth_to_water_m: 12.8, quality: "good" },
              { timestamp: "2026-10-16T00:00:00Z", depth_to_water_m: 13.0, quality: "good" },
            ],
            error: null,
          }),
        };
      }
      if (table === "alerts") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({
            data: overrides.alerts ?? [
              {
                id: "a-1",
                severity: "warning",
                message: "Water level falling rapidly",
                created_at: "2026-10-15T00:00:00Z",
              },
            ],
            error: null,
          }),
        };
      }
      if (table === "admin_areas") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockImplementation((col: string, val: string) => {
            if (col === "id") {
              return {
                single: vi.fn().mockResolvedValue({
                  data: overrides.area ?? {
                    id: val,
                    name: "Rampur Kalan",
                    code: "215001",
                    parent_id: "block-1",
                  },
                  error: null,
                }),
              };
            }
            if (col === "parent_id") {
              return {
                limit: vi.fn().mockResolvedValue({
                  data: overrides.villages ?? [
                    { id: "v-1", name: "Village 1", code: "V01", parent_id: val },
                    { id: "v-2", name: "Village 2", code: "V02", parent_id: val },
                  ],
                  error: null,
                }),
              };
            }
            return {
              single: vi.fn().mockResolvedValue({ data: null, error: null }),
            };
          }),
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
      };
    }) as unknown as SupabaseClient["from"],
  } as unknown as SupabaseClient;
}

describe("assembleWellReportData", () => {
  it("assembles complete well report data for authorized owner", async () => {
    const supabase = createMockSupabase();
    const data = await assembleWellReportData("well-1", { id: "user-123" }, supabase, {
      locale: "hi",
      unit: "m",
    });

    expect(data.type).toBe("well");
    expect(data.well.name).toBe("Farmer Well #1");
    expect(data.well.village).toBe("Rampur Kalan");
    expect(data.kpis.currentDepthM).toBe(13.0);
    expect(data.kpis.change30dM).toBe(0.5);
    expect(data.trendSeries).toHaveLength(3);
    expect(data.dataQuality.qualityScorePct).toBe(100);
    expect(data.dataQuality.notes[0]).toContain("nominal");
    expect(data.alerts).toHaveLength(1);
    expect(data.qrCodeDataUrl).toMatch(/^data:image\/png;base64,/);
  });

  it("throws unauthorized error if user is neither owner, member nor official", async () => {
    const supabase = createMockSupabase();
    await expect(
      assembleWellReportData("well-1", { id: "stranger-999" }, supabase),
    ).rejects.toThrow("Unauthorized");
  });

  it("allows officials to access well report data across jurisdiction", async () => {
    const supabase = createMockSupabase();
    const data = await assembleWellReportData(
      "well-1",
      { id: "official-1", role: "official" },
      supabase,
    );
    expect(data.well.id).toBe("well-1");
  });
});

describe("assembleVillageReportData & Privacy Threshold", () => {
  it("renders unmasked village data when well count >= 3", async () => {
    const supabase = createMockSupabase({
      wells: [
        {
          id: "w-1",
          name: "Well 1",
          well_type: "borewell",
          status: "active",
          depth_total_m: 50,
          nodes: [{ status: "active" }],
        },
        {
          id: "w-2",
          name: "Well 2",
          well_type: "borewell",
          status: "active",
          depth_total_m: 50,
          nodes: [{ status: "active" }],
        },
        {
          id: "w-3",
          name: "Well 3",
          well_type: "borewell",
          status: "active",
          depth_total_m: 50,
          nodes: [{ status: "active" }],
        },
      ],
    });

    const data = await assembleVillageReportData(
      "village-1",
      { id: "officer-1", role: "official" },
      supabase,
    );
    expect(data.type).toBe("village");
    expect(data.privacyMasked).toBe(false);
    expect(data.kpis.averageDepthM).not.toBeNull();
    expect(data.wells[0]?.name).toBe("Well 1");
    expect(data.wells[0]?.currentDepthM).not.toBeNull();
    expect(data.trendSeries.length).toBeGreaterThan(0);
  });

  it("enforces privacy threshold masking when well count < 3", async () => {
    const supabase = createMockSupabase({
      wells: [
        {
          id: "w-1",
          name: "Secret Private Well",
          well_type: "borewell",
          status: "active",
          depth_total_m: 50,
          nodes: [{ status: "active" }],
        },
        {
          id: "w-2",
          name: "Another Private Well",
          well_type: "borewell",
          status: "active",
          depth_total_m: 50,
          nodes: [{ status: "active" }],
        },
      ],
    });

    const data = await assembleVillageReportData("village-small", { id: "user-1" }, supabase);
    expect(data.privacyMasked).toBe(true);
    expect(data.kpis.averageDepthM).toBeNull();
    expect(data.kpis.change30dM).toBeNull();
    expect(data.wells[0]?.name).toContain("Anonymous");
    expect(data.wells[0]?.currentDepthM).toBeNull();
    expect(data.trendSeries).toHaveLength(0);
    expect(data.dataQuality.notes[0]).toContain("Privacy threshold applied");
  });
});

describe("assembleDistrictReportData", () => {
  it("assembles district report ranking villages by stress score", async () => {
    const supabase = createMockSupabase();
    const data = await assembleDistrictReportData(
      "dist-1",
      { id: "dist-officer", role: "official" },
      supabase,
    );
    expect(data.type).toBe("district");
    expect(data.villagesRanked.length).toBeGreaterThan(0);
    expect(data.kpis.totalWells).toBeGreaterThan(0);
    expect(data.qrCodeDataUrl).toMatch(/^data:image\/png;base64,/);
  });
});

describe("assembleSubsidyPlanningReportData", () => {
  it("prioritizes villages with methodology notes and no invented unmeasured data", async () => {
    const supabase = createMockSupabase();
    const data = await assembleSubsidyPlanningReportData(
      "dist-1",
      { id: "officer", role: "official" },
      supabase,
    );
    expect(data.type).toBe("subsidy_planning");
    expect(data.prioritizedVillages[0]?.rank).toBe(1);
    expect(data.prioritizedVillages[0]?.rechargeSuitability).toBe("high");
    expect(data.summary.criticalPriorityCount).toBeGreaterThan(0);
    expect(data.methodology.dataNotice).toContain("verified telemetry");
  });
});

describe("generateQrCode", () => {
  it("generates a valid data URL for links", async () => {
    const qr = await generateQrCode("https://jalmaps.in/en/app");
    expect(qr).toMatch(/^data:image\/png;base64,/);
  });
});
