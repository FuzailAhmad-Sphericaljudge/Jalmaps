import { describe, it, expect, vi } from "vitest";
import { claimNextReportJob, processReportJob, type ReportJobRow } from "./worker";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/db/types";

describe("Report Worker", () => {
  it("claims the next queued job from database via RPC", async () => {
    const mockJob: Partial<ReportJobRow> = {
      id: "job-101",
      type: "well",
      status: "running",
      retry_count: 1,
    };

    const mockSupabase = {
      rpc: vi.fn().mockResolvedValue({
        data: [mockJob],
        error: null,
      }),
    } as unknown as SupabaseClient<Database>;

    const claimed = await claimNextReportJob(mockSupabase);
    expect(claimed?.id).toBe("job-101");
    expect(mockSupabase.rpc).toHaveBeenCalledWith("claim_report_jobs", { batch_size: 1 });
  });

  it("handles CSV job format and marks report done in storage", async () => {
    const mockJob: ReportJobRow = {
      id: "job-csv-1",
      type: "village",
      format: "csv",
      scope: { village_id: "v-1" },
      params: { locale: "en", unit: "m" },
      status: "running",
      storage_path: null,
      created_by: "user-1",
      created_at: "2026-10-17T00:00:00Z",
      completed_at: null,
      expires_at: "2026-11-17T00:00:00Z",
      error: null,
      retry_count: 1,
      file_size_bytes: null,
    };

    const mockSupabase = {
      storage: {
        from: vi.fn().mockReturnValue({
          upload: vi.fn().mockResolvedValue({ data: {}, error: null }),
        }),
      },
      from: vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: {}, error: null }),
        }),
      }),
    } as unknown as SupabaseClient<Database>;

    const result = await processReportJob(mockJob, mockSupabase);
    expect(result.status).toBe("done");
    expect(result.storagePath).toContain("job-csv-1.csv");
    expect(result.fileSizeBytes).toBeGreaterThan(0);
  });
});
