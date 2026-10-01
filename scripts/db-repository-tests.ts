import { strict as assert } from "node:assert";

import { createClient } from "@supabase/supabase-js";

import { getEnv } from "../src/lib/env";
import type { Database } from "../src/lib/db/types";
import { DatabaseError } from "../src/server/db/errors";
import { listNodes } from "../src/server/db/nodes";
import { insertReadingsIdempotently, listLatestReadings } from "../src/server/db/readings";
import { listWells } from "../src/server/db/wells";

const { NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = getEnv();
const client = createClient<Database>(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    detectSessionInUrl: false,
    persistSession: false,
  },
});

const recordedAt = "2099-01-01T00:00:00.000Z";
let nodeId: string | undefined;

async function main(): Promise<void> {
  try {
    const wells = await listWells(client, { limit: 100 });
    assert.equal(wells.length, 30, "seed data creates thirty wells");

    const well = wells[0];
    assert.ok(well, "at least one seeded well exists");
    const nodes = await listNodes(client, { well_id: well.id });
    assert.equal(nodes.length, 1, "each seeded well has one simulated node");
    const node = nodes[0];
    assert.ok(node, "the selected well has a seeded node");
    assert.equal(node.is_simulated, true, "the selected node is a development fixture");
    const testNodeId = node.id;
    nodeId = testNodeId;

    const sample = {
      node_id: testNodeId,
      recorded_at: recordedAt,
      column_m: 8.5,
      depth_to_water_m: 21.5,
      quality: "good" as const,
    };
    const inserted = await insertReadingsIdempotently(client, [sample]);
    assert.equal(inserted.length, 1, "the first unique reading is inserted");

    const duplicate = await insertReadingsIdempotently(client, [sample]);
    assert.equal(duplicate.length, 0, "retrying the same reading is a no-op");

    const latest = await listLatestReadings(client, [testNodeId]);
    const latestReading = latest[0];
    assert.ok(latestReading, "latest-reading repository returns the node's latest row");
    const latestRecordedAt = latestReading.recorded_at;
    assert.ok(latestRecordedAt, "the latest row has a recorded time");
    assert.equal(
      Date.parse(latestRecordedAt),
      Date.parse(recordedAt),
      "latest-reading repository sees the new row",
    );
  } finally {
    if (nodeId) {
      const { error } = await client
        .from("readings")
        .delete()
        .eq("node_id", nodeId)
        .eq("recorded_at", recordedAt);
      if (error) {
        throw new DatabaseError(error, "clean up repository test reading");
      }
    }
  }

  console.log("Repository integration tests passed against the local Supabase database.");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
