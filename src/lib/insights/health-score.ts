import type { DepletionEstimate } from "./depletion";
import type { MonsoonComparisonSummary } from "./monsoon";
import type { DataSufficiencyResult } from "./sufficiency";

export type AquiferHealthBand = "healthy" | "watch" | "stressed" | "critical";

export interface HealthScoreComponent {
  id: "trend" | "recharge" | "seasonal_buffer" | "data_confidence";
  labelKey: string;
  points: number;
  maxPoints: number;
  explanationKey: string;
  params: Record<string, string | number>;
}

export interface AquiferHealthScoreResult {
  version: "health_v1";
  score: number; // 0 - 100
  band: AquiferHealthBand;
  confidence: "high" | "medium" | "low";
  components: HealthScoreComponent[];
  summaryKey: string;
}

export interface HealthScoreInput {
  sufficiency: DataSufficiencyResult;
  monsoon: MonsoonComparisonSummary;
  depletion: DepletionEstimate;
  /**
   * Peak dry season (pre-monsoon / deepest) depth in metres.
   */
  peakDrySeasonDepthM: number | null;
  /**
   * Total well depth in metres, or historical baseline max depth.
   */
  wellDepthOrCriticalThresholdM?: number | null;
}

/**
 * Calculates the transparent Aquifer Health Score (algorithm `health_v1`).
 * Every component weight is deterministic, inspectable, and explainable to farmers and hydrogeologists.
 */
export function calculateAquiferHealthScore(input: HealthScoreInput): AquiferHealthScoreResult {
  const { sufficiency, monsoon, depletion, peakDrySeasonDepthM, wellDepthOrCriticalThresholdM } =
    input;

  // Component 1: Multi-year trend / depletion (Max: 35 points)
  let trendPoints = 20; // Default neutral if insufficient multi-year span
  let trendExplanationKey = "health_trend_baseline";
  let trendParams: Record<string, string | number> = {};

  if (depletion.hasEnoughYears && depletion.depletionRateMPerYear !== null) {
    const rate = depletion.depletionRateMPerYear;
    trendParams = { rate: Math.abs(rate) };
    if (rate <= 0) {
      trendPoints = 35;
      trendExplanationKey = "health_trend_recovering";
    } else if (rate <= 0.3) {
      trendPoints = 28;
      trendExplanationKey = "health_trend_mild_depletion";
    } else if (rate <= 0.7) {
      trendPoints = 18;
      trendExplanationKey = "health_trend_moderate_depletion";
    } else if (rate <= 1.5) {
      trendPoints = 8;
      trendExplanationKey = "health_trend_severe_depletion";
    } else {
      trendPoints = 0;
      trendExplanationKey = "health_trend_critical_depletion";
    }
  }

  // Component 2: Monsoon recharge response (Max: 30 points)
  let rechargePoints = 15;
  let rechargeExplanationKey = "health_recharge_unobserved";
  let rechargeParams: Record<string, string | number> = {};

  const latestMonsoon = monsoon.latestYear;
  if (latestMonsoon && latestMonsoon.netRiseM !== null) {
    const rise = latestMonsoon.netRiseM;
    rechargeParams = { rise };
    if (rise >= 4.0) {
      rechargePoints = 30;
      rechargeExplanationKey = "health_recharge_excellent";
    } else if (rise >= 2.5) {
      rechargePoints = 24;
      rechargeExplanationKey = "health_recharge_good";
    } else if (rise >= 1.0) {
      rechargePoints = 16;
      rechargeExplanationKey = "health_recharge_fair";
    } else if (rise >= 0.3) {
      rechargePoints = 8;
      rechargeExplanationKey = "health_recharge_poor";
    } else {
      rechargePoints = 0;
      rechargeExplanationKey = "health_recharge_none";
    }
  }

  // Component 3: Seasonal buffer remaining during peak dry season (Max: 25 points)
  let bufferPoints = 15;
  let bufferExplanationKey = "health_buffer_unknown_threshold";
  let bufferParams: Record<string, string | number> = {};

  if (
    peakDrySeasonDepthM !== null &&
    wellDepthOrCriticalThresholdM &&
    wellDepthOrCriticalThresholdM > 0
  ) {
    const waterColumnRemainingM = wellDepthOrCriticalThresholdM - peakDrySeasonDepthM;
    const ratioRemaining = waterColumnRemainingM / wellDepthOrCriticalThresholdM;
    bufferParams = {
      remainingM: Math.max(0, Math.round(waterColumnRemainingM * 10) / 10),
      percent: Math.round(Math.max(0, ratioRemaining) * 100),
    };

    if (ratioRemaining >= 0.5) {
      bufferPoints = 25;
      bufferExplanationKey = "health_buffer_ample";
    } else if (ratioRemaining >= 0.3) {
      bufferPoints = 18;
      bufferExplanationKey = "health_buffer_moderate";
    } else if (ratioRemaining >= 0.15) {
      bufferPoints = 10;
      bufferExplanationKey = "health_buffer_low";
    } else {
      bufferPoints = 2;
      bufferExplanationKey = "health_buffer_critical";
    }
  }

  // Component 4: Data Confidence Factor (Max: 10 points)
  let confidencePoints = 5;
  let confidenceExplanationKey = "health_confidence_partial";
  const coverageRatio = sufficiency.coverageRatio;

  if (sufficiency.isSufficient && coverageRatio >= 0.8) {
    confidencePoints = 10;
    confidenceExplanationKey = "health_confidence_high";
  } else if (sufficiency.isSufficient) {
    confidencePoints = 7;
    confidenceExplanationKey = "health_confidence_moderate";
  } else {
    confidencePoints = 3;
    confidenceExplanationKey = "health_confidence_insufficient";
  }

  const rawScore = trendPoints + rechargePoints + bufferPoints + confidencePoints;
  const score = Math.max(0, Math.min(100, Math.round(rawScore)));

  let band: AquiferHealthBand;
  let summaryKey: string;

  if (score >= 75) {
    band = "healthy";
    summaryKey = "health_band_summary_healthy";
  } else if (score >= 55) {
    band = "watch";
    summaryKey = "health_band_summary_watch";
  } else if (score >= 35) {
    band = "stressed";
    summaryKey = "health_band_summary_stressed";
  } else {
    band = "critical";
    summaryKey = "health_band_summary_critical";
  }

  const confidence: "high" | "medium" | "low" =
    confidencePoints >= 9 ? "high" : confidencePoints >= 6 ? "medium" : "low";

  const components: HealthScoreComponent[] = [
    {
      id: "trend",
      labelKey: "health_component_trend",
      points: trendPoints,
      maxPoints: 35,
      explanationKey: trendExplanationKey,
      params: trendParams,
    },
    {
      id: "recharge",
      labelKey: "health_component_recharge",
      points: rechargePoints,
      maxPoints: 30,
      explanationKey: rechargeExplanationKey,
      params: rechargeParams,
    },
    {
      id: "seasonal_buffer",
      labelKey: "health_component_seasonal_buffer",
      points: bufferPoints,
      maxPoints: 25,
      explanationKey: bufferExplanationKey,
      params: bufferParams,
    },
    {
      id: "data_confidence",
      labelKey: "health_component_data_confidence",
      points: confidencePoints,
      maxPoints: 10,
      explanationKey: confidenceExplanationKey,
      params: { coverage: Math.round(coverageRatio * 100) },
    },
  ];

  return {
    version: "health_v1",
    score,
    band,
    confidence,
    components,
    summaryKey,
  };
}
