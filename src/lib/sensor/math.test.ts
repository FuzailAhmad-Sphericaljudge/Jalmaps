import { describe, expect, it } from "vitest";
import { columnToCurrentMa, currentToColumnM, columnToDepthToWater, classifyQuality } from "./math";

describe("Sensor Math", () => {
  const RANGE = 30;

  it("columnToCurrentMa calculates correctly", () => {
    expect(columnToCurrentMa(0, RANGE)).toBe(4);
    expect(columnToCurrentMa(15, RANGE)).toBe(12);
    expect(columnToCurrentMa(30, RANGE)).toBe(20);
    // Out of bounds is clamped
    expect(columnToCurrentMa(-5, RANGE)).toBe(4);
    expect(columnToCurrentMa(40, RANGE)).toBe(20);
  });

  it("currentToColumnM calculates correctly", () => {
    expect(currentToColumnM(4, { range_m: RANGE })).toBe(0);
    expect(currentToColumnM(12, { range_m: RANGE })).toBe(15);
    expect(currentToColumnM(20, { range_m: RANGE })).toBe(30);
    // Clamping is removed in phase 8, values should extend
    expect(currentToColumnM(2, { range_m: RANGE })).toBe(-3.75);
    expect(currentToColumnM(25, { range_m: RANGE })).toBe(39.375);
    // Calibration offset
    expect(currentToColumnM(12, { range_m: RANGE, calibration_offset_m: -0.5 })).toBe(14.5);
  });

  it("columnToDepthToWater calculates correctly", () => {
    // 50m hang depth, 15m water column -> 35m depth to water
    expect(columnToDepthToWater(15, 50)).toBe(35);

    // Overflow protection (if column > hang depth, water is at surface 0)
    expect(columnToDepthToWater(60, 50)).toBe(0);
  });

  it("round-trips to column within tolerance", () => {
    const originalColumn = 18.5;
    const ma = columnToCurrentMa(originalColumn, RANGE);
    const calculatedColumn = currentToColumnM(ma, { range_m: RANGE });
    expect(calculatedColumn).toBeCloseTo(originalColumn, 5);
  });

  describe("classifyQuality", () => {
    it("returns good for normal readings", () => {
      expect(classifyQuality({ currentMa: 4.0 })).toBe("good");
      expect(classifyQuality({ currentMa: 12.0 })).toBe("good");
      expect(classifyQuality({ currentMa: 20.0 })).toBe("good");
    });

    it("returns suspect for values near limits", () => {
      expect(classifyQuality({ currentMa: 3.6 })).toBe("suspect");
      expect(classifyQuality({ currentMa: 3.79 })).toBe("suspect");
      expect(classifyQuality({ currentMa: 20.6 })).toBe("suspect");
    });

    it("returns bad for extreme values", () => {
      expect(classifyQuality({ currentMa: 3.4 })).toBe("bad");
      expect(classifyQuality({ currentMa: 21.1 })).toBe("bad");
      expect(classifyQuality({ currentMa: -1 })).toBe("bad");
    });

    it("returns suspect for sudden jumps", () => {
      // 6 mA change in 1 minute = > 5mA/min threshold
      expect(classifyQuality({ currentMa: 16.0, previousMa: 10.0, minutesSincePrevious: 1 })).toBe(
        "suspect",
      );
      // 4 mA change in 1 minute = normal
      expect(classifyQuality({ currentMa: 14.0, previousMa: 10.0, minutesSincePrevious: 1 })).toBe(
        "good",
      );
      // 10 mA change in 5 minutes = 2mA/min = normal
      expect(classifyQuality({ currentMa: 20.0, previousMa: 10.0, minutesSincePrevious: 5 })).toBe(
        "good",
      );
    });
  });
});
