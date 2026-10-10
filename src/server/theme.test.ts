import { describe, expect, it } from "vitest";

import { parseThemeCookieValue, serializeThemeCookieValue } from "./theme";

describe("theme cookie", () => {
  it("round-trips a dark preference", () => {
    const cookie = serializeThemeCookieValue("dark");
    expect(parseThemeCookieValue(cookie)).toBe("dark");
  });

  it("falls back to system for missing or garbage values", () => {
    expect(parseThemeCookieValue(undefined)).toBe("system");
    expect(parseThemeCookieValue("not-json")).toBe("system");
    expect(parseThemeCookieValue(JSON.stringify({ theme: "neon" }))).toBe("system");
  });
});
