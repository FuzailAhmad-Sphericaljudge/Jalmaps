import type { SupabaseClient } from "@supabase/supabase-js";

export const REPORTS_STORAGE_BUCKET = "reports";

/**
 * Uploads a generated report buffer (PDF, CSV, Excel) to the reports Supabase Storage bucket.
 * Returns the written byte length.
 */
export async function uploadReportFile(
  supabase: SupabaseClient,
  storagePath: string,
  buffer: Buffer,
  mimeType: string,
): Promise<number> {
  const { error } = await supabase.storage
    .from(REPORTS_STORAGE_BUCKET)
    .upload(storagePath, buffer, {
      contentType: mimeType,
      upsert: true,
    });

  if (error) {
    throw new Error(`Failed to upload report file to storage: ${error.message}`);
  }

  return buffer.length;
}

/**
 * Generates a short-lived signed URL for report download (default 1 hour = 3600s).
 */
export async function getReportSignedUrl(
  supabase: SupabaseClient,
  storagePath: string,
  expiresInSeconds: number = 3600,
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(REPORTS_STORAGE_BUCKET)
    .createSignedUrl(storagePath, expiresInSeconds);

  if (error || !data?.signedUrl) {
    throw new Error(`Failed to create signed URL for report: ${error?.message ?? storagePath}`);
  }

  return data.signedUrl;
}

/**
 * Deletes a report file from storage.
 */
export async function deleteReportFile(
  supabase: SupabaseClient,
  storagePath: string,
): Promise<void> {
  const { error } = await supabase.storage.from(REPORTS_STORAGE_BUCKET).remove([storagePath]);

  if (error) {
    throw new Error(`Failed to delete report file: ${error.message}`);
  }
}
