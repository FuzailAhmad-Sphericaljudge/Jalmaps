import { describe, it, expect } from "vitest";
import { computeRiskV1, type RiskV1Inputs, LIMITATIONS_NOTICE } from "./model-v1";

describe("computeRiskV1", () => {
  const healthyVillage: RiskV1Inputs = {
    currentDepthM: 8.0,
    historicalMedianDepthM: 8.5,
    annualDepletionRateMPerYear: 0.0,
    preMonsoonDepthM: 10.0,
    totalDepthM: 40.0,
    monsoonRechargeRatio: 1.05,
    consentingWellsCount: 6,
    observationsLast90Days: 90,
    daysOfHistory: 120,
  };

  it("produces a low risk score for healthy, recovering groundwater", () => {
    const result = computeRiskV1(healthyVillage);

    expect(result.band).toBe("low");
    expect(result.score).toBeLessThanOrEqual(30);
    expect(result.confidence).toBe("high");
    expect(result.modelVersion).toBe("risk_v1");
    expect(result.limitationsNotice).toBe(LIMITATIONS_NOTICE);
    expect(result.explanation).toContain("Groundwater levels are stable");
  });

  it("produces a critical risk score under severe depletion and poor recharge", () => {
    const stressedVillage: RiskV1Inputs = {
      currentDepthM: 25.0,
      historicalMedianDepthM: 18.0,
      annualDepletionRateMPerYear: 2.1,
      preMonsoonDepthM: 35.0,
      totalDepthM: 40.0,
      monsoonRechargeRatio: 0.15,
      consentingWellsCount: 7,
      observationsLast90Days: 85,
      daysOfHistory: 90,
    };

    const result = computeRiskV1(stressedVillage);

    expect(result.band).toBe("critical");
    expect(result.score).toBeGreaterThan(80);
    expect(result.confidence).toBe("high");
    expect(result.explanation).toContain("high annual depletion rate");
    expect(result.explanation).toContain("weak monsoon recharge");
  });

  it("downgrades confidence when consenting wells or history is limited", () => {
    const sparseVillage: RiskV1Inputs = {
      ...healthyVillage,
      consentingWellsCount: 3,
      daysOfHistory: 35,
    };

    const result = computeRiskV1(sparseVillage);
    expect(result.confidence).toBe("medium");

    const minimalVillage: RiskV1Inputs = {
      ...healthyVillage,
      consentingWellsCount: 2,
      daysOfHistory: 15,
    };

    const minimalResult = computeRiskV1(minimalVillage);
    expect(minimalResult.confidence).toBe("low");
  });

  it("clamps component scores between 0 and 100", () => {
    const extremeNegative: RiskV1Inputs = {
      currentDepthM: 2.0,
      historicalMedianDepthM: 15.0,
      annualDepletionRateMPerYear: -5.0, // Water is rising rapidly
      preMonsoonDepthM: 2.0,
      totalDepthM: 50.0,
      monsoonRechargeRatio: 3.0,
      consentingWellsCount: 10,
      observationsLast90Days: 90,
      daysOfHistory: 100,
    };

    const result = computeRiskV1(extremeNegative);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.components.depletionTrendScore).toBe(0);
    expect(result.components.monsoonRecoveryScore).toBe(0);
    expect(result.components.levelVsHistoryScore).toBe(0);
  });
});

