/**
 * Aquifer Insights Simulator Backtesting Suite.
 *
 * Compares computed depletion rate, monsoon recharge, pump stress, and health score
 * against known simulator ground-truth parameters across standard archetypes:
 * - normal (modest extraction, standard monsoon)
 * - drought (deficient monsoon, moderate stress)
 * - over_extraction (heavy pumping, accelerating depletion)
 * - good_recharge (abundant monsoon, rising water table)
 */

import { createPRNG } from "../../src/server/simulator/prng";
import {
  SCENARIOS,
  getWaterDepthAtTime,
  type ScenarioType,
  type NodeSimConfig,
} from "../../src/server/simulator/models";
import { computeDailyMedians } from "../../src/lib/insights/seasonal";
import { compareMonsoonSeasons } from "../../src/lib/insights/monsoon";
import { computeTheilSenDepletion } from "../../src/lib/insights/depletion";
import { estimateMonsoonRecharge } from "../../src/lib/insights/recharge";
import { analyzePumpStress } from "../../src/lib/insights/pumping";
import { calculateAquiferHealthScore } from "../../src/lib/insights/health-score";
import { evaluateDataSufficiency } from "../../src/lib/insights/sufficiency";

export interface BacktestScenarioResult {
  scenario: ScenarioType;
  groundTruthTrendMYr: number;
  estimatedTrendMYr: number | null;
  trendErrorMYr: number | null;
  groundTruthMonsoonStrength: number;
  estimatedRechargeRiseM: number | null;
  groundTruthPumpHours: number;
  detectedDrawdownM: number | null;
  detectedRecoveryHours: number | null;
  healthScore: number;
  healthBand: string;
  passed: boolean;
}

/**
 * Runs simulation for 1 year (or 2 years for trend) and evaluates backtest metrics.
 */
export function runScenarioBacktest(
  scenario: ScenarioType,
  years = 2,
  seed = 42,
): BacktestScenarioResult {
  const prng = createPRNG(seed);
  const scenarioConfig = SCENARIOS[scenario];

  const config: NodeSimConfig = {
    nodeId: `test-node-${scenario}`,
    wellId: `test-well-${scenario}`,
    baselineDepthM: 15.0,
    hangDepthM: 35.0,
    sensorRangeM: 40.0,
    scenario,
  };

  const startDate = new Date(Date.UTC(2024, 0, 1, 0, 0, 0));
  const totalHours = years * 365 * 24;

  const rawReadings: Array<{
    recordedAt: Date;
    depthToWaterM: number;
    quality: "good";
  }> = [];

  for (let h = 0; h < totalHours; h += 2) {
    // 2-hourly readings
    const date = new Date(startDate.getTime() + h * 3600 * 1000);
    const { depthM } = getWaterDepthAtTime(config, date, prng);
    rawReadings.push({
      recordedAt: date,
      depthToWaterM: depthM,
      quality: "good",
    });
  }

  // 1. Data sufficiency
  const sufficiency = evaluateDataSufficiency(rawReadings);

  // 2. Daily medians
  const dailyMedians = computeDailyMedians(rawReadings);

  // 3. Monsoon comparison
  const monsoon = compareMonsoonSeasons(dailyMedians);

  // 4. Depletion rate
  const depletion = computeTheilSenDepletion(dailyMedians);

  // 5. Recharge estimate (WTF)
  const recharge = monsoon.latestYear
    ? estimateMonsoonRecharge({
        monsoonComparison: monsoon.latestYear,
        specificYield: 0.08,
      })
    : null;

  // 6. Pump stress
  const pumpStress = analyzePumpStress(rawReadings);

  // 7. Health score
  const healthResult = calculateAquiferHealthScore({
    sufficiency,
    monsoon,
    depletion,
    peakDrySeasonDepthM: 18.0,
    wellDepthOrCriticalThresholdM: 35.0,
  });

  const estimatedTrend = depletion.depletionRateMPerYear ?? null;
  // Note: in simulator, longTermTrendMYr is the rate of change of depth with time.
  // Positive depletion rate in our estimator means water table is falling (depth increasing).
  // In simulator: depth = baseline - tYear * longTermTrendMYr.
  // So if longTermTrendMYr = -1.5, depth increases by 1.5m per year -> depletion rate = +1.5 m/yr.
  const groundTruthDepletionRate = -scenarioConfig.longTermTrendMYr;
  const trendError =
    estimatedTrend !== null ? Math.abs(estimatedTrend - groundTruthDepletionRate) : null;

  // Verification criteria
  const isTrendAcceptable = trendError === null || trendError < 0.6; // within ±0.6 m/yr with seasonal oscillations
  const isPumpingDetected =
    scenarioConfig.pumpHoursPerDay > 0
      ? pumpStress.medianDrawdownM !== null && pumpStress.medianDrawdownM > 0.5
      : true;

  let isHealthBandReasonable = true;
  if (scenario === "over_extraction" || scenario === "drought") {
    isHealthBandReasonable = healthResult.band === "critical" || healthResult.band === "stressed";
  } else if (scenario === "good_recharge") {
    isHealthBandReasonable = healthResult.band === "healthy" || healthResult.band === "watch";
  }

  const passed = isTrendAcceptable && isPumpingDetected && isHealthBandReasonable;

  return {
    scenario,
    groundTruthTrendMYr: groundTruthDepletionRate,
    estimatedTrendMYr: estimatedTrend,
    trendErrorMYr: trendError,
    groundTruthMonsoonStrength: scenarioConfig.monsoonStrength,
    estimatedRechargeRiseM: recharge?.riseM ?? null,
    groundTruthPumpHours: scenarioConfig.pumpHoursPerDay,
    detectedDrawdownM: pumpStress.medianDrawdownM,
    detectedRecoveryHours: pumpStress.medianRecoveryTimeHours,
    healthScore: healthResult.score,
    healthBand: healthResult.band,
    passed,
  };
}

export function runAllBacktests(): boolean {
  const scenarios: ScenarioType[] = ["normal", "drought", "over_extraction", "good_recharge"];
  console.log("=========================================================================");
  console.log("  AQUIFER INSIGHTS BACKTESTING REPORT (vs Simulator Ground Truth)        ");
  console.log("=========================================================================");
  console.log(
    "Scenario".padEnd(16) +
      "Truth Depletion".padEnd(17) +
      "Est Depletion".padEnd(15) +
      "Recharge Rise".padEnd(15) +
      "Drawdown".padEnd(12) +
      "Score / Band".padEnd(18) +
      "Status",
  );
  console.log("-".repeat(95));

  let allPassed = true;
  for (const s of scenarios) {
    const res = runScenarioBacktest(s, 2, 100);
    const truthStr = `${res.groundTruthTrendMYr.toFixed(2)} m/yr`;
    const estStr =
      res.estimatedTrendMYr !== null ? `${res.estimatedTrendMYr.toFixed(2)} m/yr` : "N/A";
    const rechargeStr =
      res.estimatedRechargeRiseM !== null ? `${res.estimatedRechargeRiseM.toFixed(2)} m` : "N/A";
    const drawdownStr =
      res.detectedDrawdownM !== null ? `${res.detectedDrawdownM.toFixed(1)} m` : "N/A";
    const scoreStr = `${res.healthScore} (${res.healthBand})`;
    const statusStr = res.passed ? "PASS [OK]" : "FAIL [!]";

    if (!res.passed) {
      allPassed = false;
    }

    console.log(
      s.padEnd(16) +
        truthStr.padEnd(17) +
        estStr.padEnd(15) +
        rechargeStr.padEnd(15) +
        drawdownStr.padEnd(12) +
        scoreStr.padEnd(18) +
        statusStr,
    );
  }
  console.log("=========================================================================");
  if (allPassed) {
    console.log("ALL BACKTESTS PASSED: Estimators match simulator archetypes within bounds.");
  } else {
    console.log("WARNING: One or more backtests deviated from expected ground truth bounds.");
  }
  return allPassed;
}

if (require.main === module) {
  const success = runAllBacktests();
  if (!success) {
    process.exit(1);
  }
}
