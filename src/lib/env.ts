import { z } from "zod";

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
});

const publicSchema = z.object({
  /** Supabase project URL, e.g. https://xyzcompany.supabase.co */
  NEXT_PUBLIC_SUPABASE_URL: z.url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL"),
  /** Supabase anonymous key. Safe for the browser; protected by RLS. */
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required"),
});

export type ServerEnv = z.infer<typeof serverSchema>;
export type PublicEnv = z.infer<typeof publicSchema>;

export type Env = ServerEnv & PublicEnv;

function formatIssues(error: z.ZodError): string {
  return error.issues.map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`).join("\n");
}

/**
 * Parse and validate environment variables. Throws a single, readable error
 * listing every missing or invalid variable so setup failures are obvious.
 */
export function parseEnv(
  source: Record<string, string | undefined> = process.env,
): Env {
  const server = serverSchema.safeParse(source);
  const pub = publicSchema.safeParse(source);

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
