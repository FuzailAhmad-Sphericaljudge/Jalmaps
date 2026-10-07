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

export async function listWellsForUser(client: SupabaseClient<Database>, userId: string) {
  const { data, error } = await client
    .from("wells")
    .select(
      `
      *,
      nodes (*),
      well_members!inner (user_id, role)
    `,
    )
    .or(`owner_id.eq.${userId},well_members.user_id.eq.${userId}`);
  return requireDatabaseData(data, error, "list wells for user");
}

export async function getWell(client: SupabaseClient<Database>, wellId: string) {
  const { data, error } = await client
    .from("wells")
    .select("*, nodes (*)")
    .eq("id", wellId)
    .single();
  return requireDatabaseData(data, error, "get well");
}

export async function updateWell(
  client: SupabaseClient<Database>,
  wellId: string,
  payload: unknown,
) {
  const { data, error } = await client
    .from("wells")
    .update(payload)
    .eq("id", wellId)
    .select()
    .single();
  return requireDatabaseData(data, error, "update well");
}

export async function getWellNode(client: SupabaseClient<Database>, wellId: string) {
  const { data, error } = await client
    .from("nodes")
    .select("*")
    .eq("well_id", wellId)
    .neq("status", "retired")
    .neq("status", "fault")
    .single();

  if (error && error.code === "PGRST116") {
    return null; // no row
  }
  return requireDatabaseData(data, error, "get well node");
}

export async function createNode(
  client: SupabaseClient<Database>,
  wellId: string,
  hardwareId: string,
  settings: Record<string, unknown>,
) {
  const { data, error } = await client
    .from("nodes")
    .insert({
      well_id: wellId,
      hardware_id: hardwareId,
      status: "provisioning",
      is_simulated: false,
      ...settings,
    })
    .select()
    .single();
  return requireDatabaseData(data, error, "create node");
}

export async function updateNodeSettings(
  client: SupabaseClient<Database>,
  nodeId: string,
  settings: Record<string, unknown>,
  actorId: string,
) {
  const { data, error } = await client
    .from("nodes")
    .update(settings)
    .eq("id", nodeId)
    .select()
    .single();

  // Audit log
  await client.from("audit_log").insert({
    actor_id: actorId,
    entity_type: "node",
    entity_id: nodeId,
    action: "update_settings",
  });

  return requireDatabaseData(data, error, "update node settings");
}

export async function rotateNodeKey(
  client: SupabaseClient<Database>,
  nodeId: string,
  wellId: string,
  hardwareId: string,
  actorId: string,
) {
  // Logic is in src/server/ingest/keys.ts -> revokeNodeKey, issueNodeKey
  // For DB side we just need to log it
  await client.from("audit_log").insert({
    actor_id: actorId,
    entity_type: "node",
    entity_id: nodeId,
    action: "rotate_key",
  });
}

export async function retireNode(
  client: SupabaseClient<Database>,
  nodeId: string,
  actorId: string,
) {
  const { data, error } = await client
    .from("nodes")
    .update({ status: "retired" })
    .eq("id", nodeId)
    .select()
    .single();

  await client.from("audit_log").insert({
    actor_id: actorId,
    entity_type: "node",
    entity_id: nodeId,
    action: "retire",
  });

  return requireDatabaseData(data, error, "retire node");
}

export async function addWellMember(
  client: SupabaseClient<Database>,
  wellId: string,
  phoneNumber: string,
  role: string,
) {
  // Find user by phone
  const { data: profiles } = await client.from("profiles").select("id").eq("phone", phoneNumber);

  const profile = profiles?.[0];
  if (!profile) {
    throw new Error("NOT_FOUND");
  }

  const { data, error } = await client
    .from("well_members")
    .insert({
      well_id: wellId,
      user_id: profile.id,
      role,
    })
    .select()
    .single();
  return requireDatabaseData(data, error, "add well member");
}

export async function listWellMembers(client: SupabaseClient<Database>, wellId: string) {
  const { data, error } = await client
    .from("well_members")
    .select("*, profiles(phone, full_name)")
    .eq("well_id", wellId);
  return requireDatabaseData(data, error, "list well members");
}
