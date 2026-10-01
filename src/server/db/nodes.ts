import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/db/types";
import { nodeCreateSchema, nodeFiltersSchema } from "@/lib/schemas/nodes";
import { requireDatabaseData } from "@/server/db/errors";

export type Node = Database["public"]["Tables"]["nodes"]["Row"];
export type SafeNode = Omit<Node, "api_key_hash">;

const safeNodeColumns =
  "id,well_id,hardware_id,sensor_model,range_m,hang_depth_m,calibration_offset_m,firmware_version,battery_v,signal_rssi,last_seen_at,status,is_simulated,created_at,updated_at";

export async function listNodes(
  client: SupabaseClient<Database>,
  input: unknown,
): Promise<SafeNode[]> {
  const filters = nodeFiltersSchema.parse(input);
  let query = client.from("nodes").select(safeNodeColumns).eq("well_id", filters.well_id);

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  const { data, error } = await query.order("created_at", { ascending: false });
  return requireDatabaseData(data, error, "list nodes");
}

export async function registerNode(
  client: SupabaseClient<Database>,
  input: unknown,
): Promise<SafeNode> {
  const payload = nodeCreateSchema.parse(input);
  const { data, error } = await client
    .from("nodes")
    .insert(payload)
    .select(safeNodeColumns)
    .single();
  return requireDatabaseData(data, error, "register node");
}
