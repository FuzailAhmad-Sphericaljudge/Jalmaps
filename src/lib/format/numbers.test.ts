import { describe, expect, it } from "vitest";

import {
  formatCompactNumber,
  formatDate,
  formatDecimal,
  formatNumber,
  formatPercent,
  formatRelativeTime,
  formatSignedNumber,
  formatTime,
} from "./numbers";

// Fixed instant: 2026-10-01T12:00:00+05:30 (Asia/Kolkata).
const NOW = new Date("2026-10-01T06:30:00Z");

describe("formatNumber (Indian grouping)", () => {
  it("groups en-IN numbers in lakhs and crores", () => {
    expect(formatNumber(100000, "en")).toBe("1,00,000");
    expect(formatNumber(12345678, "en")).toBe("1,23,45,678");
    expect(formatNumber(1000, "en")).toBe("1,000");
  });

  it("formats plain small numbers without grouping surprises", () => {
    expect(formatNumber(42, "en")).toBe("42");
    expect(formatNumber(11.3, "en")).toBe("11.3");
  });

  it("produces lakh/crore grouping for Hindi too", () => {
    // Devanagari digits are the hi-IN default.
    expect(formatNumber(100000, "hi")).toMatch(/^१|1/);
  });
});

describe("formatCompactNumber", () => {
  it("uses Indian-scale words in English", () => {
    expect(formatCompactNumber(1234567, "en")).toContain("lakh");
    expect(formatCompactNumber(25000000, "en")).toContain("crore");
  });
});

describe("formatDecimal", () => {
  it("fixes the fraction digit count", () => {
    expect(formatDecimal(11.3, "en", 1)).toBe("11.3");
    expect(formatDecimal(11, "en", 1)).toBe("11.0");
    expect(formatDecimal(11.34, "en", 1)).toBe("11.3");
    expect(formatDecimal(11.35, "en", 1)).toMatch(/^11\.3|11\.4$/);
  });

  it("groups the integer part the Indian way", () => {
    expect(formatDecimal(123456.789, "en", 2)).toBe("1,23,456.79");
  });
});

describe("formatPercent", () => {
  it("formats fractions as percentages", () => {
    expect(formatPercent(0.75, "en")).toBe("75%");
    expect(formatPercent(0.123, "en", 1)).toMatch(/12\.3%/);
  });
});

describe("formatSignedNumber", () => {
  it("adds a plus sign for positives and keeps negatives", () => {
    expect(formatSignedNumber(0.4, "en")).toBe("+0.40");
    expect(formatSignedNumber(-1.2, "en")).toBe("-1.20");
    expect(formatSignedNumber(0, "en")).toBe("0.00");
  });
});

describe("formatDate / formatTime (Asia/Kolkata)", () => {
  it("renders the IST calendar date regardless of viewer timezone", () => {
    // 2026-09-30T20:30:00Z is already Oct 1 in India.
    const utc = "2026-09-30T20:30:00Z";
    expect(formatDate(utc, "en", { dateStyle: "long" })).toContain("October 2026");
    expect(formatDate(utc, "en", { dateStyle: "long" })).toContain("1");
  });

  it("formats the time of day in IST", () => {
    const utc = "2026-10-01T06:30:00Z"; // 12:00 IST
    const formatted = formatTime(utc, "en");
    expect(formatted).toMatch(/12[:.]00/);
    expect(formatted).toMatch(/pm/i);
  });
});

describe("formatRelativeTime", () => {
  it("formats past times with the largest fitting unit", () => {
    expect(formatRelativeTime(new Date(NOW.getTime() - 3 * 3600_000), "en", NOW)).toMatch(
      /3 hours ago/,
    );
    expect(formatRelativeTime(new Date(NOW.getTime() - 2 * 86_400_000), "en", NOW)).toMatch(
      /2 days ago/,
    );
  });

  it("formats future times", () => {
    expect(formatRelativeTime(new Date(NOW.getTime() + 2 * 86_400_000), "en", NOW)).toMatch(
      /in 2 days/,
    );
  });

  it("handles sub-minute freshness without a zero-hour oddity", () => {
    const text = formatRelativeTime(new Date(NOW.getTime() - 5_000), "en", NOW);
    expect(text).toMatch(/second|now/i);
  });
});
