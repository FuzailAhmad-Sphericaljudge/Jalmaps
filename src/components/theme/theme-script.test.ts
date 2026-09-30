import { describe, expect, it } from "vitest";

import { THEME_SCRIPT } from "./theme-script";

describe("THEME_SCRIPT", () => {
  it("is a self-contained IIFE safe to inline", () => {
    expect(THEME_SCRIPT).toMatch(/^\(function\(\)\{/);
    expect(THEME_SCRIPT.endsWith("})();")).toBe(true);
  });

  it("toggles the dark class from a stored cookie value", () => {
    document.cookie = `jalmaps-theme=${encodeURIComponent(JSON.stringify({ theme: "dark" }))}; path=/`;
    document.documentElement.classList.remove("dark");

    new Function(THEME_SCRIPT)();

    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(document.documentElement.style.colorScheme).toBe("dark");
    document.cookie = "jalmaps-theme=; path=/; max-age=0";
  });

  it("falls back to light when no cookie exists", () => {
    document.cookie = "jalmaps-theme=; path=/; max-age=0";
    document.documentElement.classList.add("dark");

    new Function(THEME_SCRIPT)();

    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });
});
