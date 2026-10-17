import { describe, expect, it } from "vitest";
import { calculateVillageStressScore } from "./stress-score";

describe("calculateVillageStressScore", () => {
  it("returns privacy suppressed result when suppressed flag is true", () => {
    const res = calculateVillageStressScore({
      wellsCount: 2,
      nodesOnline: 2,
      pctCritical: 50,
      pctWarning: 0,
      pctOffline: 0,
      avgChange30dM: 1.5,
      openCriticalAlerts: 2,
      aquiferHealthScore: 20,
      isPrivacySuppressed: true,
    });

    expect(res.score).toBe(0);
    expect(res.isPrivacySuppressed).toBe(true);
    expect(res.reasonChips[0]?.translationKey).toBe("chip_privacy_suppressed");
  });

  it("calculates high stress score for village with critical wells, depletion, and open alerts", () => {
    const res = calculateVillageStressScore({
      wellsCount: 10,
      nodesOnline: 6,
      pctCritical: 40,
      pctWarning: 20,
      pctOffline: 40,
      avgChange30dM: 0.8,
      openCriticalAlerts: 3,
      aquiferHealthScore: 25,
      isPrivacySuppressed: false,
    });

    // criticalWells: (40/50)*30 = 24
    // depletion: 0.8m -> 18
    // offline: (40/40)*20 = 20
    // criticalAlerts: 3 alerts -> 15
    // aquifer: (100 - 25)/100 * 10 = 8
    // total: 24 + 18 + 20 + 15 + 8 = 85
    expect(res.score).toBeGreaterThanOrEqual(80);
    expect(res.severity).toBe("critical");
    expect(res.reasonChips.length).toBeGreaterThan(1);
    expect(res.reasonChips.some((c) => c.id === "critical_wells")).toBe(true);
    expect(res.reasonChips.some((c) => c.id === "critical_alerts")).toBe(true);
  });

  it("calculates low stress score for healthy and stable village", () => {
    const res = calculateVillageStressScore({
      wellsCount: 8,
      nodesOnline: 8,
      pctCritical: 0,
      pctWarning: 0,
      pctOffline: 0,
      avgChange30dM: -0.2, // recharging
      openCriticalAlerts: 0,
      aquiferHealthScore: 85,
      isPrivacySuppressed: false,
    });

    // criticalWells: 0
    // depletion: 0
    // offline: 0
    // alerts: 0
    // aquifer: (100 - 85)/100 * 10 = 2
    expect(res.score).toBeLessThanOrEqual(10);
    expect(res.severity).toBe("low");
    expect(res.reasonChips[0]?.translationKey).toBe("chip_stable_condition");
  });

  it("caps score between 0 and 100", () => {
    const res = calculateVillageStressScore({
      wellsCount: 20,
      nodesOnline: 0,
      pctCritical: 100,
      pctWarning: 0,
      pctOffline: 100,
      avgChange30dM: 5.0,
      openCriticalAlerts: 10,
      aquiferHealthScore: 0,
      isPrivacySuppressed: false,
    });

    expect(res.score).toBe(100);
    expect(res.severity).toBe("critical");
  });
});
