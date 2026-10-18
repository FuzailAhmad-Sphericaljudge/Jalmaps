import crypto from "node:crypto";
import { getEnv } from "@/lib/env";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/db/types";

const PREFIX_LENGTH = 8;
const SECRET_LENGTH = 32;

export const VALID_SCOPES = ["stats:read", "risk:read", "timeseries:read"] as const;
export type InsurerScope = (typeof VALID_SCOPES)[number];

export interface InsurerKeyPayload {
  id: string;
  name: string;
  keyString: string;
  keyPrefix: string;
  scopes: InsurerScope[];
  isSandbox: boolean;
  rateLimitPerMin: number;
  monthlyQuota: number;
  expiresAt: string | null;
  createdAt: string;
}

export interface VerifiedInsurerKey {
  id: string;
  userId: string;
  name: string;
  scopes: InsurerScope[];
  isSandbox: boolean;
  rateLimitPerMin: number;
  monthlyQuota: number;
  revokedAt: string | null;
  expiresAt: string | null;
}

/**
 * Creates an HMAC-SHA256 hash using the environment pepper.
 */
export function hashInsurerSecret(secret: string): string {
  const pepper = getEnv().INGEST_PEPPER;
  return crypto.createHmac("sha256", pepper).update(secret).digest("hex");
}

/**
 * Generates and stores a new insurer API key.
 * Plaintext secret is returned ONCE in keyString and never stored in the database.
 */
export async function generateInsurerKey(
  client: SupabaseClient<Database>,
  params: {
    userId: string;
    name: string;
    scopes?: InsurerScope[];
    isSandbox?: boolean;
    expiresInDays?: number;
    rateLimitPerMin?: number;
    monthlyQuota?: number;
  },
): Promise<InsurerKeyPayload> {
  const prefixBuf = crypto.randomBytes(PREFIX_LENGTH);
  const secretBuf = crypto.randomBytes(SECRET_LENGTH);

  const prefix = prefixBuf.toString("hex").substring(0, PREFIX_LENGTH);
  const secret = secretBuf.toString("base64url");
  const isSandbox = params.isSandbox ?? false;
  const envTag = isSandbox ? "test" : "live";

  const keyString = `jlp_${envTag}_${prefix}_${secret}`;
  const keyPrefix = `jlp_${envTag}_${prefix}`;
  const keyHash = hashInsurerSecret(secret);

  const scopes = params.scopes ?? [...VALID_SCOPES];
  const rateLimitPerMin = params.rateLimitPerMin ?? 60;
  const monthlyQuota = params.monthlyQuota ?? 50000;

  const expiresAt = params.expiresInDays
    ? new Date(Date.now() + params.expiresInDays * 24 * 60 * 60 * 1000).toISOString()
    : null;

  const { data, error } = await client
    .from("insurer_api_keys")
    .insert({
      user_id: params.userId,
      name: params.name,
      key_prefix: keyPrefix,
      key_hash: keyHash,
      scopes,
      is_sandbox: isSandbox,
      rate_limit_per_min: rateLimitPerMin,
      monthly_quota: monthlyQuota,
      expires_at: expiresAt,
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to create insurer API key: ${error?.message ?? "Insert failed"}`);
  }

  return {
    id: data.id,
    name: data.name,
    keyString,
    keyPrefix,
    scopes: data.scopes as InsurerScope[],
    isSandbox: data.is_sandbox,
    rateLimitPerMin: data.rate_limit_per_min,
    monthlyQuota: data.monthly_quota,
    expiresAt: data.expires_at,
    createdAt: data.created_at,
  };
}

/**
 * Verifies an incoming Bearer key using constant-time comparison.
 * Checks revocation, expiry, and returns key metadata.
 */
export async function verifyInsurerKey(
  client: SupabaseClient<Database>,
  authHeader: string | null | undefined,
): Promise<VerifiedInsurerKey | null> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.substring(7).trim();
  const parts = token.split("_");
  // Expected format: jlp_{live|test}_{prefix}_{secret}
  if (parts.length !== 4 || parts[0] !== "jlp") {
    return null;
  }

  const [, envTag, prefix, secret] = parts;
  if (!envTag || !prefix || !secret) {
    return null;
  }

  const keyPrefix = `jlp_${envTag}_${prefix}`;

  const { data: keyRecord, error } = await client
    .from("insurer_api_keys")
    .select("*")
    .eq("key_prefix", keyPrefix)
    .maybeSingle();

  if (error || !keyRecord) {
    return null;
  }

  // Revocation check
  if (keyRecord.revoked_at) {
    return null;
  }

  // Expiry check
  if (keyRecord.expires_at && new Date(keyRecord.expires_at) < new Date()) {
    return null;
  }

  // Constant-time HMAC comparison
  const candidateHash = hashInsurerSecret(secret);
  const storedHashBuf = Buffer.from(keyRecord.key_hash, "hex");
  const candidateHashBuf = Buffer.from(candidateHash, "hex");

  if (
    storedHashBuf.length !== candidateHashBuf.length ||
    !crypto.timingSafeEqual(storedHashBuf, candidateHashBuf)
  ) {
    return null;
  }

  // Asynchronously update last_used_at (non-blocking)
  void client
    .from("insurer_api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", keyRecord.id);

  return {
    id: keyRecord.id,
    userId: keyRecord.user_id,
    name: keyRecord.name,
    scopes: keyRecord.scopes as InsurerScope[],
    isSandbox: keyRecord.is_sandbox,
    rateLimitPerMin: keyRecord.rate_limit_per_min,
    monthlyQuota: keyRecord.monthly_quota,
    revokedAt: keyRecord.revoked_at,
    expiresAt: keyRecord.expires_at,
  };
}

/**
 * Revokes an insurer API key immediately.
 */
export async function revokeInsurerKey(
  client: SupabaseClient<Database>,
  keyId: string,
  userId: string,
): Promise<boolean> {
  const { data, error } = await client
    .from("insurer_api_keys")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", keyId)
    .eq("user_id", userId)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return false;
  }

  return true;
}

/**
 * Rotates an existing key: revokes old key and issues a replacement with the same scopes.
 */
export async function rotateInsurerKey(
  client: SupabaseClient<Database>,
  oldKeyId: string,
  userId: string,
): Promise<InsurerKeyPayload> {
  const { data: existing, error } = await client
    .from("insurer_api_keys")
    .select("*")
    .eq("id", oldKeyId)
    .eq("user_id", userId)
    .single();

  if (error || !existing) {
    throw new Error("Cannot rotate non-existent key");
  }

  // Revoke old key
  await revokeInsurerKey(client, oldKeyId, userId);

  // Generate new key with matching properties
  return generateInsurerKey(client, {
    userId,
    name: `${existing.name} (Rotated)`,
    scopes: existing.scopes as InsurerScope[],
    isSandbox: existing.is_sandbox,
    rateLimitPerMin: existing.rate_limit_per_min,
    monthlyQuota: existing.monthly_quota,
  });
}

/**
 * Lists all keys owned by an insurer user without plaintext secrets.
 */
export async function listInsurerKeys(client: SupabaseClient<Database>, userId: string) {
  const { data, error } = await client
    .from("insurer_api_keys")
    .select(
      "id, name, key_prefix, scopes, is_sandbox, rate_limit_per_min, monthly_quota, revoked_at, expires_at, created_at, last_used_at",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to list insurer keys: ${error.message}`);
  }

  return data ?? [];
}
