import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { contrastRatio, oklchToSrgb, parseCssVariables, parseOklch, type Rgb } from "../lib/color";

const cssPath = join(__dirname, "../app/globals.css");
const css = readFileSync(cssPath, "utf8");

/** Extract the `:root { ... }` and `.dark { ... }` blocks from globals.css. */
function extractBlock(selector: string): string {
  const start = css.indexOf(`${selector} {`);
  if (start === -1) throw new Error(`Block ${selector} not found in globals.css`);
  let depth = 0;
  let i = start + selector.length;
  while (i < css.length) {
    if (css[i] === "{") depth++;
    if (css[i] === "}") {
      depth--;
      if (depth === 0) break;
    }
    i++;
  }
  return css.slice(css.indexOf("{", start) + 1, i);
}

const light = parseCssVariables(extractBlock(":root"));
const dark = new Map([
  ...parseCssVariables(extractBlock(":root")),
  ...parseCssVariables(extractBlock(".dark")),
]);

function tokenColor(map: Map<string, string>, name: string): Rgb {
  const raw = map.get(`--color-${name}`);
  if (!raw) throw new Error(`Missing token --color-${name}`);
  const oklch = parseOklch(raw);
  if (!oklch) throw new Error(`Token --color-${name} is not an oklch value: ${raw}`);
  return oklchToSrgb(oklch);
}

function expectAaPair(map: Map<string, string>, theme: string, fg: string, bg: string, min = 4.5) {
  const ratio = contrastRatio(tokenColor(map, fg), tokenColor(map, bg));
  expect(
    ratio,
    `${theme}: ${fg} on ${bg} = ${ratio.toFixed(2)}, needs >= ${min}`,
  ).toBeGreaterThanOrEqual(min);
}

describe("design tokens: WCAG AA contrast (both themes)", () => {
  it("has both theme blocks with the same variable names", () => {
    expect(light.size).toBeGreaterThan(20);
    for (const name of light.keys()) {
      if (name.startsWith("--color-")) {
        expect(dark.has(name), `${name} missing in dark theme`).toBe(true);
      }
    }
  });

  for (const [theme, map] of [
    ["light", light],
    ["dark", dark],
  ] as const) {
    describe(`${theme} theme`, () => {
      it("meets AA for body text on background and surfaces", () => {
        expectAaPair(map, theme, "foreground", "background");
        expectAaPair(map, theme, "foreground", "surface");
        expectAaPair(map, theme, "foreground", "surface-muted");
        expectAaPair(map, theme, "foreground-muted", "background");
        expectAaPair(map, theme, "foreground-muted", "surface");
      });

      it("meets AA for primary button text", () => {
        expectAaPair(map, theme, "primary-foreground", "primary");
        expectAaPair(map, theme, "primary", "background");
      });

      it("meets AA for status text on background and soft fills", () => {
        for (const status of ["success", "warning", "danger", "offline"]) {
          expectAaPair(map, theme, status, "background");
          expectAaPair(map, theme, status, `${status}-soft`);
        }
      });

      it("meets AA for text on solid status fills", () => {
        for (const status of ["success", "warning", "danger", "offline"]) {
          expectAaPair(map, theme, `${status}-foreground`, status);
        }
      });
    });
  }
});
