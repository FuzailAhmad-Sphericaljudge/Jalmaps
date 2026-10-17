import { describe, it, expect } from "vitest";
import { runScenarioBacktest } from "./backtest";

describe("Aquifer Insights Backtest Suite", () => {
  it("accurately estimates depletion rate and detects pumping for over_extraction", () => {
    const res = runScenarioBacktest("over_extraction", 2, 42);
    expect(res.groundTruthTrendMYr).toBe(1.5);
    expect(res.estimatedTrendMYr).not.toBeNull();
    // Over-extraction should be detected with a depletion rate > 0.8 m/yr
    expect(res.estimatedTrendMYr!).toBeGreaterThan(0.8);
    // Drawdown should be detected
    expect(res.detectedDrawdownM).toBeGreaterThan(1.0);
    // Health band should be stressed or critical
    expect(["stressed", "critical"]).toContain(res.healthBand);
    expect(res.passed).toBe(true);
  });

  it("identifies drought scenario with low health score", () => {
    const res = runScenarioBacktest("drought", 2, 42);
    expect(res.groundTruthTrendMYr).toBe(1.0);
    expect(res.estimatedTrendMYr).not.toBeNull();
    expect(["stressed", "critical"]).toContain(res.healthBand);
    expect(res.passed).toBe(true);
  });

  it("identifies good recharge scenario with healthy/watch health score", () => {
    const res = runScenarioBacktest("good_recharge", 2, 42);
    expect(res.estimatedRechargeRiseM).not.toBeNull();
    // In good_recharge, the net rise is calculated and health band is watch or healthy
    expect(["healthy", "watch"]).toContain(res.healthBand);
    expect(res.passed).toBe(true);
  });
});
