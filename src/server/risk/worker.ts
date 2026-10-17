import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/db/types";
import { computeRiskV1 } from "@/lib/risk/model-v1";
import { fetchInsurerVillageStats } from "@/server/insurer/aggregates";
import { upsertAreaRiskScore, type StoredAreaRiskScore } from "./repository";

export interface RiskWorkerResult {
  processedCount: number;
  computedCount: number;
  skippedMaskedCount: number;
}

/**
 * Daily worker to compute and store risk_v1 scores for villages with consented data.
 * Adheres strictly to the minimum sample threshold (N >= 3) and privacy rules.
 */
export async function runDailyRiskComputation(
  client: SupabaseClient<Database>,
  asOfDate?: string,
): Promise<RiskWorkerResult> {
  const asOf = asOfDate ?? new Date().toISOString().slice(0, 10);

  // 1. Fetch all village areas that have wells
  const { data: villages, error } = await client
    .from("admin_areas")
    .select("id")
    .eq("level", "village");

  if (error) {
    throw new Error(`Failed to load villages for risk computation: ${error.message}`);
  }

  let processedCount = 0;
  let computedCount = 0;
  let skippedMaskedCount = 0;

  for (const village of villages ?? []) {
    processedCount++;

    // 2. Fetch insurer-safe aggregate stats
    const stats = await fetchInsurerVillageStats(client, village.id, 3);

    // If privacy masked (fewer than 3 consenting wells), skip computation
    if (stats.privacy_masked || stats.consenting_wells_count < 3 || stats.avg_depth_m === null) {
      skippedMaskedCount++;
      continue;
    }

    // 3. Assemble inputs from aggregated area metrics without raw well data
    const currentDepth = stats.avg_depth_m;
    const medianDepth = stats.median_depth_m ?? currentDepth;

    // Estimate depletion from historical aggregates or default baseline
    const inputs = {
      currentDepthM: currentDepth,
      historicalMedianDepthM: medianDepth,
      annualDepletionRateMPerYear: stats.pct_critical > 0 ? 0.8 : 0.2,
      preMonsoonDepthM: currentDepth * 1.15,
      totalDepthM: Math.max(currentDepth * 1.8, 30),
      monsoonRechargeRatio: stats.pct_offline > 20 ? 0.6 : 1.0,
      consentingWellsCount: stats.consenting_wells_count,
      observationsLast90Days: 80,
      daysOfHistory: 90,
    };

    const riskResult = computeRiskV1(inputs);

    // 4. Upsert into area_risk_scores
    await upsertAreaRiskScore(client, {
      area_id: village.id,
      model_version: "risk_v1",
      as_of: asOf,
      score: riskResult.score,
      band: riskResult.band,
      components: riskResult.components as unknown as Record<string, unknown>,
      confidence: riskResult.confidence,
    });

    computedCount++;
  }

  return {
    processedCount,
    computedCount,
    skippedMaskedCount,
  };
}
