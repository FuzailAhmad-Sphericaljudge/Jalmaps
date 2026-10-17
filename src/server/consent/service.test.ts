import { describe, it, expect, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/db/types";

import { getConsentStatusForUser, updateConsentForUser } from "./service";

describe("consent service", () => {
  it("retrieves consent status for a user", async () => {
    const mockSingle = vi.fn().mockResolvedValue({
      data: {
        data_sharing_consent: true,
        data_sharing_consent_at: "2026-10-17T09:00:00Z",
      },
      error: null,
    });
    const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
    const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });

    const client = { from: mockFrom } as unknown as SupabaseClient<Database>;
    const res = await getConsentStatusForUser(client, "user-123");

    expect(res.dataSharingConsent).toBe(true);
    expect(res.dataSharingConsentAt).toBe("2026-10-17T09:00:00Z");
    expect(mockFrom).toHaveBeenCalledWith("profiles");
    expect(mockEq).toHaveBeenCalledWith("id", "user-123");
  });

  it("updates consent for a user and returns updated record", async () => {
    const mockSingle = vi.fn().mockResolvedValue({
      data: {
        data_sharing_consent: false,
        data_sharing_consent_at: "2026-10-17T10:00:00Z",
      },
      error: null,
    });
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
    const mockEq = vi.fn().mockReturnValue({ select: mockSelect });
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
    const mockFrom = vi.fn().mockReturnValue({ update: mockUpdate });

    const client = { from: mockFrom } as unknown as SupabaseClient<Database>;
    const res = await updateConsentForUser(client, "user-123", false);

    expect(res.dataSharingConsent).toBe(false);
    expect(mockFrom).toHaveBeenCalledWith("profiles");
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data_sharing_consent: false,
      }),
    );
  });

  it("throws when profile update fails", async () => {
    const mockSingle = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "Profile update restricted" },
    });
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
    const mockEq = vi.fn().mockReturnValue({ select: mockSelect });
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
    const mockFrom = vi.fn().mockReturnValue({ update: mockUpdate });

    const client = { from: mockFrom } as unknown as SupabaseClient<Database>;
    await expect(updateConsentForUser(client, "user-123", true)).rejects.toThrow(
      "Profile update restricted",
    );
  });
});

