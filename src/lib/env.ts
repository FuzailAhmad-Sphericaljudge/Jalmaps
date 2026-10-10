import { z } from "zod";

import { publicEnvSchema } from "@/lib/db/public-env";
import type { PublicEnv } from "@/lib/db/public-env";

/**
 * Typed, fail-fast environment loading for JalMaps.
 *
 * Access environment variables exclusively through `env` / `getEnv()`.
 * Never read `process.env` directly elsewhere in the codebase.
 *
 * Secrets (the service role key) must only be used on the server. The
 * `NEXT_PUBLIC_` variables are safe to expose to the browser.
 */

const serverSchema = z.object({
  /** Supabase service role key. Server-only: bypasses row level security. */
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "SUPABASE_SERVICE_ROLE_KEY is required"),
  /** Secret pepper added before hashing node API keys. Cannot be changed without invalidating all keys. */
  INGEST_PEPPER: z.string().min(16, "INGEST_PEPPER must be at least 16 chars for security"),
});

export type ServerEnv = z.infer<typeof serverSchema>;
export type { PublicEnv } from "@/lib/db/public-env";

export type Env = ServerEnv & PublicEnv;

/**
 * Parse and validate environment variables. Throws a single, readable error
 * listing every missing or invalid variable so setup failures are obvious.
 */
export function parseEnv(source: Record<string, string | undefined> = process.env): Env {
  const server = serverSchema.safeParse(source);
  const pub = publicEnvSchema.safeParse(source);

  if (!server.success || !pub.success) {
    const problems = [
      ...(server.success ? [] : server.error.issues),
      ...(pub.success ? [] : pub.error.issues),
    ];
    const header =
      "Invalid environment variables. Copy .env.example to .env.local and fill in real values.\n";
    const detail = problems
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(header + detail);
  }

  return { ...server.data, ...pub.data };
}

let cached: Env | undefined;

/** Validated env object. Parses and caches on first call, then throws-free afterwards. */
export function getEnv(): Env {
  cached ??= parseEnv();
  return cached;
}

/** Test helper: reset the cached env so tests can inject custom variables. */
export function resetEnvCache(): void {
  cached = undefined;
}
