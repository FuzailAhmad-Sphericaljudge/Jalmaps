import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/db/types";
import { wellCreateSchema, wellFiltersSchema } from "@/lib/schemas/wells";
import { requireDatabaseData } from "@/server/db/errors";

export type Well = Database["public"]["Tables"]["wells"]["Row"];

export async function listWells(
  client: SupabaseClient<Database>,
  input: unknown = {},
): Promise<Well[]> {
  const filters = wellFiltersSchema.parse(input);
  let query = client.from("wells").select("*");

  if (filters.admin_area_id) {
    query = query.eq("admin_area_id", filters.admin_area_id);
  }
  if (filters.owner_id) {
    query = query.eq("owner_id", filters.owner_id);
  }
  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  const { data, error } = await query
    .order("created_at", { ascending: false })
    .limit(filters.limit);
  return requireDatabaseData(data, error, "list wells");
}

export async function createWell(client: SupabaseClient<Database>, input: unknown): Promise<Well> {
  const payload = wellCreateSchema.parse(input);
  const { data, error } = await client.from("wells").insert(payload).select().single();
  return requireDatabaseData(data, error, "create well");
}
