import { calculateMedian, type TimeSeriesPoint } from "./seasonal";

export interface MonsoonWindowConfig {
  /**
   * Pre-monsoon month range (1-indexed, inclusive).
   * Default: [5, 5] (May: typically peak dry season before SW monsoon).
   */
  preMonsoonMonths?: [number, number];
  /**
   * Post-monsoon month range (1-indexed, inclusive).
   * Default: [10, 11] (October - November: post-monsoon recharge).
   */
  postMonsoonMonths?: [number, number];
  /**
   * Minimum days required in each window for high confidence.
   * Default: 15.
   */
  minDaysHighConfidence?: number;
  /**
   * Minimum days required in each window for medium confidence.
   * Default: 7.
   */
  minDaysMediumConfidence?: number;
}

export type MonsoonConfidence = "high" | "medium" | "low" | "insufficient";

export interface MonsoonComparisonYearResult {
  year: number;
  preMonsoonMedianDepthM: number | null;
  postMonsoonMedianDepthM: number | null;
  /**
   * Net water-table rise in metres: (preMonsoonDepth - postMonsoonDepth).
   * Positive value indicates water table rose (depth decreased).
   * Negative indicates water table declined.
   */
  netRiseM: number | null;
  preMonsoonDaysCount: number;
  postMonsoonDaysCount: number;
  confidence: MonsoonConfidence;
  confidenceNoteKey: string;
}

export interface MonsoonComparisonSummary {
  years: MonsoonComparisonYearResult[];
  latestYear: MonsoonComparisonYearResult | null;
  averageNetRiseM: number | null;
}

const DEFAULT_PRE_MONTHS: [number, number] = [5, 5];
const DEFAULT_POST_MONTHS: [number, number] = [10, 11];

function isInMonthRange(dateStr: string, [startM, endM]: [number, number]): boolean {
  const month = parseInt(dateStr.slice(5, 7), 10);
  if (startM <= endM) {
    return month >= startM && month <= endM;
  }
  // Wraps across year-end
  return month >= startM || month <= endM;
}

/**
 * Compares pre-monsoon and post-monsoon groundwater depths across observed years.
 * Uses daily medians to prevent single-day pumping spikes from skewing seasonal levels.
 */
export function compareMonsoonSeasons(
  dailyMedians: TimeSeriesPoint[],
  config: MonsoonWindowConfig = {},
): MonsoonComparisonSummary {
  const preMonths = config.preMonsoonMonths ?? DEFAULT_PRE_MONTHS;
  const postMonths = config.postMonsoonMonths ?? DEFAULT_POST_MONTHS;
  const minHigh = config.minDaysHighConfidence ?? 15;
  const minMed = config.minDaysMediumConfidence ?? 7;

  // Group points by year
  const pointsByYear = new Map<number, TimeSeriesPoint[]>();
  for (const pt of dailyMedians) {
    const year = parseInt(pt.date.slice(0, 4), 10);
    const list = pointsByYear.get(year) ?? [];
    list.push(pt);
    pointsByYear.set(year, list);
  }

  const sortedYears = Array.from(pointsByYear.keys()).sort((a, b) => a - b);
  const yearsResults: MonsoonComparisonYearResult[] = [];

  for (const year of sortedYears) {
    const points = pointsByYear.get(year)!;
    const prePoints = points.filter((p) => isInMonthRange(p.date, preMonths));
    const postPoints = points.filter((p) => isInMonthRange(p.date, postMonths));

    const preCount = prePoints.length;
    const postCount = postPoints.length;

    let confidence: MonsoonConfidence;
    let confidenceNoteKey: string;

    if (preCount === 0 || postCount === 0) {
      confidence = "insufficient";
      confidenceNoteKey =
        preCount === 0 && postCount === 0
          ? "confidence_missing_both_windows"
          : preCount === 0
            ? "confidence_missing_pre_monsoon"
            : "confidence_missing_post_monsoon";
    } else if (preCount >= minHigh && postCount >= minHigh) {
      confidence = "high";
      confidenceNoteKey = "confidence_high_coverage";
    } else if (preCount >= minMed && postCount >= minMed) {
      confidence = "medium";
      confidenceNoteKey = "confidence_medium_coverage";
    } else {
      confidence = "low";
      confidenceNoteKey = "confidence_low_coverage";
    }

    const preMedian =
      preCount > 0
        ? Math.round(calculateMedian(prePoints.map((p) => p.depthM)) * 1000) / 1000
        : null;
    const postMedian =
      postCount > 0
        ? Math.round(calculateMedian(postPoints.map((p) => p.depthM)) * 1000) / 1000
        : null;

    const netRiseM =
      preMedian !== null && postMedian !== null
        ? Math.round((preMedian - postMedian) * 1000) / 1000
        : null;

    yearsResults.push({
      year,
      preMonsoonMedianDepthM: preMedian,
      postMonsoonMedianDepthM: postMedian,
      netRiseM,
      preMonsoonDaysCount: preCount,
      postMonsoonDaysCount: postCount,
      confidence,
      confidenceNoteKey,
    });
  }

  const validRises = yearsResults.map((y) => y.netRiseM).filter((r): r is number => r !== null);

  const averageNetRiseM =
    validRises.length > 0
      ? Math.round((validRises.reduce((sum, v) => sum + v, 0) / validRises.length) * 1000) / 1000
      : null;

  return {
    years: yearsResults,
    latestYear: yearsResults.length > 0 ? yearsResults[yearsResults.length - 1]! : null,
    averageNetRiseM,
  };
}
