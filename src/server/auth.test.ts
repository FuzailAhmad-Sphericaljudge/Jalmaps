import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createServerComponentClient: vi.fn(),
  redirect: vi.fn((path: string): never => {
    throw new Error(`redirect:${path}`);
  }),
}));

vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/server/supabase/server-component", () => ({
  createServerComponentClient: mocks.createServerComponentClient,
}));

import type { SupabaseClient, User } from "@supabase/supabase-js";

import type { Database } from "@/lib/db/types";

import { requireRole, requireUser } from "./auth";

const user: User = {
  id: "c5d376a5-2005-4f49-80ec-8fecfd987c60",
  app_metadata: { provider: "phone", providers: ["phone"] },
  user_metadata: {},
  aud: "authenticated",
  created_at: "2026-10-01T00:00:00.000Z",
};

const profile: Database["public"]["Tables"]["profiles"]["Row"] = {
  id: user.id,
  full_name: "Test Farmer",
  phone: "+919000000001",
  preferred_locale: "en",
  preferred_unit: "m",
  preferred_text_size: "normal",
  preferred_theme: "system",
  role: "farmer",
  admin_area_id: null,
  crops: [],
  onboarding_completed_at: "2026-10-01T00:00:00.000Z",
  deleted_at: null,
  created_at: "2026-10-01T00:00:00.000Z",
  updated_at: "2026-10-01T00:00:00.000Z",
};

function setCurrentUser(currentProfile: typeof profile | null) {
  const client = {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: {} }, error: null }),
      getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn().mockResolvedValue({ data: currentProfile, error: null }),
        })),
      })),
    })),
  };
  mocks.createServerComponentClient.mockResolvedValue(
    client as unknown as SupabaseClient<Database>,
  );
}

describe("server authentication guards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects unauthenticated users to the active locale login page", async () => {
    const client = {
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      },
    };
    mocks.createServerComponentClient.mockResolvedValue(
      client as unknown as SupabaseClient<Database>,
    );

    await expect(requireUser("hi")).rejects.toThrow("redirect:/hi/login");
  });

  it("redirects users without completed onboarding to onboarding", async () => {
    setCurrentUser({ ...profile, onboarding_completed_at: null });

    await expect(requireUser("en")).rejects.toThrow("redirect:/en/onboarding");
  });

  it("redirects users who do not have the required role to a localized 403 page", async () => {
    setCurrentUser(profile);

    await expect(requireRole("hi", "admin")).rejects.toThrow("redirect:/hi/403");
  });

  it("returns a verified profile when the requested role matches", async () => {
    setCurrentUser(profile);

    await expect(requireRole("en", "farmer")).resolves.toMatchObject({
      user,
      profile,
    });
  });
});
