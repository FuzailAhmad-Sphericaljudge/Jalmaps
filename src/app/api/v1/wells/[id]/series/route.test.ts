import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createRouteHandlerClient: vi.fn(),
  getSession: vi.fn(),
  select: vi.fn(),
  eq: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock("@/server/supabase/route-handler", () => ({
  createRouteHandlerClient: mocks.createRouteHandlerClient,
}));

vi.mock("@/lib/series/lttb", () => ({
  downsampleWithGaps: vi.fn((data) => data),
}));

import { GET } from "./route";

function makeRequest(url: string) {
  return new Request(url, {
    method: "GET",
  });
}

describe("GET /api/v1/wells/[id]/series", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mocks
    mocks.getSession.mockResolvedValue({ data: { session: { user: { id: "user1" } } } });
    mocks.eq.mockResolvedValue({ data: [{ id: "node1" }], error: null });
    mocks.select.mockReturnValue({ eq: mocks.eq });

    mocks.rpc.mockResolvedValue({
      data: [
        {
          bucket_time: "2026-06-01T00:00:00Z",
          avg_depth: 10,
          min_depth: 9,
          max_depth: 11,
          count: 1,
        },
      ],
      error: null,
    });

    mocks.createRouteHandlerClient.mockResolvedValue({
      auth: { getSession: mocks.getSession },
      from: () => ({ select: mocks.select }),
      rpc: mocks.rpc,
    });
  });

  it("returns 401 if not authenticated", async () => {
    mocks.getSession.mockResolvedValue({ data: { session: null } });
    const res = await GET(
      makeRequest(
        "http://localhost/api/v1/wells/well1/series?from=2026-01-01T00:00:00Z&to=2026-02-01T00:00:00Z",
      ),
      { params: Promise.resolve({ id: "well1" }) },
    );
    expect(res.status).toBe(401);
  });

  it("validates from and to parameters", async () => {
    const res = await GET(makeRequest("http://localhost/api/v1/wells/well1/series?from=invalid"), {
      params: Promise.resolve({ id: "well1" }),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Invalid parameters");
  });

  it("validates that from must be before to", async () => {
    const res = await GET(
      makeRequest(
        "http://localhost/api/v1/wells/well1/series?from=2026-02-01T00:00:00Z&to=2026-01-01T00:00:00Z",
      ),
      { params: Promise.resolve({ id: "well1" }) },
    );
    expect(res.status).toBe(400);
  });

  it("handles empty data gracefully", async () => {
    mocks.rpc.mockResolvedValue({ data: [], error: null });
    const res = await GET(
      makeRequest(
        "http://localhost/api/v1/wells/well1/series?from=2026-01-01T00:00:00Z&to=2026-02-01T00:00:00Z",
      ),
      { params: Promise.resolve({ id: "well1" }) },
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual([]);
  });

  it("returns empty array if RLS denies access to nodes", async () => {
    mocks.eq.mockResolvedValue({ data: [], error: null });
    const res = await GET(
      makeRequest(
        "http://localhost/api/v1/wells/well1/series?from=2026-01-01T00:00:00Z&to=2026-02-01T00:00:00Z",
      ),
      { params: Promise.resolve({ id: "well1" }) },
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual([]);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("determines hourly bucket automatically for a 30 day range", async () => {
    const from = "2026-01-01T00:00:00.000Z";
    const to = "2026-01-30T00:00:00.000Z";
    await GET(makeRequest(`http://localhost/api/v1/wells/well1/series?from=${from}&to=${to}`), {
      params: Promise.resolve({ id: "well1" }),
    });

    expect(mocks.rpc).toHaveBeenCalledWith("readings_bucketed", {
      p_node_ids: ["node1"],
      p_from: from,
      p_to: to,
      p_bucket: "hourly",
    });
  });

  it("determines daily bucket automatically for a 1 year range", async () => {
    const from = "2025-01-01T00:00:00.000Z";
    const to = "2026-01-01T00:00:00.000Z";
    await GET(makeRequest(`http://localhost/api/v1/wells/well1/series?from=${from}&to=${to}`), {
      params: Promise.resolve({ id: "well1" }),
    });

    expect(mocks.rpc).toHaveBeenCalledWith("readings_bucketed", {
      p_node_ids: ["node1"],
      p_from: from,
      p_to: to,
      p_bucket: "daily",
    });
  });
});
