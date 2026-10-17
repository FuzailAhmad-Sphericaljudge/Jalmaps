import { describe, it, expect } from "vitest";
import { estimateMonsoonRecharge } from "./recharge";

describe("estimateMonsoonRecharge", () => {
  it("outputs rise in metres without volume when specific yield or area is missing", () => {
    const result = estimateMonsoonRecharge({
      monsoonComparison: {
        year: 2025,
        preMonsoonMedianDepthM: 16.5,
        postMonsoonMedianDepthM: 11.5,
        netRiseM: 5.0,
        preMonsoonDaysCount: 25,
        postMonsoonDaysCount: 25,
        confidence: "high",
        confidenceNoteKey: "confidence_high_coverage",
      },
    });

    expect(result.year).toBe(2025);
    expect(result.riseM).toBe(5.0);
    expect(result.equivalentRechargeDepthMm).toBeNull();
    expect(result.estimatedRechargeVolumeM3).toBeNull();
    expect(result.isEstimate).toBe(true);
    expect(result.assumptionsKeys).toContain("assumption_unconfined_aquifer");
    expect(result.assumptionsKeys).toContain("assumption_uniform_specific_yield");
  });

  it("calculates equivalent depth (mm) and volumetric estimates when Sy and village area are present", () => {
    // Village area: 500 hectares = 5,000,000 m2
    // Rise: 4.0m, Sy: 0.08 (typical hard rock granite / weathered basalt)
    // Equivalent recharge depth: 4.0 * 0.08 * 1000 = 320 mm
    // Volume: 4.0 * 0.08 * 5,000,000 = 1,600,000 m3 = 1.6 MCM = 16,000 Lakh Litres
    const result = estimateMonsoonRecharge({
      monsoonComparison: {
        year: 2025,
        preMonsoonMedianDepthM: 18.0,
        postMonsoonMedianDepthM: 14.0,
        netRiseM: 4.0,
        preMonsoonDaysCount: 20,
        postMonsoonDaysCount: 22,
        confidence: "high",
        confidenceNoteKey: "confidence_high_coverage",
      },
      specificYield: 0.08,
      specificYieldSource: "aquifer_type_default",
      areaM2: 5_000_000,
    });

    expect(result.riseM).toBe(4.0);
    expect(result.equivalentRechargeDepthMm).toBe(320);
    expect(result.estimatedRechargeVolumeM3).toBe(1_600_000);
    expect(result.estimatedRechargeVolumeMCM).toBe(1.6);
    expect(result.estimatedRechargeVolumeLakhLiters).toBe(16_000);
    expect(result.specificYieldSource).toBe("aquifer_type_default");
  });
});

