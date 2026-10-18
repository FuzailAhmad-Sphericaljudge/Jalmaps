import { calculateMedian, type TimeSeriesPoint } from "./seasonal";

export interface DepletionEstimate {
  /**
   * Whether the time span and sample size are sufficient to calculate a yearly depletion rate.
   * We require at least 2 distinct years of span (>= 700 days between first and last reading).
   */
  hasEnoughYears: boolean;
  statusNoteKey: string;
  spanDays: number;
  yearsSpan: number;
  /**
   * Theil-Sen slope in metres per year.
   * Positive value means water table is falling (depth is increasing: depletion).
   * Negative value means water table is rising (recovery/accumulation).
   */
  depletionRateMPerYear: number | null;
  /**
   * Uncertainty bounds (approx 95% empirical interval of pairwise slopes).
   */
  uncertaintyRangeMPerYear: {
    min: number;
    max: number;
  } | null;
  /**
   * Direct same-season delta if consecutive annual seasons exist.
   */
  seasonalYearlyDeltas: Array<{
    season: "pre_monsoon" | "post_monsoon";
    fromYear: number;
    toYear: number;
    deltaM: number;
  }>;
}

export interface DepletionConfig {
  /**
   * Minimum span in days to permit annual depletion estimation.
   * Default: 650 days (~1.8 years) to capture at least 2 cycles.
   */
  minSpanDays?: number;
  /**
   * Minimum number of daily points.
   * Default: 180.
   */
  minDailyPoints?: number;
}

const MS_PER_DAY = 24 * 3600 * 1000;
const DAYS_PER_YEAR = 365.25;

/**
 * Calculates empirical percentiles (p in [0, 1]).
 */
function calculatePercentile(sortedValues: number[], p: number): number {
  if (sortedValues.length === 0) return 0;
  if (sortedValues.length === 1) return sortedValues[0]!;
  const index = p * (sortedValues.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;
  return sortedValues[lower]! * (1 - weight) + sortedValues[upper]! * weight;
}

/**
 * Computes robust Theil-Sen slope estimator across a time series of daily points.
 * Pairwise slopes: (depth_j - depth_i) / (time_j - time_i in years).
 */
export function computeTheilSenDepletion(
  dailyMedians: TimeSeriesPoint[],
  config: DepletionConfig = {},
): DepletionEstimate {
  const minSpanDays = config.minSpanDays ?? 650;
  const minDailyPoints = config.minDailyPoints ?? 180;

  if (dailyMedians.length < 2) {
    return {
      hasEnoughYears: false,
      statusNoteKey: "depletion_insufficient_data",
      spanDays: 0,
      yearsSpan: 0,
      depletionRateMPerYear: null,
      uncertaintyRangeMPerYear: null,
      seasonalYearlyDeltas: [],
    };
  }

  const sorted = [...dailyMedians].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  const firstTime = new Date(sorted[0]!.date).getTime();
  const lastTime = new Date(sorted[sorted.length - 1]!.date).getTime();
  const spanDays = Math.round((lastTime - firstTime) / MS_PER_DAY);
  const yearsSpan = Math.round((spanDays / DAYS_PER_YEAR) * 10) / 10;

  if (spanDays < minSpanDays || sorted.length < minDailyPoints) {
    return {
      hasEnoughYears: false,
      statusNoteKey:
        spanDays < minSpanDays
          ? "depletion_insufficient_span_years"
          : "depletion_insufficient_points",
      spanDays,
      yearsSpan,
      depletionRateMPerYear: null,
      uncertaintyRangeMPerYear: null,
      seasonalYearlyDeltas: [],
    };
  }

  // To prevent O(N^2) explosion with thousands of daily points,
  // sample points systematically if N > 300, or take monthly / bi-weekly representatives.
  let pointsForSlopes = sorted;
  if (sorted.length > 250) {
    const step = Math.ceil(sorted.length / 250);
    pointsForSlopes = sorted.filter((_, idx) => idx % step === 0);
  }

  const pairwiseSlopes: number[] = [];
  for (let i = 0; i < pointsForSlopes.length; i++) {
    const t1 = new Date(pointsForSlopes[i]!.date).getTime();
    const d1 = pointsForSlopes[i]!.depthM;

    for (let j = i + 1; j < pointsForSlopes.length; j++) {
      const t2 = new Date(pointsForSlopes[j]!.date).getTime();
      const dtYears = (t2 - t1) / (MS_PER_DAY * DAYS_PER_YEAR);
      if (dtYears >= 0.85) {
        // Only compare points separated by annual cycles (or multi-years) to cancel seasonal oscillation
        const yearCycleFraction = Math.abs(dtYears - Math.round(dtYears));
        if (yearCycleFraction <= 0.15 || dtYears >= 1.85) {
          const d2 = pointsForSlopes[j]!.depthM;
          const slope = (d2 - d1) / dtYears;
          pairwiseSlopes.push(slope);
        }
      }
    }
  }

  // Fallback if strict seasonal cycles yielded too few pairs
  if (pairwiseSlopes.length < 10) {
    for (let i = 0; i < pointsForSlopes.length; i++) {
      const t1 = new Date(pointsForSlopes[i]!.date).getTime();
      const d1 = pointsForSlopes[i]!.depthM;
      for (let j = i + 1; j < pointsForSlopes.length; j++) {
        const t2 = new Date(pointsForSlopes[j]!.date).getTime();
        const dtYears = (t2 - t1) / (MS_PER_DAY * DAYS_PER_YEAR);
        if (dtYears >= 0.85) {
          const d2 = pointsForSlopes[j]!.depthM;
          const slope = (d2 - d1) / dtYears;
          pairwiseSlopes.push(slope);
        }
      }
    }
  }

  if (pairwiseSlopes.length === 0) {
    return {
      hasEnoughYears: false,
      statusNoteKey: "depletion_insufficient_pairs",
      spanDays,
      yearsSpan,
      depletionRateMPerYear: null,
      uncertaintyRangeMPerYear: null,
      seasonalYearlyDeltas: [],
    };
  }

  pairwiseSlopes.sort((a, b) => a - b);
  const medianSlope = calculateMedian(pairwiseSlopes);
  const p025 = calculatePercentile(pairwiseSlopes, 0.025);
  const p975 = calculatePercentile(pairwiseSlopes, 0.975);

  return {
    hasEnoughYears: true,
    statusNoteKey: "depletion_calculated_successfully",
    spanDays,
    yearsSpan,
    depletionRateMPerYear: Math.round(medianSlope * 1000) / 1000,
    uncertaintyRangeMPerYear: {
      min: Math.round(p025 * 1000) / 1000,
      max: Math.round(p975 * 1000) / 1000,
    },
    seasonalYearlyDeltas: [],
  };
}
