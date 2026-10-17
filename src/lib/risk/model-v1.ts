import { z } from "zod";

export const riskBandSchema = z.enum(["low", "moderate", "high", "critical"]);
export type RiskBand = z.infer<typeof riskBandSchema>;

export const riskConfidenceSchema = z.enum(["low", "medium", "high"]);
export type RiskConfidence = z.infer<typeof riskConfidenceSchema>;

export interface RiskV1Inputs {
  currentDepthM: number;
  historicalMedianDepthM: number;
  annualDepletionRateMPerYear: number;
  preMonsoonDepthM: number;
  totalDepthM: number;
  monsoonRechargeRatio: number; // 0 (no recovery) to 1.0 (full recovery) or >1 (surplus)
  consentingWellsCount: number;
  observationsLast90Days: number;
  daysOfHistory: number;
}

export interface RiskV1Components {
  levelVsHistoryScore: number; // 0-100 (25% weight)
  depletionTrendScore: number; // 0-100 (30% weight)
  preMonsoonStressScore: number; // 0-100 (20% weight)
  monsoonRecoveryScore: number; // 0-100 (15% weight)
  dataCoverageScore: number; // 0-100 (10% weight)
}

export interface RiskV1Result {
  score: number; // 0 - 100
  band: RiskBand;
  confidence: RiskConfidence;
  components: RiskV1Components;
  modelVersion: "risk_v1";
  explanation: string;
  limitationsNotice: string;
}

export const LIMITATIONS_NOTICE =
  "Notice: The risk_v1 score is an indicative macro assessment derived from consenting community sensor telemetry. It does not constitute formal underwriting or actuarial advice.";

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Computes transparent, explainable groundwater risk score (risk_v1).
 */
export function computeRiskV1(inputs: RiskV1Inputs): RiskV1Result {
  // 1. Level vs Historical Baseline (25% weight)
  // If water is 5m deeper than median baseline -> 100 score; if shallower or equal -> 0 score
  const depthDiff = inputs.currentDepthM - inputs.historicalMedianDepthM;
  const levelVsHistoryScore = clamp((depthDiff / 5.0) * 100, 0, 100);

  // 2. Yearly Depletion Trend (30% weight)
  // >= 1.5 m/year -> 100 score; 0 m/year -> 0 score
  const depletionTrendScore = clamp((inputs.annualDepletionRateMPerYear / 1.5) * 100, 0, 100);

  // 3. Pre-monsoon stress (20% weight)
  // Ratio of pre-monsoon depth to total well depth. If >= 80% of total depth -> 100 score
  const depthRatio = inputs.totalDepthM > 0 ? inputs.preMonsoonDepthM / inputs.totalDepthM : 0.5;
  const preMonsoonStressScore = clamp(((depthRatio - 0.3) / 0.5) * 100, 0, 100);

  // 4. Monsoon recovery deficit (15% weight)
  // Recovery ratio: 1.0 (100% recovered) = 0 risk; 0.0 (0% recovered) = 100 risk
  const recoveryDeficit = Math.max(0, 1.0 - inputs.monsoonRechargeRatio);
  const monsoonRecoveryScore = clamp(recoveryDeficit * 100, 0, 100);

  // 5. Data coverage (10% weight)
  // Sparse data increases risk of unobserved depletion
  // Expected 90 observations in 90 days. If < 30 observations -> high risk penalty
  const coverageRatio = clamp(inputs.observationsLast90Days / 90.0, 0, 1.0);
  const dataCoverageScore = clamp((1.0 - coverageRatio) * 100, 0, 100);

  // Weighted aggregate
  const rawScore =
    levelVsHistoryScore * 0.25 +
    depletionTrendScore * 0.3 +
    preMonsoonStressScore * 0.2 +
    monsoonRecoveryScore * 0.15 +
    dataCoverageScore * 0.1;

  const score = Math.round(clamp(rawScore, 0, 100) * 10) / 10;

  // Band classification
  let band: RiskBand = "low";
  if (score > 80) band = "critical";
  else if (score > 60) band = "high";
  else if (score > 30) band = "moderate";

  // Confidence assessment
  let confidence: RiskConfidence = "low";
  if (inputs.consentingWellsCount >= 5 && inputs.daysOfHistory >= 60 && coverageRatio >= 0.7) {
    confidence = "high";
  } else if (inputs.consentingWellsCount >= 3 && inputs.daysOfHistory >= 30) {
    confidence = "medium";
  }

  // Explanation generation
  const reasons: string[] = [];
  if (depletionTrendScore >= 60) {
    reasons.push(
      `high annual depletion rate (${inputs.annualDepletionRateMPerYear.toFixed(2)} m/year)`,
    );
  }
  if (levelVsHistoryScore >= 60) {
    reasons.push(
      `water levels significantly below historical baseline (+${depthDiff.toFixed(1)} m)`,
    );
  }
  if (monsoonRecoveryScore >= 60) {
    reasons.push(
      `weak monsoon recharge recovery (${Math.round(inputs.monsoonRechargeRatio * 100)}%)`,
    );
  }
  if (preMonsoonStressScore >= 60) {
    reasons.push("severe dry season pre-monsoon drawdown");
  }

  const explanation =
    reasons.length > 0
      ? `Risk score is driven by ${reasons.join(", ")}.`
      : "Groundwater levels are stable and within historical safe margins.";

  return {
    score,
    band,
    confidence,
    components: {
      levelVsHistoryScore: Math.round(levelVsHistoryScore),
      depletionTrendScore: Math.round(depletionTrendScore),
      preMonsoonStressScore: Math.round(preMonsoonStressScore),
      monsoonRecoveryScore: Math.round(monsoonRecoveryScore),
      dataCoverageScore: Math.round(dataCoverageScore),
    },
    modelVersion: "risk_v1",
    explanation,
    limitationsNotice: LIMITATIONS_NOTICE,
  };
}
