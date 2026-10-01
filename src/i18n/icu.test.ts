import { describe, expect, it } from "vitest";

import { extractIcuArguments, extractIcuOptions, parseIcu } from "./icu";

describe("parseIcu", () => {
  it("returns a single text token for plain messages", () => {
    expect(parseIcu("Hello world")).toEqual([{ kind: "text", value: "Hello world" }]);
  });

  it("splits text and simple arguments", () => {
    expect(parseIcu("Current language: {language}")).toEqual([
      { kind: "text", value: "Current language: " },
      { kind: "argument", name: "language" },
    ]);
  });

  it("parses typed number/date blocks", () => {
    expect(parseIcu("Saved on {day, date, long}")).toEqual([
      { kind: "text", value: "Saved on " },
      { kind: "date", name: "day", style: "long" },
    ]);
    expect(parseIcu("{n, number}")).toEqual([{ kind: "number", name: "n", style: undefined }]);
  });

  it("parses plural options including exact matches", () => {
    const tokens = parseIcu("{count, plural, =0 {No wells} one {1 well} other {# wells}}");
    expect(tokens[0]).toEqual({
      kind: "plural",
      name: "count",
      options: ["=0", "one", "other"],
    });
  });

  it("parses leading text before blocks", () => {
    const tokens = parseIcu("saved {n, number} rows");
    expect(tokens).toHaveLength(3);
    expect(tokens[0]).toEqual({ kind: "text", value: "saved " });
    expect(tokens[1]).toEqual({ kind: "number", name: "n", style: undefined });
    expect(tokens[2]).toEqual({ kind: "text", value: " rows" });
  });

  it("surfaces only top-level blocks (nested ones stay in option bodies)", () => {
    const tokens = parseIcu("{count, plural, other {saved {n, number} rows}}");
    expect(tokens).toHaveLength(1);
    expect(tokens[0]).toMatchObject({ kind: "plural", name: "count" });
  });

  it("parses select options", () => {
    const tokens = parseIcu("{gender, select, male {he} female {she} other {they}}");
    expect(tokens[0]).toEqual({
      kind: "select",
      name: "gender",
      options: ["male", "female", "other"],
    });
  });

  it("treats quoted braces as literal text", () => {
    // The quote-escaping skip only needs to guarantee that '{' inside quotes
    // never starts a block; the raw quoted span stays part of the text value.
    const tokens = parseIcu("'{' literal");
    expect(tokens).toHaveLength(1);
    expect(tokens[0].kind).toBe("text");
  });

  it("throws on unbalanced braces", () => {
    expect(() => parseIcu("oops {count")).toThrow();
  });

  it("throws on unsupported types", () => {
    expect(() => parseIcu("{x, fake, a {b}}")).toThrow(/Unsupported ICU type/);
  });
});

describe("extractIcuArguments", () => {
  it("lists argument names in order", () => {
    expect(extractIcuArguments("{a} and {b, number} done")).toEqual(["a", "b"]);
    expect(extractIcuArguments("{count, plural, other {#}}")).toEqual(["count"]);
  });

  it("returns an empty list for plain text", () => {
    expect(extractIcuArguments("no variables here")).toEqual([]);
  });
});

describe("extractIcuOptions", () => {
  it("collects plural options by name", () => {
    expect(extractIcuOptions("{count, plural, =0 {none} one {1} other {many}}")).toEqual({
      count: ["=0", "one", "other"],
    });
  });

  it("returns an empty object without plurals or selects", () => {
    expect(extractIcuOptions("plain {x}")).toEqual({});
  });
});
