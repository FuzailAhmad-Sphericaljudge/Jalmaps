import { describe, it, expect } from "vitest";
import { runAdvisoryEngine, starterRules } from "./engine";
import { WellFacts } from "./facts";

describe("runAdvisoryEngine", () => {
  const baseFacts: WellFacts = {
    depthTrend7d: 0,
    levelVsOwnHistoryPercentile: 50,
    stressLevel: "normal",
    daysSinceSowing: 10,
    currentStage: "Vegetative",
    cropWaterSensitivity: "low",
    season: "kharif",
    dataQuality: "good",
    daysToCritical: 30,
    expectedRainfall: 0,
  };

  const now = new Date("2026-10-10T12:00:00Z");

  it("returns generic fallback when no rules match", () => {
    const advice = runAdvisoryEngine(starterRules, baseFacts, [], now);
    expect(advice).toHaveLength(1);
    expect(advice[0]?.id).toBe("generic_fallback");
  });

  it("prioritizes suspect data rule", () => {
    const facts = { ...baseFacts, dataQuality: "suspect" as const };
    const advice = runAdvisoryEngine(starterRules, facts, [], now);
    expect(advice[0]?.id).toBe("suspect_sensor_data");
  });

  it("returns multiple rules sorted by priority", () => {
    const facts = {
      ...baseFacts,
      dataQuality: "suspect" as const, // 110
      depthTrend7d: 1.0, // fast depletion, 90
    };
    const advice = runAdvisoryEngine(starterRules, facts, [], now);
    expect(advice).toHaveLength(2);
    expect(advice[0]?.id).toBe("suspect_sensor_data");
    expect(advice[1]?.id).toBe("fast_depletion");
  });

  it("respects cooldowns", () => {
    const facts = { ...baseFacts, dataQuality: "suspect" as const };
    const history = [{ ruleId: "suspect_sensor_data", date: "2026-10-10T00:00:00Z" }]; // same day
    const advice = runAdvisoryEngine(starterRules, facts, history, now);
    // Should be filtered out by cooldown, fallback returns
    expect(advice[0]?.id).toBe("generic_fallback");
  });

  it("allows rule if cooldown expired", () => {
    const facts = { ...baseFacts, dataQuality: "suspect" as const };
    const history = [{ ruleId: "suspect_sensor_data", date: "2026-10-05T00:00:00Z" }]; // 5 days ago (cooldown is 1)
    const advice = runAdvisoryEngine(starterRules, facts, history, now);
    expect(advice[0]?.id).toBe("suspect_sensor_data");
  });

  it("limits output to 3 rules maximum", () => {
    // Force 4 rules to match (need to define dummy rules)
    const manyRules = [
      ...starterRules,
      {
        id: "dummy1",
        version: 1,
        enabled: true,
        priority: 50,
        cooldown_days: 0,
        advice_key: "k1",
        conditions: { all: [{ fact: "stressLevel", operator: "==", value: "normal" }] },
      },
      {
        id: "dummy2",
        version: 1,
        enabled: true,
        priority: 40,
        cooldown_days: 0,
        advice_key: "k2",
        conditions: { all: [{ fact: "stressLevel", operator: "==", value: "normal" }] },
      },
      {
        id: "dummy3",
        version: 1,
        enabled: true,
        priority: 30,
        cooldown_days: 0,
        advice_key: "k3",
        conditions: { all: [{ fact: "stressLevel", operator: "==", value: "normal" }] },
      },
      {
        id: "dummy4",
        version: 1,
        enabled: true,
        priority: 20,
        cooldown_days: 0,
        advice_key: "k4",
        conditions: { all: [{ fact: "stressLevel", operator: "==", value: "normal" }] },
      },
    ];

    const advice = runAdvisoryEngine(manyRules, baseFacts, [], now);
    expect(advice).toHaveLength(3);
    expect(advice[0]?.id).toBe("dummy1");
    expect(advice[1]?.id).toBe("dummy2");
    expect(advice[2]?.id).toBe("dummy3");
  });
});
