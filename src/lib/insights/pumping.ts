import { calculateMedian } from "./seasonal";

export interface RawReadingPoint {
  recordedAt: string | Date;
  depthToWaterM: number | null;
}

export interface DailyPumpCycle {
  date: string; // YYYY-MM-DD
  staticWaterLevelM: number;
  pumpingWaterLevelM: number;
  drawdownM: number;
  recoveryTimeHours: number | null;
  hasPumpingActivity: boolean;
}

export type PumpStressLevel = "low" | "moderate" | "high" | "critical";

export interface PumpStressSummary {
  hasSufficientData: boolean;
  activePumpingDaysCount: number;
  medianDrawdownM: number | null;
  medianRecoveryTimeHours: number | null;
  drawdownTrendM: number | null; // Change in median drawdown from early period to recent period
  recoveryTrendHours: number | null; // Change in recovery time
  stressLevel: PumpStressLevel;
  stressNoteKey: string;
  dailyCycles: DailyPumpCycle[];
}

export interface PumpStressConfig {
  /**
   * Minimum drawdown in metres to qualify as active pumping cycle (filters sensor jitter).
   * Default: 0.3m.
   */
  minDrawdownM?: number;
  /**
   * Recovery threshold ratio (e.g. 0.90 for 90% recovery back toward static water level).
   * Default: 0.90.
   */
  recoveryRatio?: number;
}

/**
 * Evaluates pump stress metrics: daily drawdown, recovery duration, and multi-month progression.
 * Pure deterministic hydrogeological analysis without ML.
 */
export function analyzePumpStress(
  readings: RawReadingPoint[],
  config: PumpStressConfig = {},
): PumpStressSummary {
  const minDrawdownM = config.minDrawdownM ?? 0.3;
  const recoveryRatio = config.recoveryRatio ?? 0.9;

  // Filter and group by calendar day (UTC)
  const validReadings = readings
    .filter((r) => r.depthToWaterM !== null && !isNaN(r.depthToWaterM))
    .map((r) => ({
      time: new Date(r.recordedAt).getTime(),
      dateStr: (typeof r.recordedAt === "string" ? r.recordedAt : r.recordedAt.toISOString()).slice(
        0,
        10,
      ),
      depthM: r.depthToWaterM!,
    }))
    .sort((a, b) => a.time - b.time);

  const groupsByDay = new Map<string, typeof validReadings>();
  for (const r of validReadings) {
    const list = groupsByDay.get(r.dateStr) ?? [];
    list.push(r);
    groupsByDay.set(r.dateStr, list);
  }

  const dailyCycles: DailyPumpCycle[] = [];

  for (const [date, dayReadings] of groupsByDay.entries()) {
    if (dayReadings.length < 4) continue; // Need at least some diurnal points

    // In depth-to-water: smaller depth = shallower = higher water table (static)
    // deepest depth = lowest water table (pumped low)
    let staticWaterLevelM = Infinity;
    let pumpingWaterLevelM = -Infinity;
    let troughIndex = -1;

    for (let i = 0; i < dayReadings.length; i++) {
      const depth = dayReadings[i]!.depthM;
      if (depth < staticWaterLevelM) {
        staticWaterLevelM = depth;
      }
      if (depth > pumpingWaterLevelM) {
        pumpingWaterLevelM = depth;
        troughIndex = i;
      }
    }

    const drawdownM = Math.round((pumpingWaterLevelM - staticWaterLevelM) * 1000) / 1000;
    const hasPumping = drawdownM >= minDrawdownM;

    let recoveryTimeHours: number | null = null;
    if (hasPumping && troughIndex >= 0 && troughIndex < dayReadings.length - 1) {
      // 90% recovery target: depth must return to static + (1 - 0.90) * drawdown
      const targetDepth = staticWaterLevelM + (1 - recoveryRatio) * drawdownM;
      const troughTime = dayReadings[troughIndex]!.time;

      for (let i = troughIndex + 1; i < dayReadings.length; i++) {
        if (dayReadings[i]!.depthM <= targetDepth) {
          const recoveryMs = dayReadings[i]!.time - troughTime;
          recoveryTimeHours = Math.round((recoveryMs / (3600 * 1000)) * 10) / 10;
          break;
        }
      }
    }

    dailyCycles.push({
      date,
      staticWaterLevelM: Math.round(staticWaterLevelM * 1000) / 1000,
      pumpingWaterLevelM: Math.round(pumpingWaterLevelM * 1000) / 1000,
      drawdownM,
      recoveryTimeHours,
      hasPumpingActivity: hasPumping,
    });
  }

  dailyCycles.sort((a, b) => a.date.localeCompare(b.date));

  const activeCycles = dailyCycles.filter((c) => c.hasPumpingActivity);
  if (activeCycles.length < 3) {
    return {
      hasSufficientData: false,
      activePumpingDaysCount: activeCycles.length,
      medianDrawdownM: null,
      medianRecoveryTimeHours: null,
      drawdownTrendM: null,
      recoveryTrendHours: null,
      stressLevel: "low",
      stressNoteKey: "pump_stress_insufficient_cycles",
      dailyCycles,
    };
  }

  const allDrawdowns = activeCycles.map((c) => c.drawdownM);
  const medianDrawdownM = Math.round(calculateMedian(allDrawdowns) * 1000) / 1000;

  const validRecoveries = activeCycles
    .map((c) => c.recoveryTimeHours)
    .filter((h): h is number => h !== null);
  const medianRecoveryTimeHours =
    validRecoveries.length > 0 ? Math.round(calculateMedian(validRecoveries) * 10) / 10 : null;

  // Multi-month / period progression (compare early half vs recent half)
  let drawdownTrendM: number | null = null;
  let recoveryTrendHours: number | null = null;

  if (activeCycles.length >= 8) {
    const half = Math.floor(activeCycles.length / 2);
    const earlyHalf = activeCycles.slice(0, half);
    const recentHalf = activeCycles.slice(half);

    const earlyDrawdownMed = calculateMedian(earlyHalf.map((c) => c.drawdownM));
    const recentDrawdownMed = calculateMedian(recentHalf.map((c) => c.drawdownM));
    drawdownTrendM = Math.round((recentDrawdownMed - earlyDrawdownMed) * 1000) / 1000;

    const earlyRec = earlyHalf
      .map((c) => c.recoveryTimeHours)
      .filter((h): h is number => h !== null);
    const recentRec = recentHalf
      .map((c) => c.recoveryTimeHours)
      .filter((h): h is number => h !== null);

    if (earlyRec.length > 0 && recentRec.length > 0) {
      recoveryTrendHours =
        Math.round((calculateMedian(recentRec) - calculateMedian(earlyRec)) * 10) / 10;
    }
  }

  // Hydrogeological Stress Classification
  // High stress: deep drawdown (> 5m in alluvial / > 3m in basalt) or long recovery (> 8 hours) or worsening trend
  let stressLevel: PumpStressLevel = "low";
  let stressNoteKey = "pump_stress_healthy";

  const isDeepDrawdown = medianDrawdownM >= 4.0;
  const isSlowRecovery = medianRecoveryTimeHours !== null && medianRecoveryTimeHours >= 8.0;
  const isWorsening =
    (drawdownTrendM !== null && drawdownTrendM > 1.0) ||
    (recoveryTrendHours !== null && recoveryTrendHours > 2.0);

  if (isDeepDrawdown && isSlowRecovery) {
    stressLevel = "critical";
    stressNoteKey = "pump_stress_critical_drawdown_recovery";
  } else if (isSlowRecovery || (isDeepDrawdown && isWorsening)) {
    stressLevel = "high";
    stressNoteKey = isSlowRecovery
      ? "pump_stress_high_slow_recovery"
      : "pump_stress_high_worsening_drawdown";
  } else if (isDeepDrawdown || isWorsening) {
    stressLevel = "moderate";
    stressNoteKey = isWorsening
      ? "pump_stress_moderate_increasing"
      : "pump_stress_moderate_deep_drawdown";
  }

  return {
    hasSufficientData: true,
    activePumpingDaysCount: activeCycles.length,
    medianDrawdownM,
    medianRecoveryTimeHours,
    drawdownTrendM,
    recoveryTrendHours,
    stressLevel,
    stressNoteKey,
    dailyCycles,
  };
}
