import { createHash, randomBytes } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/db/types";
import { getReportSignedUrl } from "./storage";

export interface CreateShareResult {
  token: string;
  shareUrl: string;
  expiresAt: string;
}

export interface ResolvedShareResult {
  valid: boolean;
  error?: "not_found" | "expired" | "revoked";
  reportId?: string;
  reportType?: string;
  reportFormat?: string;
  signedDownloadUrl?: string;
  expiresAt?: string;
  accessCount?: number;
}

/**
 * Creates an expiring share link for a generated report.
 * Uses a hashed token in the database to prevent token leakage from storage leaks.
 * Maximum expiry is strictly capped at 30 days.
 */
export async function createReportShare(
  supabase: SupabaseClient<Database>,
  reportId: string,
  userId: string,
  options: { expiryDays?: number; baseUrl?: string } = {},
): Promise<CreateShareResult> {
  const expiryDays = Math.min(Math.max(options.expiryDays ?? 30, 1), 30);
  const rawToken = randomBytes(24).toString("hex");
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");

  const expiresAt = new Date(Date.now() + expiryDays * 86400 * 1000).toISOString();
  const baseUrl = options.baseUrl ?? "https://jalmaps.in";

  const { error } = await supabase.from("report_shares").insert({
    report_id: reportId,
    token_hash: tokenHash,
    created_by: userId,
    expires_at: expiresAt,
  });

  if (error) {
    throw new Error(`Failed to create report share link: ${error.message}`);
  }

  const shareUrl = `${baseUrl}/share/${rawToken}`;

  return {
    token: rawToken,
    shareUrl,
    expiresAt,
  };
}

/**
 * Resolves a shared report link by raw token.
 * Validates expiration, revocation, and increments the access counter.
 */
export async function resolveReportShare(
  supabase: SupabaseClient<Database>,
  rawToken: string,
): Promise<ResolvedShareResult> {
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");

  // Query share record
  const { data: share, error } = await supabase
    .from("report_shares")
    .select(
      `
      id,
      report_id,
      expires_at,
      revoked_at,
      access_count,
      reports (
        id,
        type,
        format,
        storage_path,
        status,
        expires_at
      )
    `,
    )
    .eq("token_hash", tokenHash)
    .single();

  if (error || !share) {
    return { valid: false, error: "not_found" };
  }

  if (share.revoked_at) {
    return { valid: false, error: "revoked" };
  }

  const now = new Date();
  if (new Date(share.expires_at) < now) {
    return { valid: false, error: "expired" };
  }

  const report = share.reports as {
    id: string;
    type: string;
    format: string;
    storage_path: string | null;
    status: string;
    expires_at: string;
  } | null;

  if (!report || report.status !== "done" || !report.storage_path) {
    return { valid: false, error: "not_found" };
  }

  // Increment access count
  await supabase
    .from("report_shares")
    .update({
      access_count: (share.access_count ?? 0) + 1,
      last_accessed_at: now.toISOString(),
    })
    .eq("id", share.id);

  // Generate short-lived signed URL (1 hour)
  let signedDownloadUrl: string | undefined;
  try {
    signedDownloadUrl = await getReportSignedUrl(supabase, report.storage_path, 3600);
  } catch {
    signedDownloadUrl = undefined;
  }

  return {
    valid: true,
    reportId: report.id,
    reportType: report.type,
    reportFormat: report.format,
    signedDownloadUrl,
    expiresAt: share.expires_at,
    accessCount: (share.access_count ?? 0) + 1,
  };
}

/**
 * Immediately revokes an active report share link.
 */
export async function revokeReportShare(
  supabase: SupabaseClient<Database>,
  shareId: string,
  userId: string,
): Promise<void> {
  const { error } = await supabase
    .from("report_shares")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", shareId)
    .eq("created_by", userId);

  if (error) {
    throw new Error(`Failed to revoke report share: ${error.message}`);
  }
}
