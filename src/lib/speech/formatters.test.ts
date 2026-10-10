import { describe, it, expect } from "vitest";
import { formatNumberForSpeech } from "./formatters";

describe("formatNumberForSpeech", () => {
  it("formats integer values correctly", () => {
    expect(formatNumberForSpeech(12, "en-US")).toBe("12");
  });

  it("rounds to nearest 0.5", () => {
    expect(formatNumberForSpeech(12.3, "en-US")).toBe("12.5");
    expect(formatNumberForSpeech(12.1, "en-US")).toBe("12");
    expect(formatNumberForSpeech(12.8, "en-US")).toBe("13");
  });

  it("respects locale", () => {
    // In some locales, comma is used instead of dot
    expect(formatNumberForSpeech(12.5, "de-DE")).toBe("12,5");
  });
});
