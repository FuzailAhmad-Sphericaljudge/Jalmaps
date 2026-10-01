import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/db/types";
import { nodeCreateSchema, nodeFiltersSchema } from "@/lib/schemas/nodes";
import { requireDatabaseData } from "@/server/db/errors";

export type Node = Database["public"]["Tables"]["nodes"]["Row"];

export async function listNodes(client: SupabaseClient<Database>, input: unknown): Promise<Node[]> {
  const filters = nodeFiltersSchema.parse(input);
  let query = client.from("nodes").select("*").eq("well_id", filters.well_id);

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  const { data, error } = await query.order("created_at", { ascending: false });
  return requireDatabaseData(data, error, "list nodes");
}

export async function registerNode(
  client: SupabaseClient<Database>,
  input: unknown,
): Promise<Node> {
  const payload = nodeCreateSchema.parse(input);
  const { data, error } = await client.from("nodes").insert(payload).select().single();
  return requireDatabaseData(data, error, "register node");
}
