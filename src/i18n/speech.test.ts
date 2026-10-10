import { describe, it, expect } from "vitest";
import enSpeech from "./messages/en/speech.json";
import hiSpeech from "./messages/hi/speech.json";

describe("Speech strings", () => {
  const checkLengths = (messages: Record<string, string>, locale: string) => {
    for (const [key, text] of Object.entries(messages)) {
      // Rough estimate: average speaking rate is ~130 words per minute (or ~2.5 words per second)
      // 15 seconds is about 37.5 words. Let's say ~250 characters as a rough safety limit.
      it(`[${locale}] ${key} should be brief enough for speech (< 200 chars)`, () => {
        expect(text.length).toBeLessThan(200);
      });
    }
  };

  checkLengths(enSpeech, "en");
  checkLengths(hiSpeech, "hi");
});
