import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

const mocks = vi.hoisted(() => ({
  createRouteHandlerClient: vi.fn(),
  getSession: vi.fn(),
  from: vi.fn(),
}));

vi.mock("@/server/supabase/route-handler", () => ({
  createRouteHandlerClient: mocks.createRouteHandlerClient,
}));

describe("GET /api/v1/wells/map", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when session does not exist", async () => {
    mocks.createRouteHandlerClient.mockResolvedValue({
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      },
    });

    const request = new Request(
      "http://localhost/api/v1/wells/map?bbox=77.0,28.0,77.5,28.5&zoom=10",
    );
    const response = await GET(request);

    expect(response.status).toBe(401);
  });

  it("returns 400 when bbox is missing", async () => {
    mocks.createRouteHandlerClient.mockResolvedValue({
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: { session: { user: { id: "user-1" } } },
        }),
      },
    });

    const request = new Request("http://localhost/api/v1/wells/map?zoom=10");
    const response = await GET(request);

    expect(response.status).toBe(400);
  });

  it("returns 400 when bbox format is invalid", async () => {
    mocks.createRouteHandlerClient.mockResolvedValue({
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: { session: { user: { id: "user-1" } } },
        }),
      },
    });

    const request = new Request("http://localhost/api/v1/wells/map?bbox=invalid,bbox&zoom=10");
    const response = await GET(request);

    expect(response.status).toBe(400);
  });

  it("returns GeoJSON FeatureCollection when authorized", async () => {
    const mockProfile = {
      id: "user-1",
      role: "farmer",
      admin_area_id: "area-1",
    };

    const mockWells = [
      {
        id: "well-1",
        name: "Test Well",
        latitude: 28.2,
        longitude: 77.2,
        owner_id: "user-1",
        admin_area_id: "area-1",
        status: "active",
        total_depth_m: 50,
        well_type: "borewell",
      },
    ];

    const supabase = {
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: { session: { user: { id: "user-1" } } },
        }),
      },
      from: vi.fn((table: string) => {
        if (table === "profiles") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
          };
        }
        if (table === "wells") {
          return {
            select: vi.fn().mockReturnThis(),
            gte: vi.fn().mockReturnThis(),
            lte: vi.fn().mockReturnThis(),
            then: vi
              .fn()
              .mockImplementation((resolve) => resolve({ data: mockWells, error: null })),
          };
        }
        return {
          select: vi.fn().mockReturnThis(),
        };
      }),
    };

    mocks.createRouteHandlerClient.mockResolvedValue(supabase);

    const request = new Request(
      "http://localhost/api/v1/wells/map?bbox=77.0,28.0,77.5,28.5&zoom=13",
    );
    const response = await GET(request);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.type).toBe("FeatureCollection");
    expect(json.features).toHaveLength(1);
    expect(json.features[0].properties.id).toBe("well-1");
    expect(json.features[0].properties.isOwned).toBe(true);
  });
});
