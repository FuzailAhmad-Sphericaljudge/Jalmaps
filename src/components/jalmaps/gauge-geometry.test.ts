import { describe, expect, it } from "vitest";

import { clamp, describeArc, polarToCartesian, ratio } from "./gauge-geometry";

describe("clamp", () => {
  it("clamps into range", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(11, 0, 10)).toBe(10);
  });
});

describe("ratio", () => {
  it("normalises values into 0..1", () => {
    expect(ratio(5, 0, 10)).toBe(0.5);
    expect(ratio(-3, 0, 10)).toBe(0);
    expect(ratio(15, 0, 10)).toBe(1);
  });

  it("returns 0 when max equals min (degenerate range)", () => {
    expect(ratio(4, 4, 4)).toBe(0);
  });
});

describe("polarToCartesian", () => {
  it("maps 0deg to 3 o'clock and 90deg to 6 o'clock", () => {
    expect(polarToCartesian(50, 50, 40, 0)).toEqual({ x: 90, y: 50 });
    expect(polarToCartesian(50, 50, 40, 90).x).toBeCloseTo(50);
    expect(polarToCartesian(50, 50, 40, 90).y).toBeCloseTo(90);
  });
});

describe("describeArc", () => {
  it("starts at the start point and ends at the end point", () => {
    const d = describeArc(50, 50, 40, 180, 270);
    const numbers = d
      .split(/[ A]/)
      .map(Number)
      .filter((n) => !Number.isNaN(n));
    const [mx, my, , , , , ex, ey] = numbers;
    expect(mx).toBeCloseTo(10); // (50 - 40, 50): 180 deg
    expect(my).toBeCloseTo(50);
    expect(ex).toBeCloseTo(50); // 270 deg is straight up in SVG coords
    expect(ey).toBeCloseTo(10);
  });

  it("marks the large-arc flag for arcs over 180deg", () => {
    expect(describeArc(50, 50, 40, 180, 361)).toContain(" 1 1 ");
  });
});
