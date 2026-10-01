import { describe, expect, it } from "vitest";
import type { PostgrestError } from "@supabase/supabase-js";

import { DatabaseError, requireDatabaseData } from "./errors";

const postgresError: PostgrestError = {
  code: "23505",
  details: "Key already exists.",
  hint: "Use the existing row.",
  message: "duplicate key value violates unique constraint",
  name: "PostgrestError",
  toJSON: () => ({
    name: "PostgrestError",
    code: "23505",
    details: "Key already exists.",
    hint: "Use the existing row.",
    message: "duplicate key value violates unique constraint",
  }),
};

describe("database error handling", () => {
  it("preserves actionable database error fields", () => {
    const error = new DatabaseError(postgresError, "create well");

    expect(error).toMatchObject({
      name: "DatabaseError",
      code: "23505",
      details: "Key already exists.",
      hint: "Use the existing row.",
    });
    expect(error.message).toContain("create well");
  });

  it("returns query data and explicitly rejects missing data", () => {
    expect(requireDatabaseData([{ id: "1" }], null, "list wells")).toEqual([{ id: "1" }]);
    expect(() => requireDatabaseData(null, null, "read well")).toThrow(/returned no data/);
  });
});
