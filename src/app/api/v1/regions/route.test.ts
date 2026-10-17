import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET as getRegions } from "./route";
import { GET as exportRegions } from "./export/route";

const mocks = vi.hoisted(() => ({
  createRouteHandlerClient: vi.fn(),
  getSession: vi.fn(),
  from: vi.fn(),
}));

vi.mock("@/server/supabase/route-handler", () => ({
  createRouteHandlerClient: mocks.createRouteHandlerClient,
}));

describe("Regions API Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/v1/regions", () => {
    it("returns 401 when unauthenticated", async () => {
      mocks.createRouteHandlerClient.mockResolvedValue({
        auth: {
          getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
        },
      });

      const req = new Request("http://localhost/api/v1/regions");
      const res = await getRegions(req);
      expect(res.status).toBe(401);
    });

    it("returns 200 with regions and applies privacy threshold", async () => {
      mocks.createRouteHandlerClient.mockResolvedValue({
        auth: {
          getSession: vi.fn().mockResolvedValue({
            data: { session: { user: { id: "user-test" } } },
          }),
        },
        from: vi.fn((table: string) => {
          if (table === "profiles") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({ data: { role: "viewer" } }),
            };
          }
          if (table === "admin_areas") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              then: (resolve: (v: unknown) => unknown) =>
                resolve({
                  data: [
                    {
                      id: "area-1",
                      code: "MH_PUN",
                      level: "district",
                      names: { en: "Pune", mr: "पुणे" },
                      parent_id: null,
                      area_stats: [
                        {
                          wells_count: 2, // < 3 wells -> privacy suppressed
                          nodes_online: 2,
                          avg_depth_m: 14.5,
                          pct_critical: 50.0,
                          pct_warning: 0.0,
                          pct_offline: 0.0,
                          avg_change_30d_m: -0.8,
                          worst_well_id: "w-1",
                        },
                      ],
                    },
                  ],
                  error: null,
                }),
            };
          }
          return {};
        }),
      });

      const req = new Request("http://localhost/api/v1/regions?level=district&locale=mr");
      const res = await getRegions(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.data).toHaveLength(1);
      expect(json.data[0].name).toBe("पुणे");
      expect(json.data[0].isPrivacySuppressed).toBe(true);
      expect(json.data[0].stats.avg_depth_m).toBeNull();
    });
  });

  describe("GET /api/v1/regions/export", () => {
    it("returns 200 with text/csv content", async () => {
      mocks.createRouteHandlerClient.mockResolvedValue({
        auth: {
          getSession: vi.fn().mockResolvedValue({
            data: { session: { user: { id: "user-test" } } },
          }),
        },
        from: vi.fn((table: string) => {
          if (table === "profiles") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({ data: { role: "viewer" } }),
            };
          }
          if (table === "admin_areas") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              is: vi.fn().mockReturnThis(),
              then: (resolve: (v: unknown) => unknown) =>
                resolve({
                  data: [
                    {
                      id: "area-1",
                      code: "MH_PUN",
                      level: "district",
                      names: { en: "Pune" },
                      parent_id: null,
                      area_stats: [
                        {
                          wells_count: 10,
                          nodes_online: 10,
                          avg_depth_m: 12.0,
                          pct_critical: 10.0,
                          pct_warning: 0.0,
                          pct_offline: 0.0,
                          avg_change_30d_m: 0.0,
                          worst_well_id: null,
                        },
                      ],
                    },
                  ],
                  error: null,
                }),
            };
          }
          return {};
        }),
      });

      const req = new Request("http://localhost/api/v1/regions/export?level=district");
      const res = await exportRegions(req);
      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toContain("text/csv");
      const text = await res.text();
      expect(text).toContain("Total Wells");
      expect(text).toContain("MH_PUN");
    });
  });
});
