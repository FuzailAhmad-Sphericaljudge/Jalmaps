import { describe, it, expect, vi, beforeEach } from "vitest";
import type { User, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/db/types";
import {
  generateReportAction,
  getReportDownloadUrlAction,
  deleteReportAction,
  createReportShareAction,
  revokeReportShareAction,
  saveReportScheduleAction,
  deleteReportScheduleAction,
  listUserReportsAction,
  listUserSchedulesAction,
} from "./actions";

// Mock dependencies
const mockUser = { id: "user-123", email: "officer@jalmaps.in" } as unknown as User;
const mockProfile = { id: "user-123", role: "official" as const };

vi.mock("@/server/auth", () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock("@/server/supabase/server-component", () => ({
  createServerComponentClient: vi.fn(),
}));

vi.mock("@/server/supabase/service-role", () => ({
  createServiceRoleClient: vi.fn(),
}));

vi.mock("./worker", () => ({
  processReportJob: vi.fn(),
}));

vi.mock("./storage", () => ({
  getReportSignedUrl: vi.fn(),
  deleteReportFile: vi.fn(),
}));

vi.mock("./shares", () => ({
  createReportShare: vi.fn(),
  revokeReportShare: vi.fn(),
  getActiveShareForReport: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { getCurrentUser } from "@/server/auth";
import { createServerComponentClient } from "@/server/supabase/server-component";
import { createServiceRoleClient } from "@/server/supabase/service-role";
import { processReportJob } from "./worker";
import { getReportSignedUrl, deleteReportFile } from "./storage";
import { createReportShare, revokeReportShare } from "./shares";

describe("Report Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCurrentUser).mockResolvedValue({
      user: mockUser,
      profile: mockProfile as unknown as Database["public"]["Tables"]["profiles"]["Row"],
    });
  });

  describe("generateReportAction", () => {
    it("throws unauthorized if not logged in", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(null);
      await expect(
        generateReportAction({
          type: "village",
          scope: { villageId: "vil-1" },
        }),
      ).rejects.toThrow("Unauthorized");
    });

    it("queues and processes report successfully", async () => {
      const mockInserted = {
        id: "rep-1",
        type: "village",
        format: "pdf",
        status: "queued",
        created_by: "user-123",
      };

      const mockDoneReport = {
        ...mockInserted,
        status: "done",
        storage_path: "user-123/rep-1.pdf",
      };

      const mockDb = {
        from: vi.fn().mockImplementation((table: string) => {
          if (table === "reports") {
            return {
              insert: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: mockInserted, error: null }),
                }),
              }),
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: mockDoneReport, error: null }),
                }),
              }),
            };
          }
          return {};
        }),
      } as unknown as SupabaseClient<Database>;

      vi.mocked(createServerComponentClient).mockResolvedValue(mockDb);
      vi.mocked(createServiceRoleClient).mockReturnValue(mockDb);
      vi.mocked(processReportJob).mockResolvedValue({
        jobId: "rep-1",
        status: "done",
        storagePath: "user-123/rep-1.pdf",
      });

      const res = await generateReportAction({
        type: "village",
        format: "pdf",
        scope: { villageId: "vil-1" },
        params: { locale: "hi" },
      });

      expect(res.success).toBe(true);
      expect(res.report?.status).toBe("done");
      expect(processReportJob).toHaveBeenCalled();
    });
  });

  describe("getReportDownloadUrlAction", () => {
    it("returns signed URL for user's completed report", async () => {
      const mockDb = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: "rep-1",
                  storage_path: "user-123/rep-1.pdf",
                  status: "done",
                  created_by: "user-123",
                },
                error: null,
              }),
            }),
          }),
        }),
      } as unknown as SupabaseClient<Database>;

      vi.mocked(createServerComponentClient).mockResolvedValue(mockDb);
      vi.mocked(createServiceRoleClient).mockReturnValue(mockDb);
      vi.mocked(getReportSignedUrl).mockResolvedValue("https://storage.signed.url/rep-1.pdf");

      const res = await getReportDownloadUrlAction("rep-1");
      expect(res.success).toBe(true);
      expect(res.downloadUrl).toBe("https://storage.signed.url/rep-1.pdf");
    });

    it("rejects unauthorized user who does not own the report and has no staff role", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        user: { id: "other-user", email: "other@jalmaps.in" } as unknown as User,
        profile: {
          id: "other-user",
          role: "farmer",
        } as unknown as Database["public"]["Tables"]["profiles"]["Row"],
      });

      const mockDb = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: "rep-1",
                  storage_path: "user-123/rep-1.pdf",
                  status: "done",
                  created_by: "user-123",
                },
                error: null,
              }),
            }),
          }),
        }),
      } as unknown as SupabaseClient<Database>;

      vi.mocked(createServerComponentClient).mockResolvedValue(mockDb);

      await expect(getReportDownloadUrlAction("rep-1")).rejects.toThrow("Access denied");
    });
  });

  describe("deleteReportAction", () => {
    it("deletes report record and storage file", async () => {
      let deletedRowId: string | null = null;
      const mockDb = {
        from: vi.fn().mockImplementation((table: string) => {
          if (table === "reports") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: {
                      id: "rep-1",
                      storage_path: "user-123/rep-1.pdf",
                      created_by: "user-123",
                    },
                    error: null,
                  }),
                }),
              }),
              delete: vi.fn().mockReturnValue({
                eq: vi.fn().mockImplementation((_col: string, val: string) => {
                  deletedRowId = val;
                  return Promise.resolve({ error: null });
                }),
              }),
            };
          }
          return {};
        }),
      } as unknown as SupabaseClient<Database>;

      vi.mocked(createServerComponentClient).mockResolvedValue(mockDb);
      vi.mocked(createServiceRoleClient).mockReturnValue(mockDb);

      const res = await deleteReportAction("rep-1");
      expect(res.success).toBe(true);
      expect(deleteReportFile).toHaveBeenCalledWith(expect.anything(), "user-123/rep-1.pdf");
      expect(deletedRowId).toBe("rep-1");
    });
  });

  describe("createReportShareAction & revokeReportShareAction", () => {
    it("creates a share link via service helper", async () => {
      const mockDb = {} as unknown as SupabaseClient<Database>;
      vi.mocked(createServiceRoleClient).mockReturnValue(mockDb);
      vi.mocked(createReportShare).mockResolvedValue({
        token: "tok123",
        shareUrl: "https://jalmaps.in/share/tok123",
        expiresAt: "2026-11-15T00:00:00Z",
      });

      const res = await createReportShareAction("rep-1", { expiryDays: 14 });
      expect(res.success).toBe(true);
      expect(res.share.token).toBe("tok123");
    });

    it("revokes a share link via service helper", async () => {
      const mockDb = {} as unknown as SupabaseClient<Database>;
      vi.mocked(createServiceRoleClient).mockReturnValue(mockDb);
      vi.mocked(revokeReportShare).mockResolvedValue();

      const res = await revokeReportShareAction("share-1");
      expect(res.success).toBe(true);
      expect(revokeReportShare).toHaveBeenCalledWith(expect.anything(), "share-1", "user-123");
    });
  });

  describe("saveReportScheduleAction & deleteReportScheduleAction", () => {
    it("creates scheduled digest successfully", async () => {
      const mockSchedule = {
        id: "sch-1",
        user_id: "user-123",
        type: "village",
        cadence: "weekly",
      };

      const mockDb = {
        from: vi.fn().mockReturnValue({
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: mockSchedule, error: null }),
            }),
          }),
        }),
      } as unknown as SupabaseClient<Database>;

      vi.mocked(createServerComponentClient).mockResolvedValue(mockDb);

      const res = await saveReportScheduleAction({
        type: "village",
        scope: { villageId: "vil-1" },
        cadence: "weekly",
      });

      expect(res.success).toBe(true);
      expect(res.schedule.id).toBe("sch-1");
    });

    it("deletes scheduled digest successfully", async () => {
      const mockDb = {
        from: vi.fn().mockReturnValue({
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          }),
        }),
      } as unknown as SupabaseClient<Database>;

      vi.mocked(createServerComponentClient).mockResolvedValue(mockDb);

      const res = await deleteReportScheduleAction("sch-1");
      expect(res.success).toBe(true);
    });
  });

  describe("listUserReportsAction & listUserSchedulesAction", () => {
    it("lists user reports and schedules", async () => {
      const mockDb = {
        from: vi.fn().mockImplementation((table: string) => {
          if (table === "reports") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  order: vi.fn().mockReturnValue({
                    limit: vi.fn().mockResolvedValue({
                      data: [{ id: "rep-1", type: "village" }],
                      error: null,
                    }),
                  }),
                }),
              }),
            };
          }
          if (table === "report_schedules") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  order: vi.fn().mockResolvedValue({
                    data: [{ id: "sch-1", cadence: "weekly" }],
                    error: null,
                  }),
                }),
              }),
            };
          }
          return {};
        }),
      } as unknown as SupabaseClient<Database>;

      vi.mocked(createServerComponentClient).mockResolvedValue(mockDb);

      const repRes = await listUserReportsAction();
      expect(repRes.success).toBe(true);
      expect(repRes.reports).toHaveLength(1);

      const schRes = await listUserSchedulesAction();
      expect(schRes.success).toBe(true);
      expect(schRes.schedules).toHaveLength(1);
    });
  });
});
