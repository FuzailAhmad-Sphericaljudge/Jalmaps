import { describe, expect, it } from "vitest";

import {
  feetToMetres,
  formatDepth,
  formatDepthWithUnit,
  metresToFeet,
  parseUnitPreference,
  roundTo,
  METRES_PER_FOOT,
} from "./depth";

describe("unit constants and conversion", () => {
  it("uses the exact international foot", () => {
    expect(METRES_PER_FOOT).toBe(0.3048);
  });

  it("converts metres to feet and back within float tolerance", () => {
    expect(metresToFeet(0.3048)).toBeCloseTo(1, 10);
    expect(metresToFeet(1)).toBeCloseTo(3.28084, 5);
    expect(feetToMetres(1)).toBeCloseTo(0.3048, 10);
    expect(feetToMetres(metresToFeet(42))).toBeCloseTo(42, 10);
  });
});

describe("roundTo", () => {
  it("handles classic float rounding traps", () => {
    expect(roundTo(2.675, 2)).toBe(2.68);
    expect(roundTo(1.005, 2)).toBe(1.01);
    expect(roundTo(1.45, 1)).toBe(1.5);
  });

  it("is stable for already-rounded values", () => {
    expect(roundTo(11.3, 1)).toBe(11.3);
    expect(roundTo(0, 2)).toBe(0);
    // Math.round ties toward +Infinity: -12.5 → -12.
    expect(roundTo(-1.25, 1)).toBe(-1.2);
  });
});

describe("parseUnitPreference", () => {
  it("accepts ft and defaults everything else to metres", () => {
    expect(parseUnitPreference("ft")).toBe("ft");
    expect(parseUnitPreference("m")).toBe("m");
    expect(parseUnitPreference(undefined)).toBe("m");
    expect(parseUnitPreference("fathoms")).toBe("m");
  });
});

describe("formatDepth", () => {
  it("keeps metres values in metres with one decimal", () => {
    expect(formatDepth(11.3, "m", "en")).toBe("11.3");
    expect(formatDepth(11.34, "m", "en")).toBe("11.3");
    expect(formatDepth(11.36, "m", "en")).toBe("11.4");
    expect(formatDepth(0, "m", "en")).toBe("0.0");
  });

  it("converts metres to feet for display when preferred", () => {
    // 10 m = 32.8084 ft → 32.8
    expect(formatDepth(10, "ft", "en")).toBe("32.8");
    // 42 m = 137.795… ft → 137.8
    expect(formatDepth(42, "ft", "en")).toBe("137.8");
    // 0.3048 m = exactly 1 ft
    expect(formatDepth(0.3048, "ft", "en")).toBe("1.0");
  });

  it("rounds feet display to whole feet when asked", () => {
    expect(formatDepth(10, "ft", "en", { fractionDigits: 0 })).toBe("33");
    expect(formatDepth(0.3048, "ft", "en", { fractionDigits: 0 })).toBe("1");
  });

  it("uses Indian digit grouping on large depths", () => {
    // 30480 m = 100,000 ft exactly; en-IN groups as 1,00,000.0
    expect(formatDepth(30480, "ft", "en")).toBe("1,00,000.0");
    expect(formatDepth(30480, "m", "en")).toBe("30,480.0");
  });

  it("formats Hindi with CLDR-default Latin digits", () => {
    // hi-IN defaults to latn digits; Devanagari digits would need an explicit
    // hi-IN-u-nu-deva override (see docs/i18n.md).
    expect(formatDepth(11.3, "m", "hi")).toBe("11.3");
    expect(formatDepth(10, "ft", "hi")).toBe("32.8");
  });

  it("never renders negative zero", () => {
    expect(formatDepth(-0.001, "m", "en")).toBe("-0.0");
    expect(formatDepth(-0, "m", "en")).toBe("0.0");
  });
});

describe("formatDepthWithUnit", () => {
  it("appends the unit symbol", () => {
    expect(formatDepthWithUnit(11.3, "m", "en")).toBe("11.3 m");
    expect(formatDepthWithUnit(11.3, "ft", "en")).toBe("37.1 ft");
  });
});
