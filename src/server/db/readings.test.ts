import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/db/types";

import { insertReadingsIdempotently, listLatestReadings, listReadings } from "./readings";

function unusedClient(): SupabaseClient<Database> {
  return {
    from: vi.fn(() => {
      throw new Error("Invalid repository input reached the client.");
    }),
  } as unknown as SupabaseClient<Database>;
}

describe("reading repository", () => {
  it("validates time-series filters and limits before querying", async () => {
    await expect(
      listReadings(unusedClient(), {
        node_id: "6f97eb8c-d0dd-4a29-8af8-3931d8b50634",
        limit: 1001,
      }),
    ).rejects.toThrow();
  });

  it("rejects malformed reading payloads before insert", async () => {
    await expect(insertReadingsIdempotently(unusedClient(), [])).rejects.toThrow(/too_small/i);
  });

  it("returns an empty latest-reading result without a database round trip", async () => {
    await expect(listLatestReadings(unusedClient(), [])).resolves.toEqual([]);
  });
});
