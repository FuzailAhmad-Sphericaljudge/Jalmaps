import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/db/types";
import {
  generateInsurerKey,
  verifyInsurerKey,
  revokeInsurerKey,
  rotateInsurerKey,
  hashInsurerSecret,
} from "./keys";

describe("Insurer Keys Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("generates a live key with expected prefix and returns keyString only once", async () => {
    let insertedRow: Record<string, unknown> | null = null;
    const mockInsert = vi.fn().mockImplementation((row) => {
      insertedRow = { ...row, id: "key-uuid-1", created_at: new Date().toISOString() };
      return {
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: insertedRow,
            error: null,
          }),
        }),
      };
    });

    const client = {
      from: vi.fn().mockReturnValue({ insert: mockInsert }),
    } as unknown as SupabaseClient<Database>;

    const key = await generateInsurerKey(client, {
      userId: "user-1",
      name: "Acme Production Key",
      isSandbox: false,
      scopes: ["stats:read", "risk:read"],
    });

    expect(key.keyString).toMatch(/^jlp_live_[0-9a-f]{8}_[A-Za-z0-9_-]+/);
    expect(key.keyPrefix).toMatch(/^jlp_live_[0-9a-f]{8}$/);
    expect(key.isSandbox).toBe(false);
    expect(insertedRow).not.toBeNull();
    if (insertedRow) {
      expect(typeof insertedRow["key_hash"]).toBe("string");
      expect(insertedRow["key_hash"]).not.toContain(key.keyString);
    }
  });

  it("generates a test key for sandbox environment", async () => {
    const mockInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: {
            id: "key-uuid-test",
            name: "Sandbox Key",
            key_prefix: "jlp_test_12345678",
            scopes: ["stats:read"],
            is_sandbox: true,
            rate_limit_per_min: 60,
            monthly_quota: 50000,
            expires_at: null,
            created_at: new Date().toISOString(),
          },
          error: null,
        }),
      }),
    });

    const client = {
      from: vi.fn().mockReturnValue({ insert: mockInsert }),
    } as unknown as SupabaseClient<Database>;

    const key = await generateInsurerKey(client, {
      userId: "user-1",
      name: "Sandbox Key",
      isSandbox: true,
    });

    expect(key.keyString).toMatch(/^jlp_test_/);
    expect(key.isSandbox).toBe(true);
  });

  it("verifies a valid key using constant-time comparison", async () => {
    const secret = "testsecret12345678901234567890123";
    const prefix = "aabbccdd";
    const keyHash = hashInsurerSecret(secret);
    const keyString = `jlp_live_${prefix}_${secret}`;

    const mockMaybeSingle = vi.fn().mockResolvedValue({
      data: {
        id: "key-1",
        user_id: "user-1",
        name: "Test Key",
        key_prefix: `jlp_live_${prefix}`,
        key_hash: keyHash,
        scopes: ["stats:read"],
        is_sandbox: false,
        rate_limit_per_min: 60,
        monthly_quota: 50000,
        revoked_at: null,
        expires_at: null,
      },
      error: null,
    });

    const mockUpdate = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({}) });

    const client = {
      from: vi.fn().mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: mockMaybeSingle,
          }),
        }),
        update: mockUpdate,
      })),
    } as unknown as SupabaseClient<Database>;

    const verified = await verifyInsurerKey(client, `Bearer ${keyString}`);
    expect(verified).not.toBeNull();
    expect(verified?.id).toBe("key-1");
    expect(verified?.userId).toBe("user-1");
    expect(verified?.isSandbox).toBe(false);
  });

  it("rejects revoked or expired keys", async () => {
    const secret = "testsecret12345678901234567890123";
    const prefix = "aabbccdd";
    const keyString = `jlp_live_${prefix}_${secret}`;

    const mockMaybeSingle = vi.fn().mockResolvedValue({
      data: {
        id: "key-1",
        user_id: "user-1",
        name: "Revoked Key",
        key_prefix: `jlp_live_${prefix}`,
        key_hash: hashInsurerSecret(secret),
        scopes: ["stats:read"],
        is_sandbox: false,
        revoked_at: new Date().toISOString(),
        expires_at: null,
      },
      error: null,
    });

    const client = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: mockMaybeSingle,
          }),
        }),
      }),
    } as unknown as SupabaseClient<Database>;

    const verified = await verifyInsurerKey(client, `Bearer ${keyString}`);
    expect(verified).toBeNull();
  });

  it("revokes an active key successfully", async () => {
    const mockEq2 = vi.fn().mockResolvedValue({ error: null });
    const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 });
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq1 });

    const client = {
      from: vi.fn().mockReturnValue({ update: mockUpdate }),
    } as unknown as SupabaseClient<Database>;

    const ok = await revokeInsurerKey(client, "key-uuid-1", "user-1");
    expect(ok).toBe(true);
    expect(mockUpdate).toHaveBeenCalled();
  });

  it("rotates an active key by revoking old and creating new", async () => {
    const mockRevokeEq2 = vi.fn().mockResolvedValue({ error: null });
    const mockRevokeEq1 = vi.fn().mockReturnValue({ eq: mockRevokeEq2 });
    const mockRevokeUpdate = vi.fn().mockReturnValue({ eq: mockRevokeEq1 });

    const mockInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: {
            id: "key-uuid-2",
            name: "Rotated Key",
            key_prefix: "jlp_live_87654321",
            scopes: ["stats:read"],
            is_sandbox: false,
            rate_limit_per_min: 60,
            monthly_quota: 50000,
            revoked_at: null,
            expires_at: null,
            created_at: new Date().toISOString(),
          },
          error: null,
        }),
      }),
    });

    const client = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "insurer_api_keys") {
          return {
            update: mockRevokeUpdate,
            insert: mockInsert,
          };
        }
        return {};
      }),
    } as unknown as SupabaseClient<Database>;

    const rotated = await rotateInsurerKey(client, "key-uuid-1", "user-1");
    expect(rotated.id).toBe("key-uuid-2");
    expect(rotated.keyString).toMatch(/^jlp_live_/);
  });
});
