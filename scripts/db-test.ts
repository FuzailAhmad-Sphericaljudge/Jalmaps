import { execSync } from "node:child_process";

function parseSupabaseEnv(output: string): Record<string, string> {
  const values: Record<string, string> = {};

  for (const line of output.split(/\r?\n/)) {
    const match = line.match(/^([A-Z_]+)=(?:"([^"]*)"|'([^']*)'|(.*))$/);
    const name = match?.[1];
    if (match && name) {
      values[name] = match[2] ?? match[3] ?? match[4] ?? "";
    }
  }

  const required = ["API_URL", "ANON_KEY", "SERVICE_ROLE_KEY"];
  const missing = required.filter((name) => !values[name]);
  if (missing.length > 0) {
    throw new Error(`Supabase local status omitted required values: ${missing.join(", ")}`);
  }

  return values;
}

execSync('pnpm exec supabase test db --local "supabase/tests/database"', {
  stdio: "inherit",
});

const local = parseSupabaseEnv(
  execSync("pnpm exec supabase status --output env", { encoding: "utf8" }),
);
execSync("pnpm exec tsx scripts/db-repository-tests.ts", {
  stdio: "inherit",
  env: {
    ...process.env,
    NEXT_PUBLIC_SUPABASE_URL: local.API_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: local.ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: local.SERVICE_ROLE_KEY,
  },
});
