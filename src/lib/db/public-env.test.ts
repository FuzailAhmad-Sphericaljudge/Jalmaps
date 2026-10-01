import { describe, expect, it } from "vitest";

import { parsePublicEnv } from "./public-env";

describe("parsePublicEnv", () => {
  it("validates only browser-safe Supabase configuration", () => {
    expect(
      parsePublicEnv({
        NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "local-anon-key",
      }),
    ).toEqual({
      NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "local-anon-key",
    });
  });

  it("rejects a missing anonymous key", () => {
    expect(() => parsePublicEnv({ NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321" })).toThrow(
      /NEXT_PUBLIC_SUPABASE_ANON_KEY/,
    );
  });
});
