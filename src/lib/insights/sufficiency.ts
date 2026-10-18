/**
 * Data sufficiency evaluator for groundwater aquifer insights.
 * Pure logic enforcing strict thresholds before insights or numbers are presented.
 */

export interface ReadingSample {
  recordedAt: string | Date;
  depthToWaterM: number | null;
  quality?: "good" | "suspect" | "bad" | null;
}

export interface DataSufficiencyResult {
  isSufficient: boolean;
  totalReadings: number;
  goodReadingsCount: number;
  coverageRatio: number;
  spanMonths: number;
  missingCriteria: string[];
}

export interface SufficiencyThresholds {
  minSpanMonths?: number;
  minGoodReadings?: number;
  minCoverageRatio?: number;
}

const DEFAULT_THRESHOLDS: Required<SufficiencyThresholds> = {
  minSpanMonths: 3, // Minimum 3 months required for any seasonal insight
  minGoodReadings: 60, // Minimum 60 distinct good daily/hourly readings
  minCoverageRatio: 0.7, // At least 70% of readings must be good quality
};

/**
 * Evaluates whether a set of well readings meets data sufficiency requirements
 * to compute reliable, non-misleading aquifer insights.
 */
export function evaluateDataSufficiency(
  readings: ReadingSample[],
  customThresholds?: SufficiencyThresholds,
): DataSufficiencyResult {
  const thresholds = { ...DEFAULT_THRESHOLDS, ...customThresholds };
  const missingCriteria: string[] = [];

  if (!readings || readings.length === 0) {
    return {
      isSufficient: false,
      totalReadings: 0,
      goodReadingsCount: 0,
      coverageRatio: 0,
      spanMonths: 0,
      missingCriteria: ["no_readings_available"],
    };
  }

  const validDepthReadings = readings.filter(
    (r) => r.depthToWaterM !== null && !isNaN(r.depthToWaterM),
  );

  const goodReadings = validDepthReadings.filter((r) => !r.quality || r.quality === "good");

  const total = validDepthReadings.length;
  const goodCount = goodReadings.length;
  const coverageRatio = total > 0 ? goodCount / total : 0;

  // Compute timespan in months
  const timestamps = validDepthReadings.map((r) =>
    typeof r.recordedAt === "string" ? new Date(r.recordedAt).getTime() : r.recordedAt.getTime(),
  );
  const minTime = Math.min(...timestamps);
  const maxTime = Math.max(...timestamps);
  const spanMs = maxTime - minTime;
  const spanMonths = spanMs / (1000 * 60 * 60 * 24 * 30.4375);

  if (spanMonths < thresholds.minSpanMonths) {
    missingCriteria.push("insufficient_timespan");
  }

  if (goodCount < thresholds.minGoodReadings) {
    missingCriteria.push("insufficient_readings_count");
  }

  if (coverageRatio < thresholds.minCoverageRatio) {
    missingCriteria.push("low_quality_ratio");
  }

  return {
    isSufficient: missingCriteria.length === 0,
    totalReadings: total,
    goodReadingsCount: goodCount,
    coverageRatio: Math.round(coverageRatio * 100) / 100,
    spanMonths: Math.round(spanMonths * 10) / 10,
    missingCriteria,
  };
}
