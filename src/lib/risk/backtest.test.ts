import { describe, it, expect } from "vitest";
import { computeRiskV1, type RiskV1Inputs } from "./model-v1";
import { SCENARIOS } from "@/server/simulator/models";

describe("risk_v1 simulator scenario backtest", () => {
  it("backtests good_recharge scenario into low risk", () => {
    const config = SCENARIOS.good_recharge;
    const inputs: RiskV1Inputs = {
      currentDepthM: 7.5,
      historicalMedianDepthM: 8.0,
      annualDepletionRateMPerYear: Math.max(0, -config.longTermTrendMYr),
      preMonsoonDepthM: 9.0,
      totalDepthM: 35.0,
      monsoonRechargeRatio: config.monsoonStrength,
      consentingWellsCount: 8,
      observationsLast90Days: 90,
      daysOfHistory: 180,
    };

    const res = computeRiskV1(inputs);
    expect(res.band).toBe("low");
    expect(res.score).toBeLessThanOrEqual(30);
    expect(res.confidence).toBe("high");
  });

  it("backtests normal scenario into low or moderate risk", () => {
    const config = SCENARIOS.normal;
    const inputs: RiskV1Inputs = {
      currentDepthM: 12.0,
      historicalMedianDepthM: 11.8,
      annualDepletionRateMPerYear: Math.abs(config.longTermTrendMYr), // 0.2 m/yr
      preMonsoonDepthM: 14.0,
      totalDepthM: 40.0,
      monsoonRechargeRatio: config.monsoonStrength, // 1.0
      consentingWellsCount: 6,
      observationsLast90Days: 85,
      daysOfHistory: 120,
    };

    const res = computeRiskV1(inputs);
    expect(["low", "moderate"]).toContain(res.band);
    expect(res.score).toBeLessThanOrEqual(60);
  });

  it("backtests drought scenario into high risk band", () => {
    const config = SCENARIOS.drought;
    const inputs: RiskV1Inputs = {
      currentDepthM: 20.0,
      historicalMedianDepthM: 15.0,
      annualDepletionRateMPerYear: Math.abs(config.longTermTrendMYr), // 1.0 m/yr
      preMonsoonDepthM: 26.0,
      totalDepthM: 35.0,
      monsoonRechargeRatio: config.monsoonStrength, // 0.3
      consentingWellsCount: 5,
      observationsLast90Days: 80,
      daysOfHistory: 90,
    };

    const res = computeRiskV1(inputs);
    expect(["high", "critical"]).toContain(res.band);
    expect(res.score).toBeGreaterThan(60);
  });

  it("backtests over_extraction scenario into critical risk band", () => {
    const config = SCENARIOS.over_extraction;
    const inputs: RiskV1Inputs = {
      currentDepthM: 32.0,
      historicalMedianDepthM: 20.0,
      annualDepletionRateMPerYear: Math.abs(config.longTermTrendMYr), // 1.5 m/yr
      preMonsoonDepthM: 36.0,
      totalDepthM: 40.0,
      monsoonRechargeRatio: 0.2, // severe pumping overwhelms recharge
      consentingWellsCount: 6,
      observationsLast90Days: 88,
      daysOfHistory: 150,
    };

    const res = computeRiskV1(inputs);
    expect(res.band).toBe("critical");
    expect(res.score).toBeGreaterThanOrEqual(80);
  });
});
