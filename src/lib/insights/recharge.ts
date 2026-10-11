import type { MonsoonComparisonYearResult } from "./monsoon";

export interface RechargeEstimate {
  year: number;
  /**
   * Primary metric: net rise in water table level during monsoon (in metres).
   * Note: Rise = preMonsoonDepth - postMonsoonDepth.
   * If water table did not rise (negative delta), riseM is recorded as 0 or negative.
   */
  riseM: number | null;
  confidence: MonsoonComparisonYearResult["confidence"];
  confidenceNoteKey: string;

  /**
   * Specific yield (Sy) dimensionless ratio (e.g., 0.05 to 0.15 for typical Indian aquifers).
   */
  specificYield: number | null;
  specificYieldSource: "well_override" | "aquifer_type_default" | null;

  /**
   * Equivalent recharge water column in millimeters: Rise (m) * Sy * 1000.
   * Useful for comparing directly against monsoon rainfall (mm).
   */
  equivalentRechargeDepthMm: number | null;

  /**
   * Volumetric estimates if geographical area (e.g. village polygon) is known.
   */
  areaM2: number | null;
  estimatedRechargeVolumeM3: number | null;
  estimatedRechargeVolumeMCM: number | null; // Million Cubic Metres (standard CGWB unit)
  estimatedRechargeVolumeLakhLiters: number | null; // 1 m3 = 1000 L = 0.01 Lakh Litres

  /**
   * Hydrogeological transparency flags and assumptions.
   */
  isEstimate: boolean;
  assumptionsKeys: string[];
  disclaimerKey: string;
}

export interface RechargeCalculationInput {
  monsoonComparison: MonsoonComparisonYearResult;
  specificYield?: number | null;
  specificYieldSource?: "well_override" | "aquifer_type_default" | null;
  areaM2?: number | null;
}

export const WATER_TABLE_FLUCTUATION_ASSUMPTIONS = [
  "assumption_unconfined_aquifer",
  "assumption_uniform_specific_yield",
  "assumption_negligible_lateral_flow",
  "assumption_pumping_during_monsoon_not_offset",
] as const;

/**
 * Computes groundwater recharge using the Water-Table Fluctuation (WTF) method (CGWB methodology).
 * When specific yield (Sy) and area (A) are available, computes volume: V = Δh * Sy * A.
 * Transparently includes assumptions and uncertainties.
 */
export function estimateMonsoonRecharge(input: RechargeCalculationInput): RechargeEstimate {
  const { monsoonComparison, specificYield, specificYieldSource, areaM2 } = input;
  const riseM = monsoonComparison.netRiseM;

  const validRise = riseM !== null && riseM > 0 ? riseM : 0;
  const sy = specificYield && specificYield > 0 && specificYield < 1 ? specificYield : null;
  const area = areaM2 && areaM2 > 0 ? areaM2 : null;

  const equivalentRechargeDepthMm =
    riseM !== null && sy !== null ? Math.round(validRise * sy * 1000 * 10) / 10 : null;

  let estimatedRechargeVolumeM3: number | null = null;
  let estimatedRechargeVolumeMCM: number | null = null;
  let estimatedRechargeVolumeLakhLiters: number | null = null;

  if (riseM !== null && sy !== null && area !== null) {
    const volM3 = validRise * sy * area;
    estimatedRechargeVolumeM3 = Math.round(volM3);
    // 1 MCM = 1,000,000 m3
    estimatedRechargeVolumeMCM = Math.round((volM3 / 1_000_000) * 1000) / 1000;
    // 1 m3 = 1000 Litres = 0.01 Lakh Litres (1 Lakh = 100,000 Litres)
    estimatedRechargeVolumeLakhLiters = Math.round((volM3 / 100) * 10) / 10;
  }

  return {
    year: monsoonComparison.year,
    riseM,
    confidence: monsoonComparison.confidence,
    confidenceNoteKey: monsoonComparison.confidenceNoteKey,
    specificYield: sy,
    specificYieldSource: specificYieldSource ?? null,
    equivalentRechargeDepthMm,
    areaM2: area,
    estimatedRechargeVolumeM3,
    estimatedRechargeVolumeMCM,
    estimatedRechargeVolumeLakhLiters,
    isEstimate: true,
    assumptionsKeys: [...WATER_TABLE_FLUCTUATION_ASSUMPTIONS],
    disclaimerKey: "recharge_disclaimer_consult_hydrogeologist",
  };
}
