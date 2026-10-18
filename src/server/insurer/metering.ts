import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/db/types";
import type { VerifiedInsurerKey } from "./keys";

export interface RateLimitStatus {
  allowed: boolean;
  reason?: "rate_limit_exceeded" | "monthly_quota_exceeded";
  retryAfterSeconds?: number;
  remainingPerMin: number;
}

export interface DailyUsageRollup {
  date: string;
  requests: number;
  bytes: number;
}

/**
 * Records an API request into the api_usage audit table.
 */
export async function recordApiUsage(
  client: SupabaseClient<Database>,
  params: {
    keyId: string;
    endpoint: string;
    status: number;
    bytes?: number;
  },
): Promise<void> {
  const { error } = await client.from("api_usage").insert({
    key_id: params.keyId,
    endpoint: params.endpoint,
    status: params.status,
    bytes: params.bytes ?? 0,
    ts: new Date().toISOString(),
  });

  if (error) {
    console.error("Failed to record api usage:", error.message);
  }
}

/**
 * Enforces sliding-window rate limit (requests/minute) and monthly quota.
 */
export async function checkRateLimitAndQuota(
  client: SupabaseClient<Database>,
  key: VerifiedInsurerKey,
): Promise<RateLimitStatus> {
  const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

  // 1. Check minute sliding window
  const { count: minCount, error: minError } = await client
    .from("api_usage")
    .select("id", { count: "exact", head: true })
    .eq("key_id", key.id)
    .gte("ts", oneMinuteAgo);

  if (minError) {
    console.warn("Could not evaluate minute rate limit, failing open safely:", minError.message);
  } else if ((minCount ?? 0) >= key.rateLimitPerMin) {
    return {
      allowed: false,
      reason: "rate_limit_exceeded",
      retryAfterSeconds: 60,
      remainingPerMin: 0,
    };
  }

  // 2. Check monthly quota
  const { count: monthCount, error: monthError } = await client
    .from("api_usage")
    .select("id", { count: "exact", head: true })
    .eq("key_id", key.id)
    .gte("ts", startOfMonth);

  if (monthError) {
    console.warn("Could not evaluate monthly quota, failing open safely:", monthError.message);
  } else if ((monthCount ?? 0) >= key.monthlyQuota) {
    return {
      allowed: false,
      reason: "monthly_quota_exceeded",
      retryAfterSeconds: 3600,
      remainingPerMin: 0,
    };
  }

  const remaining = Math.max(0, key.rateLimitPerMin - (minCount ?? 0));
  return {
    allowed: true,
    remainingPerMin: remaining,
  };
}

/**
 * Returns daily aggregate usage for an API key over the requested window.
 */
export async function getDailyUsageRollup(
  client: SupabaseClient<Database>,
  keyId: string,
  days = 30,
): Promise<DailyUsageRollup[]> {
  const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await client
    .from("api_usage")
    .select("ts, bytes")
    .eq("key_id", keyId)
    .gte("ts", sinceDate);

  if (error || !data) {
    return [];
  }

  // Group by calendar date (YYYY-MM-DD)
  const grouped = new Map<string, { requests: number; bytes: number }>();

  for (const item of data) {
    const d = item.ts.slice(0, 10);
    const existing = grouped.get(d) ?? { requests: 0, bytes: 0 };
    existing.requests++;
    existing.bytes += item.bytes ?? 0;
    grouped.set(d, existing);
  }

  return Array.from(grouped.entries())
    .map(([date, val]) => ({
      date,
      requests: val.requests,
      bytes: val.bytes,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
