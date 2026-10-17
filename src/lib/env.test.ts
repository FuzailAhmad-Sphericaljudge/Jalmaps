import { describe, expect, it } from "vitest";

import { parseEnv, resetEnvCache } from "./env";

const validEnv = {
  NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
  SUPABASE_SERVICE_ROLE_KEY: "service-key",
  INGEST_PEPPER: "test-pepper-12345",
};

describe("parseEnv", () => {
  it("accepts a complete, valid environment", () => {
    const env = parseEnv(validEnv);
    expect(env.NEXT_PUBLIC_SUPABASE_URL).toBe("https://example.supabase.co");
    expect(env.SUPABASE_SERVICE_ROLE_KEY).toBe("service-key");
  });

  it("throws one readable error listing every missing variable", () => {
    expect(() => parseEnv({})).toThrow(/NEXT_PUBLIC_SUPABASE_URL/);
    expect(() => parseEnv({})).toThrow(/NEXT_PUBLIC_SUPABASE_ANON_KEY/);
    expect(() => parseEnv({})).toThrow(/SUPABASE_SERVICE_ROLE_KEY/);
  });

  it("rejects a malformed Supabase URL", () => {
    expect(() =>
      parseEnv({
        ...validEnv,
        NEXT_PUBLIC_SUPABASE_URL: "not-a-url",
      }),
    ).toThrow(/must be a valid URL/);
  });
});

describe("getEnv caching", () => {
  it("caches the parsed result until reset", async () => {
    const { getEnv } = await import("./env");
    resetEnvCache();
    process.env.NEXT_PUBLIC_SUPABASE_URL ??= "https://cached.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= "anon";
    process.env.SUPABASE_SERVICE_ROLE_KEY ??= "service";
    process.env.INGEST_PEPPER ??= "test-pepper-12345";

    const first = getEnv();
    const second = getEnv();
    expect(second).toBe(first);
    resetEnvCache();
  });
});
