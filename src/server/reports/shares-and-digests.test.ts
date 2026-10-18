import { describe, it, expect, vi } from "vitest";
import { createReportShare, resolveReportShare, revokeReportShare } from "./shares";
import { processScheduledDigests, unsubscribeReportSchedule } from "./digests";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/db/types";
import { createHash } from "node:crypto";

describe("Report Shares Service", () => {
  it("creates an expiring share link with SHA-256 hashed token and 30-day cap", async () => {
    let insertedRow: Record<string, unknown> = {};
    const mockSupabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "report_shares") {
          return {
            insert: vi.fn().mockImplementation((row: Record<string, unknown>) => {
              insertedRow = row;
              return Promise.resolve({ error: null });
            }),
          };
        }
        return {};
      }),
    } as unknown as SupabaseClient<Database>;

    const result = await createReportShare(mockSupabase, "report-123", "user-456", {
      expiryDays: 45, // should clamp to 30
    });

    expect(result.token).toHaveLength(48); // 24 bytes hex
    expect(result.shareUrl).toContain(`/share/${result.token}`);
    expect(insertedRow.token_hash).toBe(createHash("sha256").update(result.token).digest("hex"));
    expect(insertedRow.created_by).toBe("user-456");
  });

  it("resolves active share link, increments access count, and returns signed URL", async () => {
    const rawToken = "testtoken1234567890abcdef";
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");
    let accessCountUpdated = false;

    const mockSupabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "report_shares") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockImplementation((col: string, val: string) => {
              if (col === "token_hash" && val === tokenHash) {
                return {
                  single: vi.fn().mockResolvedValue({
                    data: {
                      id: "share-1",
                      report_id: "rep-1",
                      expires_at: new Date(Date.now() + 86400000).toISOString(),
                      revoked_at: null,
                      access_count: 3,
                      reports: {
                        id: "rep-1",
                        type: "village",
                        format: "pdf",
                        storage_path: "user/rep-1.pdf",
                        status: "done",
                        expires_at: new Date(Date.now() + 86400000).toISOString(),
                      },
                    },
                    error: null,
                  }),
                };
              }
              if (col === "id" && val === "share-1") {
                accessCountUpdated = true;
                return Promise.resolve({ error: null });
              }
              return { single: vi.fn().mockResolvedValue({ data: null, error: null }) };
            }),
            update: vi.fn().mockReturnThis(),
          };
        }
        return {};
      }),
      storage: {
        from: vi.fn().mockReturnValue({
          createSignedUrl: vi.fn().mockResolvedValue({
            data: { signedUrl: "https://storage.supabase.co/signed-download" },
            error: null,
          }),
        }),
      },
    } as unknown as SupabaseClient<Database>;

    const resolved = await resolveReportShare(mockSupabase, rawToken);
    expect(resolved.valid).toBe(true);
    expect(resolved.reportType).toBe("village");
    expect(resolved.signedDownloadUrl).toBe("https://storage.supabase.co/signed-download");
    expect(resolved.accessCount).toBe(4);
    expect(accessCountUpdated).toBe(true);
  });

  it("returns revoked error if share link has been revoked", async () => {
    const rawToken = "revokedtoken123";
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");

    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: "share-revoked",
              revoked_at: "2026-10-15T00:00:00Z",
              expires_at: "2026-11-01T00:00:00Z",
            },
            error: null,
          }),
        }),
      }),
    } as unknown as SupabaseClient<Database>;

    const resolved = await resolveReportShare(mockSupabase, rawToken);
    expect(resolved.valid).toBe(false);
    expect(resolved.error).toBe("revoked");
  });

  it("revokes active share link", async () => {
    let revoked = false;
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockImplementation(() => {
              revoked = true;
              return Promise.resolve({ error: null });
            }),
          }),
        }),
      }),
    } as unknown as SupabaseClient<Database>;

    await revokeReportShare(mockSupabase, "share-123", "user-1");
    expect(revoked).toBe(true);
  });
});

describe("Scheduled Digests Service", () => {
  it("dispatches due digests to Phase 14 notification outbox with digest event", async () => {
    let outboxInserted = false;
    let reportQueued = false;

    const mockSupabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "report_schedules") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [
                  {
                    id: "sched-1",
                    user_id: "user-1",
                    type: "village",
                    scope: { village_id: "v-1" },
                    cadence: "weekly",
                    channel: "email",
                    locale: "hi",
                    last_run_at: null, // due immediately
                  },
                ],
                error: null,
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          };
        }
        if (table === "reports") {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockImplementation(() => {
                  reportQueued = true;
                  return Promise.resolve({ data: { id: "rep-queued-1" }, error: null });
                }),
              }),
            }),
          };
        }
        if (table === "notification_outbox") {
          return {
            insert: vi.fn().mockImplementation((row: Record<string, unknown>) => {
              if (row.event === "digest" && row.channel === "email") {
                outboxInserted = true;
              }
              return Promise.resolve({ error: null });
            }),
          };
        }
        return {};
      }),
    } as unknown as SupabaseClient<Database>;

    const dispatched = await processScheduledDigests(mockSupabase);
    expect(dispatched).toHaveLength(1);
    expect(reportQueued).toBe(true);
    expect(outboxInserted).toBe(true);
  });

  it("unsubscribes schedule in one tap", async () => {
    let deactivated = false;
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        update: vi.fn().mockImplementation((vals: Record<string, unknown>) => {
          if (vals.active === false) deactivated = true;
          return {
            eq: vi.fn().mockResolvedValue({ error: null }),
          };
        }),
      }),
    } as unknown as SupabaseClient<Database>;

    const success = await unsubscribeReportSchedule(mockSupabase, "sched-1");
    expect(success).toBe(true);
    expect(deactivated).toBe(true);
  });
});
