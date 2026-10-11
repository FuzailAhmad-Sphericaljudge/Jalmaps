import { describe, it, expect } from "vitest";
import { calculateAquiferHealthScore } from "./health-score";
import type { DataSufficiencyResult } from "./sufficiency";
import type { MonsoonComparisonSummary } from "./monsoon";
import type { DepletionEstimate } from "./depletion";

const mockSufficiency: DataSufficiencyResult = {
  isSufficient: true,
  missingCriteria: [],
  totalReadings: 300,
  goodReadingsCount: 290,
  coverageRatio: 0.92,
  spanMonths: 12,
};

describe("calculateAquiferHealthScore", () => {
  it("computes a Healthy band score (>= 75) when recharge is strong and depletion is minimal", () => {
    const monsoon: MonsoonComparisonSummary = {
      years: [],
      latestYear: {
        year: 2025,
        preMonsoonMedianDepthM: 15.0,
        postMonsoonMedianDepthM: 10.0,
        netRiseM: 5.0, // strong recharge
        preMonsoonDaysCount: 25,
        postMonsoonDaysCount: 25,
        confidence: "high",
        confidenceNoteKey: "confidence_high_coverage",
      },
      averageNetRiseM: 5.0,
    };

    const depletion: DepletionEstimate = {
      hasEnoughYears: true,
      statusNoteKey: "ok",
      spanDays: 730,
      yearsSpan: 2.0,
      depletionRateMPerYear: 0.1, // mild depletion
      uncertaintyRangeMPerYear: { min: 0.05, max: 0.15 },
      seasonalYearlyDeltas: [],
    };

    const result = calculateAquiferHealthScore({
      sufficiency: mockSufficiency,
      monsoon,
      depletion,
      peakDrySeasonDepthM: 15.0,
      wellDepthOrCriticalThresholdM: 40.0, // plenty of buffer
    });

    expect(result.version).toBe("health_v1");
    expect(result.band).toBe("healthy");
    expect(result.score).toBeGreaterThanOrEqual(75);
    expect(result.confidence).toBe("high");
    expect(result.components).toHaveLength(4);
  });

  it("assigns Stressed / Critical band when depletion is high and buffer is nearly depleted", () => {
    const monsoon: MonsoonComparisonSummary = {
      years: [],
      latestYear: {
        year: 2025,
        preMonsoonMedianDepthM: 38.0,
        postMonsoonMedianDepthM: 37.8,
        netRiseM: 0.2, // almost no recharge
        preMonsoonDaysCount: 20,
        postMonsoonDaysCount: 20,
        confidence: "high",
        confidenceNoteKey: "confidence_high_coverage",
      },
      averageNetRiseM: 0.2,
    };

    const depletion: DepletionEstimate = {
      hasEnoughYears: true,
      statusNoteKey: "ok",
      spanDays: 730,
      yearsSpan: 2.0,
      depletionRateMPerYear: 1.8, // severe depletion (> 1.5 m/yr)
      uncertaintyRangeMPerYear: { min: 1.5, max: 2.1 },
      seasonalYearlyDeltas: [],
    };

    const result = calculateAquiferHealthScore({
      sufficiency: mockSufficiency,
      monsoon,
      depletion,
      peakDrySeasonDepthM: 38.0,
      wellDepthOrCriticalThresholdM: 40.0, // only 2m buffer left!
    });

    expect(result.band).toBe("critical");
    expect(result.score).toBeLessThan(35);
  });
});
