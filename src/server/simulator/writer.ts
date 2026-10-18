import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "../../lib/db/types";
import { insertReadingsIdempotently } from "../db/readings";
import { ReadingResult } from "./models";

export async function writeSimulationBatch(
  client: SupabaseClient<Database>,
  batch: ReadingResult[],
) {
  if (batch.length === 0) return;

  const rows = batch.map((r) => ({
    node_id: r.node_id,
    recorded_at: r.recorded_at.toISOString(),
    column_m: r.column_m,
    depth_to_water_m: r.depth_to_water_m,
    current_ma: r.current_ma,
    battery_v: r.battery_v,
    rssi: r.signal_rssi,
    quality: r.quality,
    raw: { sim: r.raw_sim },
  }));

  // Write readings
  await insertReadingsIdempotently(client, rows);

  // Update nodes (we take the last reading for each node)
  const nodeUpdates = new Map<string, (typeof rows)[0]>();
  for (const r of rows) {
    const existing = nodeUpdates.get(r.node_id);
    if (!existing || new Date(r.recorded_at) > new Date(existing.recorded_at)) {
      nodeUpdates.set(r.node_id, r);
    }
  }

  for (const [nodeId, r] of nodeUpdates.entries()) {
    const { error } = await client
      .from("nodes")
      .update({
        last_seen_at: r.recorded_at,
        battery_v: r.battery_v,
        signal_rssi: r.rssi,
      })
      .eq("id", nodeId)
      .eq("is_simulated", true); // Only touch simulated nodes!

    if (error) {
      console.warn(`Failed to update node ${nodeId} metadata:`, error);
    }
  }
}
