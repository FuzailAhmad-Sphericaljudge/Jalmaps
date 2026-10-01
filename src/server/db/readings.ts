import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/db/types";
import { readingCreateSchema, readingQuerySchema } from "@/lib/schemas/readings";
import { uuidSchema } from "@/lib/schemas/ids";
import { requireDatabaseData } from "@/server/db/errors";

export type Reading = Database["public"]["Tables"]["readings"]["Row"];
export type LatestReading = Database["public"]["Views"]["latest_reading"]["Row"];
const nodeIdsSchema = uuidSchema.array();

export async function listReadings(
  client: SupabaseClient<Database>,
  input: unknown,
): Promise<Reading[]> {
  const queryInput = readingQuerySchema.parse(input);
  let query = client
    .from("readings")
    .select("*")
    .eq("node_id", queryInput.node_id)
    .order("recorded_at", { ascending: false })
    .limit(queryInput.limit);

  if (queryInput.from) {
    query = query.gte("recorded_at", queryInput.from);
  }
  if (queryInput.to) {
    query = query.lte("recorded_at", queryInput.to);
  }

  const { data, error } = await query;
  return requireDatabaseData(data, error, "list readings");
}

export async function listLatestReadings(
  client: SupabaseClient<Database>,
  nodeIds: string[],
): Promise<LatestReading[]> {
  const ids = nodeIdsSchema.parse(nodeIds);
  if (ids.length === 0) {
    return [];
  }

  const { data, error } = await client.from("latest_reading").select("*").in("node_id", ids);
  return requireDatabaseData(data, error, "list latest readings");
}

export async function insertReadingsIdempotently(
  client: SupabaseClient<Database>,
  input: unknown,
): Promise<Reading[]> {
  const rows = readingCreateSchema.array().min(1).parse(input);
  const { data, error } = await client
    .from("readings")
    .upsert(rows, {
      onConflict: "node_id,recorded_at",
      ignoreDuplicates: true,
    })
    .select();
  return requireDatabaseData(data, error, "insert readings idempotently");
}
