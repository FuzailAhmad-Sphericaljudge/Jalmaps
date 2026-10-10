import { CropProfile } from "../schemas/advisory";

export interface ForecastProvider {
  getDaysToCritical(wellId: string): Promise<number | null>;
}

export interface RainfallProvider {
  getExpectedRainfall(wellId: string, daysAhead: number): Promise<number>;
}

export class MockForecastProvider implements ForecastProvider {
  async getDaysToCritical(_wellId: string): Promise<number | null> {
    return 14;
  }
}

export class MockRainfallProvider implements RainfallProvider {
  async getExpectedRainfall(_wellId: string, _daysAhead: number): Promise<number> {
    return 0;
  }
}

export interface WellFacts {
  depthTrend7d: number; // change in meters over last 7 days (positive = deeper)
  levelVsOwnHistoryPercentile: number; // 0 to 100
  stressLevel: "normal" | "warning" | "critical" | "unknown";
  daysSinceSowing: number | null;
  currentStage: string | null;
  cropWaterSensitivity: "high" | "medium" | "low" | null;
  season: "kharif" | "rabi" | "zaid" | "unknown";
  dataQuality: "good" | "suspect" | "bad";
  daysToCritical: number | null;
  expectedRainfall: number;
}

export interface FactInput {
  wellId: string;
  sowingDate: string | null;
  cropProfile: CropProfile | null;
  recentReadings: { recorded_at: string; depth_to_water_m: number }[];
  historicalReadings: { depth_to_water_m: number }[];
  now: Date;
  thresholds: { warning?: number; critical?: number };
  faultStatus: "good" | "suspect" | "bad";
}

export async function buildFacts(
  input: FactInput,
  forecast: ForecastProvider,
  rainfall: RainfallProvider,
): Promise<WellFacts> {
  const {
    sowingDate,
    cropProfile,
    recentReadings,
    historicalReadings,
    now,
    thresholds,
    faultStatus,
    wellId,
  } = input;

  // 1. depthTrend7d
  let depthTrend7d = 0;
  if (recentReadings.length > 0) {
    const sorted = [...recentReadings].sort(
      (a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime(),
    );
    const latest = sorted[0];
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const closestTo7d = sorted.reduce((prev, curr) => {
      const prevDiff = Math.abs(new Date(prev.recorded_at).getTime() - sevenDaysAgo.getTime());
      const currDiff = Math.abs(new Date(curr.recorded_at).getTime() - sevenDaysAgo.getTime());
      return currDiff < prevDiff ? curr : prev;
    }, latest);

    if (
      new Date(latest.recorded_at).getTime() - new Date(closestTo7d.recorded_at).getTime() >
      3 * 24 * 60 * 60 * 1000
    ) {
      depthTrend7d = latest.depth_to_water_m - closestTo7d.depth_to_water_m;
    }
  }

  // 2. levelVsOwnHistoryPercentile
  let levelVsOwnHistoryPercentile = 50;
  if (historicalReadings.length > 0 && recentReadings.length > 0) {
    const latestDepth = recentReadings[0].depth_to_water_m;
    const shallowerOrEqual = historicalReadings.filter(
      (r) => r.depth_to_water_m <= latestDepth,
    ).length;
    levelVsOwnHistoryPercentile = (shallowerOrEqual / historicalReadings.length) * 100;
  }

  // 3. stressLevel
  let stressLevel: "normal" | "warning" | "critical" | "unknown" = "unknown";
  if (recentReadings.length > 0) {
    const depth = recentReadings[0].depth_to_water_m;
    if (thresholds.critical !== undefined && depth >= thresholds.critical) {
      stressLevel = "critical";
    } else if (thresholds.warning !== undefined && depth >= thresholds.warning) {
      stressLevel = "warning";
    } else {
      stressLevel = "normal";
    }
  }

  // 4 & 5 & 6. Crop info
  let daysSinceSowing: number | null = null;
  let currentStage: string | null = null;
  let cropWaterSensitivity: "high" | "medium" | "low" | null = null;

  if (sowingDate && cropProfile) {
    const sowingTime = new Date(sowingDate).getTime();
    daysSinceSowing = Math.floor((now.getTime() - sowingTime) / (1000 * 60 * 60 * 24));

    if (daysSinceSowing >= 0) {
      let accumulatedDays = 0;
      for (const stage of cropProfile.growth_stages) {
        if (
          daysSinceSowing >= accumulatedDays &&
          daysSinceSowing < accumulatedDays + stage.duration_days
        ) {
          currentStage = stage.name_en;
          cropWaterSensitivity = stage.water_sensitivity;
          break;
        }
        accumulatedDays += stage.duration_days;
      }
      // If beyond all stages, assume mature / harvested
      if (!currentStage) {
        const lastStage = cropProfile.growth_stages[cropProfile.growth_stages.length - 1];
        if (lastStage) {
          currentStage = lastStage.name_en;
          cropWaterSensitivity = lastStage.water_sensitivity;
        }
      }
    }
  }

  // 7. season
  const month = now.getMonth(); // 0-11
  let season: "kharif" | "rabi" | "zaid" | "unknown" = "unknown";
  if (month >= 5 && month <= 9) season = "kharif";
  else if (month >= 10 || month <= 2) season = "rabi";
  else if (month >= 3 && month <= 4) season = "zaid";

  const daysToCritical = await forecast.getDaysToCritical(wellId);
  const expectedRainfall = await rainfall.getExpectedRainfall(wellId, 3);

  return {
    depthTrend7d,
    levelVsOwnHistoryPercentile,
    stressLevel,
    daysSinceSowing,
    currentStage,
    cropWaterSensitivity,
    season,
    dataQuality: faultStatus,
    daysToCritical,
    expectedRainfall,
  };
}
