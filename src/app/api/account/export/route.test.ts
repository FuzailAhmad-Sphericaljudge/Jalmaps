import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createRouteHandlerClient: vi.fn(),
  getCurrentUser: vi.fn(),
}));

vi.mock("@/server/auth", () => ({ getCurrentUser: mocks.getCurrentUser }));
vi.mock("@/server/supabase/route-handler", () => ({
  createRouteHandlerClient: mocks.createRouteHandlerClient,
}));

import { GET } from "./route";

const userId = "c5d376a5-2005-4f49-80ec-8fecfd987c60";
const wellId = "9e550a9e-e5e8-40d1-9e3f-b2c9f72afc50";

const profile = {
  id: userId,
  full_name: "Test Farmer",
  phone: "+919000000001",
  preferred_locale: "en",
  preferred_unit: "m",
  role: "farmer",
  admin_area_id: null,
  crops: [],
  onboarding_completed_at: "2026-10-01T00:00:00.000Z",
  deleted_at: null,
  created_at: "2026-10-01T00:00:00.000Z",
  updated_at: "2026-10-01T00:00:00.000Z",
};

describe("GET /api/account/export", () => {
  const selectedColumns = new Map<string, string>();

  beforeEach(() => {
    vi.clearAllMocks();
    selectedColumns.clear();
    mocks.getCurrentUser.mockResolvedValue({ user: { id: userId }, profile });
    const dataByTable: Record<string, unknown[]> = {
      wells: Array.from({ length: 501 }, (_, index) => ({ id: `${wellId}-${index}` })),
      nodes: [],
      alert_rules: [],
      notification_prefs: [],
      api_keys: [],
    };
    const from = vi.fn((table: string) => {
      let rangeStart = 0;
      let rangeEnd = Number.MAX_SAFE_INTEGER;
      const query = {
        select: vi.fn((columns: string) => {
          selectedColumns.set(table, columns);
          return query;
        }),
        eq: vi.fn(() => query),
        in: vi.fn(() => query),
        order: vi.fn(() => query),
        range: vi.fn((start: number, end: number) => {
          rangeStart = start;
          rangeEnd = end;
          return query;
        }),
        then: (
          resolve: (value: { data: unknown[]; error: null }) => unknown,
          reject?: (reason: unknown) => unknown,
        ) =>
          Promise.resolve({
            data: (dataByTable[table] ?? []).slice(rangeStart, rangeEnd + 1),
            error: null,
          }).then(resolve, reject),
      };
      return query;
    });
    mocks.createRouteHandlerClient.mockResolvedValue({ from });
  });

  it("requires a signed-in user who completed onboarding", async () => {
    mocks.getCurrentUser.mockResolvedValue(null);

    const response = await GET();

    expect(response.status).toBe(401);
    expect(mocks.createRouteHandlerClient).not.toHaveBeenCalled();
  });

  it("returns a no-store JSON download without credential hashes", async () => {
    const response = await GET();
    const body = await response.json();
    const serialized = JSON.stringify(body);

    expect(response.status).toBe(200);
    expect(response.headers.get("content-disposition")).toContain("jalmaps-data.json");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(body.profile).toEqual(profile);
    expect(body.wells).toHaveLength(501);
    expect(serialized).not.toContain("api_key_hash");
    expect(serialized).not.toContain("key_hash");
    expect(selectedColumns.get("nodes")).not.toContain("api_key_hash");
    expect(selectedColumns.get("api_keys")).not.toContain("key_hash");
  });
});
