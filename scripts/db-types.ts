import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { format, resolveConfig } from "prettier";

const outputPath = resolve(process.cwd(), "src/lib/db/types.ts");
const mode = process.argv[2];

async function main(): Promise<void> {
  if (mode !== "--write" && mode !== "--check") {
    throw new Error("Use --write to regenerate database types or --check to verify them.");
  }

  const generatedRaw = execSync("pnpm exec supabase gen types typescript --local --schema public", {
    encoding: "utf8",
  });
  const config = await resolveConfig(outputPath);
  const generated = await format(generatedRaw, { ...config, filepath: outputPath });

  if (mode === "--write") {
    writeFileSync(outputPath, generated);
    console.log(`Updated ${outputPath}`);
  } else {
    const current = readFileSync(outputPath, "utf8");
    if (current !== generated) {
      console.error("Database types are stale. Run `pnpm db:types` and commit the result.");
      process.exitCode = 1;
    } else {
      console.log("Database types match the local Supabase schema.");
    }
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
