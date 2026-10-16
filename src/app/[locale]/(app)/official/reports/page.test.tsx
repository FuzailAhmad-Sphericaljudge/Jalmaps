import React from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/db/types";
import OfficialReportsPage from "./page";
import VillageReportsPage from "../../village/reports/page";

vi.mock("@/server/auth", () => ({
  getSession: vi.fn(),
}));

vi.mock("@/server/supabase/server-component", () => ({
  createServerComponentClient: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

vi.mock("@/features/reports/ReportCenterView", () => ({
  ReportCenterView: ({ defaultType, locale }: { defaultType: string; locale: string }) => (
    <div data-testid="report-center-view">
      <span>{`Type: ${defaultType}`}</span>
      <span>{`Locale: ${locale}`}</span>
    </div>
  ),
}));

import { getSession } from "@/server/auth";
import { createServerComponentClient } from "@/server/supabase/server-component";
import { redirect } from "next/navigation";

describe("Official & Village Reports Pages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("OfficialReportsPage", () => {
    it("redirects unauthenticated users to login", async () => {
      vi.mocked(getSession).mockResolvedValue(null);

      await OfficialReportsPage({
        params: Promise.resolve({ locale: "en" }),
      });

      expect(redirect).toHaveBeenCalledWith("/en/auth/login");
    });

    it("renders ReportCenterView with defaultType='district' for official user", async () => {
      vi.mocked(getSession).mockResolvedValue({
        user: { id: "user-1", role: "official" },
      } as unknown as Session);

      const mockDb = {
        from: vi.fn().mockImplementation(() => ({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          }),
        })),
      } as unknown as SupabaseClient<Database>;

      vi.mocked(createServerComponentClient).mockResolvedValue(mockDb);

      const element = await OfficialReportsPage({
        params: Promise.resolve({ locale: "hi" }),
      });

      render(element);

      expect(screen.getByTestId("report-center-view")).toBeInTheDocument();
      expect(screen.getByText("Type: district")).toBeInTheDocument();
      expect(screen.getByText("Locale: hi")).toBeInTheDocument();
    });
  });

  describe("VillageReportsPage", () => {
    it("redirects unauthorized users to login", async () => {
      vi.mocked(getSession).mockResolvedValue({
        user: { id: "user-farmer", role: "farmer" },
      } as unknown as Session);

      await VillageReportsPage({
        params: Promise.resolve({ locale: "en" }),
      });

      expect(redirect).toHaveBeenCalledWith("/en/auth/login");
    });

    it("renders ReportCenterView with defaultType='village' for village_admin user", async () => {
      vi.mocked(getSession).mockResolvedValue({
        user: { id: "user-va", role: "village_admin" },
      } as unknown as Session);

      const mockDb = {
        from: vi.fn().mockImplementation(() => ({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          }),
        })),
      } as unknown as SupabaseClient<Database>;

      vi.mocked(createServerComponentClient).mockResolvedValue(mockDb);

      const element = await VillageReportsPage({
        params: Promise.resolve({ locale: "ta" }),
      });

      render(element);

      expect(screen.getByTestId("report-center-view")).toBeInTheDocument();
      expect(screen.getByText("Type: village")).toBeInTheDocument();
      expect(screen.getByText("Locale: ta")).toBeInTheDocument();
    });
  });
});
