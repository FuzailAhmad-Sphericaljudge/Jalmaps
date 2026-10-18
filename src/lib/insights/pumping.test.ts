import { describe, it, expect } from "vitest";
import { analyzePumpStress, type RawReadingPoint } from "./pumping";

describe("analyzePumpStress", () => {
  it("detects daily drawdown and 90% recovery duration from diurnal pumping cycles", () => {
    const readings: RawReadingPoint[] = [];

    // Simulate 5 days of diurnal pumping:
    // 00:00 - 08:00: static level at 10.0m
    // 09:00 - 13:00: pump running, level drops to 14.0m (drawdown 4.0m)
    // 14:00: 13.0m
    // 15:00: 12.0m
    // 16:00: 10.8m
    // 17:00: 10.3m (<= static + 0.10 * 4.0 = 10.4m, recovers here in ~4 hours from 13:00)
    // 18:00 - 23:00: 10.1m
    for (let day = 1; day <= 5; day++) {
      const dStr = `2025-06-0${day}`;
      readings.push(
        { recordedAt: `${dStr}T04:00:00Z`, depthToWaterM: 10.0 },
        { recordedAt: `${dStr}T08:00:00Z`, depthToWaterM: 10.0 },
        { recordedAt: `${dStr}T13:00:00Z`, depthToWaterM: 14.0 }, // trough
        { recordedAt: `${dStr}T15:00:00Z`, depthToWaterM: 12.0 },
        { recordedAt: `${dStr}T17:00:00Z`, depthToWaterM: 10.3 }, // recovered
        { recordedAt: `${dStr}T21:00:00Z`, depthToWaterM: 10.1 },
      );
    }

    const result = analyzePumpStress(readings);
    expect(result.hasSufficientData).toBe(true);
    expect(result.activePumpingDaysCount).toBe(5);
    expect(result.medianDrawdownM).toBe(4.0);
    expect(result.medianRecoveryTimeHours).toBe(4.0);
    expect(result.dailyCycles).toHaveLength(5);
    expect(result.dailyCycles[0]!.drawdownM).toBe(4.0);
    expect(result.dailyCycles[0]!.recoveryTimeHours).toBe(4.0);
  });

  it("handles insufficient cycles or absent pumping safely", () => {
    // Perfectly flat sensor readings without pumping drawdown
    const readings: RawReadingPoint[] = [
      { recordedAt: "2025-06-01T04:00:00Z", depthToWaterM: 12.0 },
      { recordedAt: "2025-06-01T08:00:00Z", depthToWaterM: 12.05 },
      { recordedAt: "2025-06-01T14:00:00Z", depthToWaterM: 12.08 },
      { recordedAt: "2025-06-01T20:00:00Z", depthToWaterM: 12.02 },
    ];

    const result = analyzePumpStress(readings);
    expect(result.hasSufficientData).toBe(false);
    expect(result.stressNoteKey).toBe("pump_stress_insufficient_cycles");
    expect(result.medianDrawdownM).toBeNull();
  });
});

