import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/db/types";

import { listNodes, registerNode } from "./nodes";

function unusedClient(): SupabaseClient<Database> {
  return {
    from: vi.fn(() => {
      throw new Error("Invalid repository input reached the client.");
    }),
  } as unknown as SupabaseClient<Database>;
}

describe("node repository", () => {
  it("requires a well id when listing nodes", async () => {
    await expect(listNodes(unusedClient(), {})).rejects.toThrow();
  });

  it("rejects raw-looking node credentials instead of accepting them as hashes", async () => {
    await expect(
      registerNode(unusedClient(), {
        well_id: "6f97eb8c-d0dd-4a29-8af8-3931d8b50634",
        hardware_id: "JAL-001",
        api_key_hash: "not-a-sha256-hash",
      }),
    ).rejects.toThrow(/must match pattern/);
  });
});
