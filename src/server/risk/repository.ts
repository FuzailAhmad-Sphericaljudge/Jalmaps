import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/lib/db/types";
import type { RiskBand, RiskConfidence } from "@/lib/risk/model-v1";

export interface StoredAreaRiskScore {
  id: string;
  area_id: string;
  model_version: string;
  as_of: string;
  score: number;
  band: RiskBand;
  components: Json;
  confidence: RiskConfidence;
  created_at: string;
}

export interface UpsertRiskScoreInput {
  area_id: string;
  model_version?: string;
  as_of?: string;
  score: number;
  band: RiskBand;
  components: Record<string, unknown>;
  confidence: RiskConfidence;
}

/**
 * Persists an explainable risk score into the area_risk_scores table.
 */
export async function upsertAreaRiskScore(
  client: SupabaseClient<Database>,
  input: UpsertRiskScoreInput,
): Promise<StoredAreaRiskScore> {
  const modelVersion = input.model_version ?? "risk_v1";
  const asOf = input.as_of ?? new Date().toISOString().slice(0, 10);

  const { data, error } = await client
    .from("area_risk_scores")
    .upsert(
      {
        area_id: input.area_id,
        model_version: modelVersion,
        as_of: asOf,
        score: input.score,
        band: input.band,
        components: input.components as unknown as NonNullable<Json>,
        confidence: input.confidence,
      },
      { onConflict: "area_id,model_version,as_of" },
    )
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to upsert area risk score: ${error?.message ?? "Unknown error"}`);
  }

  return data as unknown as StoredAreaRiskScore;
}

/**
 * Retrieves the most recent risk score for an administrative area.
 */
export async function getLatestAreaRiskScore(
  client: SupabaseClient<Database>,
  areaId: string,
  modelVersion = "risk_v1",
): Promise<StoredAreaRiskScore | null> {
  const { data, error } = await client
    .from("area_risk_scores")
    .select("*")
    .eq("area_id", areaId)
    .eq("model_version", modelVersion)
    .order("as_of", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load area risk score: ${error.message}`);
  }

  return (data as unknown as StoredAreaRiskScore) ?? null;
}

/**
 * Bulk loads the latest risk score for multiple areas.
 */
export async function listLatestAreaRiskScores(
  client: SupabaseClient<Database>,
  areaIds: string[],
  modelVersion = "risk_v1",
): Promise<Map<string, StoredAreaRiskScore>> {
  if (areaIds.length === 0) return new Map();

  const { data, error } = await client
    .from("area_risk_scores")
    .select("*")
    .in("area_id", areaIds)
    .eq("model_version", modelVersion)
    .order("as_of", { ascending: false });

  if (error) {
    throw new Error(`Failed to load risk scores: ${error.message}`);
  }

  const result = new Map<string, StoredAreaRiskScore>();
  for (const row of (data as unknown as StoredAreaRiskScore[]) ?? []) {
    if (!result.has(row.area_id)) {
      result.set(row.area_id, row);
    }
  }

  return result;
}
