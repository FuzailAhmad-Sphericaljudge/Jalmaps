/**
 * Minimal ICU message parser.
 *
 * Deliberately not a full ICU implementation — it extracts exactly what
 * JalMaps needs (argument names, plural/select/ordinal branches and their
 * option names) so two consumers can compare messages structurally:
 *
 * - `scripts/check-i18n.ts`: a locale's ICU variables/plurals must match
 *   English, or translations drift into runtime errors.
 * - `src/i18n/pseudo.ts`: pseudo-localisation must leave ICU machinery
 *   intact (only the literal text expands).
 *
 * Supports `{name}`, `{name, number}`, `{name, date}`, `{name, plural, ...}`,
 * `{name, select, ...}`, `{name, selectordinal, ...}` with nested blocks and
 * `'quoted'` escapes. Rich-text tags (`<tag>…</tag>`) are treated as literal
 * text and survive pseudo-localisation untouched.
 */

export type IcuBlock =
  | { kind: "argument"; name: string }
  | { kind: "number" | "date" | "time"; name: string; style?: string }
  | { kind: "plural" | "select" | "selectordinal"; name: string; options: string[] };

export type IcuToken = { kind: "text"; value: string } | IcuBlock;

interface ParseState {
  index: number;
}

function skipWhitespace(message: string, state: ParseState) {
  while (state.index < message.length && /\s/.test(message[state.index] ?? "")) {
    state.index += 1;
  }
}

function readIdentifier(message: string, state: ParseState): string {
  const start = state.index;
  while (state.index < message.length && /[A-Za-z0-9_#]/.test(message[state.index] ?? "")) {
    state.index += 1;
  }
  return message.slice(start, state.index);
}

/** Parse the inside of a `{...}` block; the opening brace is already consumed. */
function parseBlock(message: string, state: ParseState): IcuBlock {
  skipWhitespace(message, state);
  const name = readIdentifier(message, state);
  skipWhitespace(message, state);

  const next = message[state.index];
  if (next === "," || next === "}") {
    if (next === ",") {
      state.index += 1; // consume ","
    } else {
      state.index += 1; // consume "}"
    }
    return { kind: "argument", name };
  }

  throw new Error(`Malformed ICU message near index ${state.index}: ${message}`);
}

/** Parse a full simple argument `{name}` or typed `{name, type, ...}`. */
function parseTypedBlock(message: string, state: ParseState): IcuBlock {
  skipWhitespace(message, state);
  const name = readIdentifier(message, state);
  skipWhitespace(message, state);

  const next = message[state.index];
  if (next !== ",") {
    if (next === "}") {
      state.index += 1;
      return { kind: "argument", name };
    }
    throw new Error(`Malformed ICU message near index ${state.index}: ${message}`);
  }

  state.index += 1; // consume ","
  skipWhitespace(message, state);
  const type = readIdentifier(message, state);
  skipWhitespace(message, state);

  if (type === "number" || type === "date" || type === "time") {
    let style: string | undefined;
    if (message[state.index] === ",") {
      state.index += 1;
      skipWhitespace(message, state);
      style = readIdentifier(message, state);
      skipWhitespace(message, state);
    }
    if (message[state.index] !== "}") {
      throw new Error(`Malformed ICU ${type} block: ${message}`);
    }
    state.index += 1;
    return { kind: type, name, style };
  }

  if (type === "plural" || type === "select" || type === "selectordinal") {
    if (message[state.index] !== ",") {
      throw new Error(`Malformed ICU ${type} block: ${message}`);
    }
    state.index += 1;

    const options: string[] = [];
    for (;;) {
      skipWhitespace(message, state);
      const option = readOptionName(message, state);
      skipWhitespace(message, state);
      if (message[state.index] !== "{") {
        throw new Error(`Malformed ICU ${type} option "${option}": ${message}`);
      }
      state.index += 1;
      const closed = readNestedBlock(message, state);
      options.push(option);
      void closed;
      skipWhitespace(message, state);

      if (message[state.index] === "}") {
        state.index += 1;
        return { kind: type, name, options };
      }
    }
  }

  throw new Error(`Unsupported ICU type "${type}" in: ${message}`);
}

/** Option names: `=0`, `=1`, `one`, `few`, `other`, arbitrary `select` keys. */
function readOptionName(message: string, state: ParseState): string {
  if (message[state.index] === "=") {
    state.index += 1;
    const start = state.index;
    while (state.index < message.length && /[0-9]/.test(message[state.index] ?? "")) {
      state.index += 1;
    }
    return `=${message.slice(start, state.index)}`;
  }
  return readIdentifier(message, state);
}

/** Consume a nested `{...}` block (already opened), tracking brace depth. */
function readNestedBlock(message: string, state: ParseState): string {
  let depth = 1;
  const start = state.index;
  while (state.index < message.length && depth > 0) {
    const char = message[state.index];
    if (char === "'") {
      // Skip quoted literal ('{{' or '{u2019}' style escapes).
      state.index += 1;
      while (state.index < message.length) {
        if (message[state.index] === "'") {
          if (message[state.index + 1] === "'") {
            state.index += 2; // '' = literal quote
            continue;
          }
          break;
        }
        state.index += 1;
      }
    } else if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
    }
    state.index += 1;
  }
  if (depth !== 0) {
    throw new Error(`Unbalanced braces in ICU message: ${message}`);
  }
  return message.slice(start, state.index - 1);
}

/**
 * Tokenise an ICU message into text and argument blocks. Throws on
 * structurally invalid messages (unbalanced braces, unknown types).
 */
export function parseIcu(message: string): IcuToken[] {
  const tokens: IcuToken[] = [];
  let textStart = 0;
  let index = 0;

  while (index < message.length) {
    const char = message[index];

    if (char === "'") {
      // Quoted literal: 'text' or '' (escaped quote). Both stay text.
      if (message[index + 1] === "'") {
        index += 2;
        continue;
      }
      let end = index + 1;
      while (end < message.length && message[end] !== "'") {
        end += 1;
      }
      index = Math.min(end + 1, message.length);
      continue;
    }

    if (char === "{") {
      if (textStart < index) {
        tokens.push({ kind: "text", value: message.slice(textStart, index) });
      }
      const state: ParseState = { index: index + 1 };
      const block = parseTypedBlock(message, state);
      tokens.push(block);
      index = state.index;
      textStart = index;
      continue;
    }

    index += 1;
  }

  if (textStart < message.length) {
    tokens.push({ kind: "text", value: message.slice(textStart) });
  }
  return tokens;
}

/** Extract all argument names in the order they appear. */
export function extractIcuArguments(message: string): string[] {
  return parseIcu(message)
    .filter((token): token is IcuBlock => token.kind !== "text")
    .map((block) => block.name);
}

/** Extract plural/select option names for a top-level block name, if any. */
export function extractIcuOptions(message: string): Record<string, string[]> {
  const options: Record<string, string[]> = {};
  for (const token of parseIcu(message)) {
    if (token.kind === "plural" || token.kind === "select" || token.kind === "selectordinal") {
      options[token.name] = token.options;
    }
  }
  return options;
}
