import { describe, expect, it } from "vitest";
import { getRangePreset } from "./ranges";

describe("getRangePreset", () => {
  it("calculates 24h range", () => {
    const now = new Date("2026-06-15T12:00:00Z");
    const { from, to, preset } = getRangePreset("24h", now);
    expect(preset).toBe("24h");
    expect(to.getTime()).toBe(now.getTime());
    expect(from.getTime()).toBe(now.getTime() - 24 * 60 * 60 * 1000);
  });

  it("calculates 7d range", () => {
    const now = new Date("2026-06-15T12:00:00Z");
    const { from, to } = getRangePreset("7d", now);
    expect(to.getTime()).toBe(now.getTime());
    expect(from.getTime()).toBe(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  });

  it("calculates 30d range", () => {
    const now = new Date("2026-06-15T12:00:00Z");
    const { from, to } = getRangePreset("30d", now);
    expect(to.getTime()).toBe(now.getTime());
    expect(from.getTime()).toBe(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  });

  it("calculates Kharif season (June to Oct) from inside the season", () => {
    const now = new Date("2026-08-15T12:00:00Z");
    const { from, to } = getRangePreset("kharif", now);
    expect(from.getMonth()).toBe(5); // June
    expect(from.getDate()).toBe(1);
    expect(from.getFullYear()).toBe(2026);
    expect(to.getTime()).toBe(now.getTime()); // Capped at now
  });

  it("calculates Kharif season from before the season (should return previous year)", () => {
    const now = new Date("2026-03-15T12:00:00Z");
    const { from, to } = getRangePreset("kharif", now);
    expect(from.getMonth()).toBe(5);
    expect(from.getFullYear()).toBe(2025);
    expect(to.getMonth()).toBe(9); // Oct
    expect(to.getDate()).toBe(31);
    expect(to.getFullYear()).toBe(2025);
  });

  it("calculates Rabi season (Nov to Mar) from inside the season (current year Jan)", () => {
    const now = new Date("2026-01-15T12:00:00Z");
    const { from, to } = getRangePreset("rabi", now);
    expect(from.getMonth()).toBe(10); // Nov
    expect(from.getFullYear()).toBe(2025);
    expect(to.getTime()).toBe(now.getTime());
  });

  it("calculates Zaid season (Apr to May) from inside the season", () => {
    const now = new Date("2026-04-15T12:00:00Z");
    const { from, to } = getRangePreset("zaid", now);
    expect(from.getMonth()).toBe(3); // Apr
    expect(from.getDate()).toBe(1);
    expect(to.getTime()).toBe(now.getTime());
  });
});
