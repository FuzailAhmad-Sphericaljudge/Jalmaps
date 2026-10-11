/**
 * Seasonal analysis and moving-average decomposition for groundwater time series.
 * Converts raw hourly/sporadic readings into daily medians (removing pump-cycle noise)
 * and decomposes the series into trend, seasonal profile, and residual.
 */

export interface TimeSeriesPoint {
  date: string; // ISO date YYYY-MM-DD
  depthM: number;
}

export interface SeasonalDecompositionPoint {
  date: string;
  observed: number;
  trend: number;
  seasonal: number;
  residual: number;
}

export interface SeasonalAnalysisResult {
  dailyMedians: TimeSeriesPoint[];
  decomposition: SeasonalDecompositionPoint[];
  seasonalProfileByDoy: Map<number, number>; // Day of Year (1..366) -> median anomaly
}

/**
 * Calculates the median of an array of numbers.
 */
export function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 !== 0) {
    return sorted[mid]!;
  }
  return (sorted[mid - 1]! + sorted[mid]!) / 2;
}

/**
 * Aggregates raw readings into daily medians to filter out short-term pumping noise.
 */
export function computeDailyMedians(
  readings: Array<{ recordedAt: string | Date; depthToWaterM: number | null }>,
): TimeSeriesPoint[] {
  const groups = new Map<string, number[]>();

  for (const r of readings) {
    if (r.depthToWaterM === null || isNaN(r.depthToWaterM)) continue;
    const dateStr = (
      typeof r.recordedAt === "string" ? r.recordedAt : r.recordedAt.toISOString()
    ).slice(0, 10);
    const existing = groups.get(dateStr) ?? [];
    existing.push(r.depthToWaterM);
    groups.set(dateStr, existing);
  }

  const sortedDates = Array.from(groups.keys()).sort();
  return sortedDates.map((date) => ({
    date,
    depthM: Math.round(calculateMedian(groups.get(date)!) * 1000) / 1000,
  }));
}

/**
 * Gets Day of Year (1-366) for a date string YYYY-MM-DD.
 */
export function getDayOfYear(dateStr: string): number {
  const date = new Date(dateStr + "T00:00:00Z");
  const startOfYear = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const diffMs = date.getTime() - startOfYear.getTime();
  return Math.floor(diffMs / (24 * 3600 * 1000)) + 1;
}

/**
 * Centered moving average smoothing for extracting trend without ML.
 */
export function computeCenteredMovingAverage(
  series: TimeSeriesPoint[],
  windowSize = 31,
): Array<{ date: string; trend: number }> {
  const half = Math.floor(windowSize / 2);
  const result: Array<{ date: string; trend: number }> = [];

  for (let i = 0; i < series.length; i++) {
    const start = Math.max(0, i - half);
    const end = Math.min(series.length - 1, i + half);
    let sum = 0;
    let count = 0;
    for (let j = start; j <= end; j++) {
      sum += series[j]!.depthM;
      count++;
    }
    result.push({
      date: series[i]!.date,
      trend: Math.round((sum / count) * 1000) / 1000,
    });
  }

  return result;
}

/**
 * Classical additive decomposition: Observed = Trend + Seasonal + Residual
 * Uses moving averages and day-of-year seasonal profiles.
 */
export function decomposeTimeSeries(
  dailyMedians: TimeSeriesPoint[],
  trendWindowSize = 31,
): SeasonalAnalysisResult {
  if (dailyMedians.length === 0) {
    return {
      dailyMedians: [],
      decomposition: [],
      seasonalProfileByDoy: new Map(),
    };
  }

  // 1. Trend via centered moving average
  const trends = computeCenteredMovingAverage(dailyMedians, trendWindowSize);

  // 2. Detrended values: Detrended = Observed - Trend
  const detrendedByDoy = new Map<number, number[]>();
  for (let i = 0; i < dailyMedians.length; i++) {
    const point = dailyMedians[i]!;
    const trend = trends[i]!.trend;
    const detrended = point.depthM - trend;
    const doy = getDayOfYear(point.date);
    const list = detrendedByDoy.get(doy) ?? [];
    list.push(detrended);
    detrendedByDoy.set(doy, list);
  }

  // 3. Seasonal profile: median detrended value for each DOY
  const seasonalProfileByDoy = new Map<number, number>();
  for (const [doy, values] of detrendedByDoy.entries()) {
    seasonalProfileByDoy.set(doy, Math.round(calculateMedian(values) * 1000) / 1000);
  }

  // 4. Construct decomposition records
  const decomposition: SeasonalDecompositionPoint[] = dailyMedians.map((pt, i) => {
    const trend = trends[i]!.trend;
    const doy = getDayOfYear(pt.date);
    const seasonal = seasonalProfileByDoy.get(doy) ?? 0;
    const residual = Math.round((pt.depthM - (trend + seasonal)) * 1000) / 1000;

    return {
      date: pt.date,
      observed: pt.depthM,
      trend,
      seasonal,
      residual,
    };
  });

  return {
    dailyMedians,
    decomposition,
    seasonalProfileByDoy,
  };
}

