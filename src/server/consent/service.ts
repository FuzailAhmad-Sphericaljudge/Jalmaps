import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/db/types";

export interface ConsentStatus {
  dataSharingConsent: boolean;
  dataSharingConsentAt: string | null;
}

/**
 * Retrieves the current data sharing consent status for a user.
 */
export async function getConsentStatusForUser(
  client: SupabaseClient<Database>,
  userId: string,
): Promise<ConsentStatus> {
  const { data, error } = await client
    .from("profiles")
    .select("data_sharing_consent, data_sharing_consent_at")
    .eq("id", userId)
    .single();

  if (error || !data) {
    throw new Error(`Failed to load profile consent status: ${error?.message ?? "Not found"}`);
  }

  return {
    dataSharingConsent: data.data_sharing_consent ?? false,
    dataSharingConsentAt: data.data_sharing_consent_at,
  };
}

/**
 * Updates a farmer's anonymous data sharing consent.
 * Changes take immediate effect in future village aggregate calculations.
 * Updates are automatically recorded in audit_log via database trigger.
 */
export async function updateConsentForUser(
  client: SupabaseClient<Database>,
  userId: string,
  consent: boolean,
): Promise<ConsentStatus> {
  const now = new Date().toISOString();

  const { data, error } = await client
    .from("profiles")
    .update({
      data_sharing_consent: consent,
      data_sharing_consent_at: now,
    })
    .eq("id", userId)
    .select("data_sharing_consent, data_sharing_consent_at")
    .single();

  if (error || !data) {
    throw new Error(`Failed to update consent status: ${error?.message ?? "Update failed"}`);
  }

  return {
    dataSharingConsent: data.data_sharing_consent,
    dataSharingConsentAt: data.data_sharing_consent_at,
  };
}

