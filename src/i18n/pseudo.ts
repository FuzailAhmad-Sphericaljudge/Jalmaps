/**
 * Pseudo-localisation.
 *
 * Transforms English messages into fake-but-plausible accented text that is
 * ~40% longer, so layout breakage (clipping, overflow, cramped 48px targets)
 * and un-translated hard-coded strings become instantly visible:
 *
 *   "Save well"      → "[Ṡáṽë ẃëĺĺ!!!]"
 *   "{count, plural, other {# wells}}" → ICU intact, inner text pseudo-fied
 *
 * Activated per browser session (cookie, via ?pseudo=1) or app-wide with the
 * NEXT_PUBLIC_PSEUDO_LOCALE env flag; see src/i18n/request.ts.
 */
import { parseIcu, type IcuToken } from "./icu";

/**
 * Characters mapped to visually distinctive accented look-alikes. The mix of
 * combining marks (lengthening) and precomposed glyphs (distinct shapes)
 * stresses both font fallback and text measurement.
 */
const ACCENT_MAP: Record<string, string> = {
  a: "á",
  e: "é",
  i: "í",
  o: "ó",
  u: "ú",
  A: "Á",
  E: "É",
  I: "Í",
  O: "Ó",
  U: "Ú",
};

const PUNCTUATION_SUFFIX = "!!!";

/**
 * Combining diaeresis appended to accented vowels: precomposed glyphs alone
 * don't add length, so this mark supplies the ~40% expansion that exposes
 * clipped layouts. It renders as a visible double-dotted stress on the font.
 */
const LENGTHENING_MARK = "\u0308";

/** Is a character ASCII letter or digit (never accented) or something else? */
function isAsciiDigit(char: string): boolean {
  return char >= "0" && char <= "9";
}

/**
 * Pseudo-fy literal text: accent vowels (adds combining-length via
 * precomposed glyphs), pad with punctuation. Digits and ICU `#` survive so
 * numbers stay legible in screenshots.
 */
export function pseudoText(text: string): string {
  let accented = "";
  for (const char of text) {
    if (isAsciiDigit(char)) {
      accented += char;
      continue;
    }
    const mapped = ACCENT_MAP[char];
    accented += mapped ? mapped + LENGTHENING_MARK : char;
  }

  // Bracket + exclamation padding exposes clipping on both ends; accented
  // vowels + the combining mark add roughly 40% length overall.
  return `[${accented}${PUNCTUATION_SUFFIX}]`;
}

/** Transform one ICU message, pseudo-fying all literal text (recursively). */
export function pseudoIcuMessage(message: string): string {
  const tokens: IcuToken[] = parseIcu(message);

  let result = "";
  for (const token of tokens) {
    if (token.kind === "text") {
      result += pseudoText(token.value);
      continue;
    }

    // Rebuild the block syntax verbatim, recursing into option bodies.
    switch (token.kind) {
      case "argument":
        result += `{${token.name}}`;
        break;
      case "number":
      case "date":
      case "time":
        result += token.style
          ? `{${token.name}, ${token.kind}, ${token.style}}`
          : `{${token.name}, ${token.kind}}`;
        break;
      case "plural":
      case "select":
      case "selectordinal": {
        const parts = token.options.map((option, i) => {
          const body = pseudoIcuFromTokens(token.bodies[i] ?? []);
          return `${option} {${body}}`;
        });
        result += `{${token.name}, ${token.kind}, ${parts.join(" ")}}`;
        break;
      }
    }
  }
  return result;
}

/** Rebuild a message from already-tokenised segments. */
function pseudoIcuFromTokens(tokens: IcuToken[]): string {
  let result = "";
  for (const token of tokens) {
    if (token.kind === "text") {
      result += pseudoText(token.value);
    } else {
      // Re-serialise the nested block, then transform it recursively so any
      // deeper nesting is covered too.
      result += pseudoIcuMessage(ReSerialiseBlock(token));
    }
  }
  return result;
}

/** Minimal re-serialisation of a token back into ICU source. */
function ReSerialiseBlock(token: IcuToken): string {
  if (token.kind === "text") return token.value;
  if (token.kind === "argument") return `{${token.name}}`;
  if (token.kind === "number" || token.kind === "date" || token.kind === "time") {
    return token.style
      ? `{${token.name}, ${token.kind}, ${token.style}}`
      : `{${token.name}, ${token.kind}}`;
  }
  if (token.kind === "plural" || token.kind === "select" || token.kind === "selectordinal") {
    const parts = token.options
      .map((option, i) => `${option} {${(token.bodies[i] ?? []).map(ReSerialiseToken).join("")}}`)
      .join(" ");
    return `{${token.name}, ${token.kind}, ${parts}}`;
  }
  return "";
}

function ReSerialiseToken(token: IcuToken): string {
  if (token.kind === "text") return token.value;
  return ReSerialiseBlock(token);
}

/**
 * Recursively pseudo-fy a whole message tree (namespace → keys → strings).
 * Non-string leaves (should not exist) pass through untouched.
 */
export function pseudoMessages<T>(messages: T): T {
  if (typeof messages === "string") {
    return pseudoIcuMessage(messages) as unknown as T;
  }
  if (Array.isArray(messages)) {
    return messages.map((item) => pseudoMessages(item)) as unknown as T;
  }
  if (messages && typeof messages === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(messages as Record<string, unknown>)) {
      out[key] = pseudoMessages(value);
    }
    return out as T;
  }
  return messages;
}
