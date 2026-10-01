import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * check-i18n.ts resolves the messages directory as
 * `path.resolve("src/i18n/messages")`, i.e. relative to the process cwd.
 * These tests chdir into a disposable fixture tree, write message files
 * there, and re-import the module fresh (vi.resetModules) per test so the
 * resolve happens against the fixture.
 */

let fixtureDir: string;
let originalCwd: string;

const EN_COMMON = JSON.stringify({
  appName: "JalMaps",
  greeting: "Hello {name}",
  wells: "{count, plural, =0 {none} other {# wells}}",
});

function writeTree(files: Record<string, string>) {
  for (const [relative, content] of Object.entries(files)) {
    const absolute = path.join(fixtureDir, relative);
    mkdirSync(path.dirname(absolute), { recursive: true });
    writeFileSync(absolute, content);
  }
}

/** Re-import check-i18n fresh so MESSAGES_DIR resolves against the cwd. */
async function runCheck(): Promise<string[]> {
  vi.resetModules();
  const mod = (await import("./check-i18n")) as typeof import("./check-i18n");
  return mod.checkI18n();
}

beforeAll(() => {
  fixtureDir = mkdtempSync(path.join(tmpdir(), "jalmaps-i18n-"));
  originalCwd = process.cwd();
  process.chdir(fixtureDir);
});

beforeEach(() => {
  writeTree({
    "src/i18n/messages/en/common.json": EN_COMMON,
    "src/i18n/messages/hi/common.json": JSON.stringify({
      appName: "जलमैप्स",
      greeting: "नमस्ते {name}",
      wells: "{count, plural, =0 {कोई नहीं} other {# कुएँ}}",
    }),
  });
});

afterAll(() => {
  process.chdir(originalCwd);
  rmSync(fixtureDir, { recursive: true, force: true });
});

describe("checkI18n", () => {
  it("passes when a locale matches English exactly", async () => {
    const problems = await runCheck();
    expect(problems).toEqual([]);
  });

  it("catches a deliberately removed key", async () => {
    writeTree({
      "src/i18n/messages/hi/common.json": JSON.stringify({
        appName: "जलमैप्स",
        greeting: "नमस्ते {name}",
        // "wells" deliberately removed
      }),
    });
    const problems = await runCheck();
    expect(problems.some((p) => p.includes('missing key "common.wells"'))).toBe(true);
  });

  it("catches extra keys not present in English", async () => {
    writeTree({
      "src/i18n/messages/hi/common.json": JSON.stringify({
        appName: "जलमैप्स",
        greeting: "नमस्ते {name}",
        wells: "{count, plural, =0 {कोई नहीं} other {# कुएँ}}",
        surprise: "अतिरिक्त",
      }),
    });
    const problems = await runCheck();
    expect(problems.some((p) => p.includes('extra key "common.surprise"'))).toBe(true);
  });

  it("catches ICU argument mismatches", async () => {
    writeTree({
      "src/i18n/messages/hi/common.json": JSON.stringify({
        appName: "जलमैप्स",
        greeting: "नमस्ते {naam}",
        wells: "{count, plural, =0 {कोई नहीं} other {# कुएँ}}",
      }),
    });
    const problems = await runCheck();
    expect(problems.some((p) => p.includes("ICU arguments differ"))).toBe(true);
  });

  it("compares each namespace separately (no cross-namespace false missing keys)", async () => {
    // Regression: when the checker compared a per-namespace locale map
    // against a global English map built from ALL namespaces, every other
    // namespace's keys were reported missing. A shared key name ("title")
    // in two namespaces reproduces the shape that broke.
    writeTree({
      "src/i18n/messages/en/common.json": JSON.stringify({
        title: "JalMaps",
      }),
      "src/i18n/messages/en/home.json": JSON.stringify({
        title: "Welcome",
        body: "A deep{count, plural, one {# level} other {# levels}} guide",
      }),
      "src/i18n/messages/hi/common.json": JSON.stringify({
        title: "जलमैप्स",
      }),
      "src/i18n/messages/hi/home.json": JSON.stringify({
        title: "स्वागत",
        body: "एक गहरा{count, plural, one {# स्तर} other {# स्तर}} मार्गदर्शिका",
      }),
    });
    const problems = await runCheck();
    expect(problems).toEqual([]);
  });

  it("catches plural option mismatches", async () => {
    writeTree({
      "src/i18n/messages/hi/common.json": JSON.stringify({
        appName: "जलमैप्स",
        greeting: "नमस्ते {name}",
        // dropped the =0 branch
        wells: "{count, plural, other {# कुएँ}}",
      }),
    });
    const problems = await runCheck();
    expect(problems.some((p) => p.includes("options differ"))).toBe(true);
  });
});
