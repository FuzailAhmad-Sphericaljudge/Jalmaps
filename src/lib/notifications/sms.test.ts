import { describe, it, expect } from "vitest";
import { estimateSmsSegments } from "./sms";

describe("estimateSmsSegments", () => {
  it("should estimate segments correctly for GSM-7", () => {
    // English is usually GSM-7
    const englishMsg = "Warning: well is below threshold.";
    expect(estimateSmsSegments(englishMsg)).toBe(1);

    // 160 chars is 1 segment
    const longMsg = "a".repeat(160);
    expect(estimateSmsSegments(longMsg)).toBe(1);

    const veryLongMsg = "a".repeat(161);
    expect(estimateSmsSegments(veryLongMsg)).toBe(2);
  });

  it("should estimate segments correctly for UCS-2 (Hindi)", () => {
    const hindiMsg = "चेतावनी: कुएं का जल स्तर सीमा से नीचे है।";
    // UCS-2 is 70 chars max per segment
    expect(estimateSmsSegments(hindiMsg)).toBe(1);

    const longHindiMsg = "चे".repeat(71);
    expect(estimateSmsSegments(longHindiMsg)).toBe(3);
  });
});
