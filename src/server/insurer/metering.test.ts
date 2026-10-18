import { describe, it, expect, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/db/types";
import { checkRateLimitAndQuota, recordApiUsage, getDailyUsageRollup } from "./metering";
import type { VerifiedInsurerKey } from "./keys";

describe("Metering & Rate Limiting Engine", () => {
  const testKey: VerifiedInsurerKey = {
    id: "key-123",
    userId: "user-1",
    name: "Test Partner Key",
    scopes: ["stats:read"],
    isSandbox: false,
    rateLimitPerMin: 60,
    monthlyQuota: 1000,
    revokedAt: null,
    expiresAt: null,
  };

  it("allows requests when under minute limit and monthly quota", async () => {
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          gte: vi.fn().mockResolvedValue({ count: 15, error: null }),
        }),
      }),
    });

    const client = { from: mockFrom } as unknown as SupabaseClient<Database>;
    const status = await checkRateLimitAndQuota(client, testKey);

    expect(status.allowed).toBe(true);
    expect(status.remainingPerMin).toBe(45);
  });

  it("blocks requests with 429 Retry-After when minute limit is exceeded", async () => {
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          gte: vi.fn().mockResolvedValue({ count: 60, error: null }),
        }),
      }),
    });

    const client = { from: mockFrom } as unknown as SupabaseClient<Database>;
    const status = await checkRateLimitAndQuota(client, testKey);

    expect(status.allowed).toBe(false);
    expect(status.reason).toBe("rate_limit_exceeded");
    expect(status.retryAfterSeconds).toBe(60);
  });

  it("blocks requests when monthly quota is exceeded", async () => {
    let callCount = 0;
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          gte: vi.fn().mockImplementation(() => {
            callCount++;
            // 1st call: minute window (count 10)
            if (callCount === 1) return Promise.resolve({ count: 10, error: null });
            // 2nd call: month window (count 1000 - exhausted)
            return Promise.resolve({ count: 1000, error: null });
          }),
        }),
      }),
    });

    const client = { from: mockFrom } as unknown as SupabaseClient<Database>;
    const status = await checkRateLimitAndQuota(client, testKey);

    expect(status.allowed).toBe(false);
    expect(status.reason).toBe("monthly_quota_exceeded");
  });

  it("records API usage into audit table", async () => {
    const mockInsert = vi.fn().mockResolvedValue({ error: null });
    const client = {
      from: vi.fn().mockReturnValue({ insert: mockInsert }),
    } as unknown as SupabaseClient<Database>;

    await recordApiUsage(client, {
      keyId: "key-123",
      endpoint: "/api/v1/insurer/areas",
      status: 200,
      bytes: 1420,
    });

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        key_id: "key-123",
        endpoint: "/api/v1/insurer/areas",
        status: 200,
        bytes: 1420,
      }),
    );
  });

  it("aggregates daily usage for charting", async () => {
    const mockData = [
      { ts: "2026-10-16T10:00:00Z", bytes: 500 },
      { ts: "2026-10-16T12:00:00Z", bytes: 600 },
      { ts: "2026-10-17T08:00:00Z", bytes: 1200 },
    ];

    const client = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            gte: vi.fn().mockResolvedValue({ data: mockData, error: null }),
          }),
        }),
      }),
    } as unknown as SupabaseClient<Database>;

    const rollup = await getDailyUsageRollup(client, "key-123", 30);
    expect(rollup).toHaveLength(2);
    expect(rollup[0]?.date).toBe("2026-10-16");
    expect(rollup[0]?.requests).toBe(2);
    expect(rollup[0]?.bytes).toBe(1100);
    expect(rollup[1]?.date).toBe("2026-10-17");
    expect(rollup[1]?.requests).toBe(1);
    expect(rollup[1]?.bytes).toBe(1200);
  });
});
