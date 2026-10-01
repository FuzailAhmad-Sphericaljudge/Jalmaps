/**
 * Colour maths for verifying WCAG contrast of design tokens.
 *
 * Converts oklch() values (as used in src/app/globals.css) to sRGB, computes
 * WCAG 2.x relative luminance and contrast ratios. Used by token tests.
 */

export type Oklch = { l: number; c: number; h: number };
export type Rgb = { r: number; g: number; b: number }; // 0..1, gamma-encoded

/** oklch -> linear sRGB (Björn Ottosson's OKLab matrices). */
export function oklchToLinearRgb({ l, c, h }: Oklch): Rgb {
  const hr = (h * Math.PI) / 180;
  const a = c * Math.cos(hr);
  const b = c * Math.sin(hr);

  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.291485548 * b;

  const L = l_ ** 3;
  const M = m_ ** 3;
  const S = s_ ** 3;

  return {
    r: +4.0767416621 * L - 3.3077115913 * M + 0.2309699292 * S,
    g: -1.2684380046 * L + 2.6097574011 * M - 0.3413193965 * S,
    b: -0.0041960863 * L - 0.7034186147 * M + 1.707614701 * S,
  };
}

const clamp01 = (x: number): number => Math.min(1, Math.max(0, x));

function linearToGamma(channel: number): number {
  return channel <= 0.0031308 ? 12.92 * channel : 1.055 * channel ** (1 / 2.4) - 0.055;
}

/** oklch -> gamma-encoded sRGB, channels clamped to 0..1. */
export function oklchToSrgb(oklch: Oklch): Rgb {
  const lin = oklchToLinearRgb(oklch);
  return {
    r: linearToGamma(clamp01(lin.r)),
    g: linearToGamma(clamp01(lin.g)),
    b: linearToGamma(clamp01(lin.b)),
  };
}

/** WCAG 2.x relative luminance from gamma-encoded sRGB. */
export function relativeLuminance({ r, g, b }: Rgb): number {
  const lin = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** WCAG contrast ratio, (L1 + 0.05) / (L2 + 0.05), >= 1. */
export function contrastRatio(a: Rgb, b: Rgb): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [lighter, darker] = la >= lb ? [la, lb] : [lb, la];
  return (lighter + 0.05) / (darker + 0.05);
}

/** Parse `oklch(L C H)`; null for anything else. */
export function parseOklch(value: string): Oklch | null {
  const match = /^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)$/.exec(value.trim());
  if (!match) return null;
  const l = Number(match[1]);
  const c = Number(match[2]);
  const h = Number(match[3]);
  if (Number.isNaN(l) || Number.isNaN(c) || Number.isNaN(h)) return null;
  return { l, c, h };
}

/**
 * Extract `--token: value;` declarations from a `:root`/`.dark` CSS block.
 * Only simple `name: value;` pairs — no nesting.
 */
export function parseCssVariables(block: string): Map<string, string> {
  const vars = new Map<string, string>();
  const pattern = /--[\w-]+\s*:\s*[^;{}]+;/g;
  for (const decl of block.matchAll(pattern)) {
    const [name, value] = decl[0].split(":", 2);
    if (name && value) {
      vars.set(name.trim(), value.trim().replace(/;$/, ""));
    }
  }
  return vars;
}
