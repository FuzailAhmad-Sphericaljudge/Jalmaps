import crypto from "node:crypto";
import { getEnv } from "@/lib/env";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/db/types";

const PREFIX_LENGTH = 8;
const SECRET_LENGTH = 32;

export interface NodeKeyPayload {
  hardwareId: string;
  keyString: string;
}

/**
 * Creates an HMAC-SHA256 hash using the environment pepper.
 */
export function hashKey(secret: string): string {
  const pepper = getEnv().INGEST_PEPPER;
  return crypto.createHmac("sha256", pepper).update(secret).digest("hex");
}

/**
 * Issues a new API key for a node and stores its hash.
 * If the hardware_id doesn't exist, it creates a new node in provisioning state.
 */
export async function issueNodeKey(
  db: SupabaseClient<Database>,
  wellId: string,
  hardwareId: string,
): Promise<NodeKeyPayload> {
  // Generate random strings for prefix and secret
  const prefixBuf = crypto.randomBytes(PREFIX_LENGTH);
  const secretBuf = crypto.randomBytes(SECRET_LENGTH);

  const prefix = prefixBuf.toString("hex").substring(0, PREFIX_LENGTH);
  const secret = secretBuf.toString("base64url");
  const keyString = `jm_live_${prefix}_${secret}`;
  const keyHash = hashKey(secret);

  // Upsert the node. Assuming hardwareId is unique.
  const { error } = await db.from("nodes").upsert(
    {
      well_id: wellId,
      hardware_id: hardwareId,
      api_key_prefix: prefix,
      api_key_hash: keyHash,
      revoked_at: null, // Reset revocation on reissue
    },
    { onConflict: "hardware_id" },
  );

  if (error) {
    throw new Error(`Failed to issue node key: ${error.message}`);
  }

  return { hardwareId, keyString };
}

/**
 * Verifies a node key. Uses constant-time comparison for the hash.
 * Returns the node ID if valid and not revoked, otherwise null.
 */
export async function verifyNodeKey(
  db: SupabaseClient<Database>,
  keyString: string,
  hardwareId: string,
): Promise<string | null> {
  const parts = keyString.split("_");
  if (parts.length !== 4 || parts[0] !== "jm" || parts[1] !== "live") {
    return null; // Malformed
  }

  const prefix = parts[2];
  const secret = parts[3];

  if (!prefix || !secret) {
    return null;
  }

  const providedHash = hashKey(secret);

  const { data, error } = await db
    .from("nodes")
    .select("id, api_key_hash, revoked_at")
    .eq("hardware_id", hardwareId)
    .eq("api_key_prefix", prefix)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  if (data.revoked_at !== null) {
    return null;
  }

  if (!data.api_key_hash) {
    return null;
  }

  // Constant-time comparison
  const storedHashBuf = Buffer.from(data.api_key_hash);
  const providedHashBuf = Buffer.from(providedHash);

  if (storedHashBuf.length !== providedHashBuf.length) {
    return null;
  }

  if (!crypto.timingSafeEqual(storedHashBuf, providedHashBuf)) {
    return null;
  }

  return data.id;
}

/**
 * Revokes a node's API key.
 */
export async function revokeNodeKey(
  db: SupabaseClient<Database>,
  hardwareId: string,
): Promise<void> {
  const { error } = await db
    .from("nodes")
    .update({ revoked_at: new Date().toISOString() })
    .eq("hardware_id", hardwareId);

  if (error) {
    throw new Error(`Failed to revoke key: ${error.message}`);
  }
}
