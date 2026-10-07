import { describe, expect, it } from "vitest";
import { columnToCurrentMa, currentToColumnM, columnToDepthToWater } from "./math";

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
    expect(currentToColumnM(4, RANGE)).toBe(0);
    expect(currentToColumnM(12, RANGE)).toBe(15);
    expect(currentToColumnM(20, RANGE)).toBe(30);
    // Clamping
    expect(currentToColumnM(2, RANGE)).toBe(0);
    expect(currentToColumnM(25, RANGE)).toBe(30);
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
    const calculatedColumn = currentToColumnM(ma, RANGE);
    expect(calculatedColumn).toBeCloseTo(originalColumn, 5);
  });
});
