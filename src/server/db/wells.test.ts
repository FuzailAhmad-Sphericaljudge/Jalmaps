import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/db/types";

import { createWell, listWells } from "./wells";

function unusedClient(): SupabaseClient<Database> {
  return {
    from: vi.fn(() => {
      throw new Error("Invalid repository input reached the client.");
    }),
  } as unknown as SupabaseClient<Database>;
}

describe("well repository", () => {
  it("validates filters before querying the database", async () => {
    await expect(listWells(unusedClient(), { admin_area_id: "not-a-uuid" })).rejects.toThrow();
  });

  it("validates well coordinates and metre dimensions before insert", async () => {
    await expect(
      createWell(unusedClient(), {
        admin_area_id: "6f97eb8c-d0dd-4a29-8af8-3931d8b50634",
        name: "Test well",
        well_type: "borewell",
        latitude: 95,
        longitude: 78,
      }),
    ).rejects.toThrow(/too_big|less than or equal/i);
  });
});
