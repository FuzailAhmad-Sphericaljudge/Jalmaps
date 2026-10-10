import { describe, it, expect } from "vitest";
import { buildFacts, MockForecastProvider, MockRainfallProvider, FactInput } from "./facts";

describe("buildFacts", () => {
  const mockForecast = new MockForecastProvider();
  const mockRainfall = new MockRainfallProvider();

  const baseInput: FactInput = {
    wellId: "well-1",
    sowingDate: "2026-09-01",
    cropProfile: {
      id: "wheat",
      name_en: "Wheat",
      name_hi: "गेहूँ",
      water_sensitivity: "medium",
      sowing_windows: {},
      growth_stages: [
        { name_en: "Stage1", name_hi: "Stage1_hi", duration_days: 30, water_sensitivity: "high" },
        { name_en: "Stage2", name_hi: "Stage2_hi", duration_days: 60, water_sensitivity: "medium" },
      ],
    },
    recentReadings: [
      { recorded_at: "2026-10-10T10:00:00Z", depth_to_water_m: 12 }, // today
      { recorded_at: "2026-10-03T10:00:00Z", depth_to_water_m: 10 }, // 7 days ago
    ],
    historicalReadings: [
      { depth_to_water_m: 9 },
      { depth_to_water_m: 10 },
      { depth_to_water_m: 11 },
      { depth_to_water_m: 12 },
      { depth_to_water_m: 13 },
    ],
    now: new Date("2026-10-10T12:00:00Z"),
    thresholds: { warning: 11, critical: 13 },
    faultStatus: "good",
  };

  it("computes depth trend correctly", async () => {
    const facts = await buildFacts(baseInput, mockForecast, mockRainfall);
    // 12 (today) - 10 (7 days ago) = 2
    expect(facts.depthTrend7d).toBeCloseTo(2);
  });

  it("computes level percentile correctly", async () => {
    const facts = await buildFacts(baseInput, mockForecast, mockRainfall);
    // historical <= 12 are: 9, 10, 11, 12 (4 out of 5)
    expect(facts.levelVsOwnHistoryPercentile).toBe(80);
  });

  it("determines stress level based on thresholds", async () => {
    const facts = await buildFacts(baseInput, mockForecast, mockRainfall);
    // 12 >= warning (11), not critical (13)
    expect(facts.stressLevel).toBe("warning");
  });

  it("determines crop stage correctly", async () => {
    const facts = await buildFacts(baseInput, mockForecast, mockRainfall);
    // Oct 10 is 39 days after Sept 1.
    // Stage1 is 30 days. So it is in Stage2.
    expect(facts.daysSinceSowing).toBe(39);
    expect(facts.currentStage).toBe("Stage2");
    expect(facts.cropWaterSensitivity).toBe("medium");
  });

  it("determines season from month", async () => {
    const facts = await buildFacts(baseInput, mockForecast, mockRainfall);
    // Oct = 10th month (index 9). Wait! Month is 0-indexed. Oct is index 9 (if new Date("2026-10..."), wait, let's see.
    // new Date("2026-10-10").getMonth() -> 9. Month 9 is October? No, Sept is 8, Oct is 9.
    // In my logic: month >= 5 && month <= 9 => kharif.
    expect(facts.season).toBe("kharif");
  });
});
