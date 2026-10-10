import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function sourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    return statSync(path).isDirectory()
      ? sourceFiles(path)
      : /\.(ts|tsx)$/.test(name)
        ? [path]
        : [];
  });
}

describe("service-role client boundary", () => {
  it("marks the service client server-only", () => {
    const source = readFileSync(join(process.cwd(), "src/server/supabase/service-role.ts"), "utf8");
    expect(source).toMatch(/import\s+["']server-only["']/);
  });

  it("is never imported by a client component", () => {
    const clientFiles = sourceFiles(join(process.cwd(), "src")).filter((path) =>
      /^\s*["']use client["'];?/m.test(readFileSync(path, "utf8")),
    );

    const unsafeImports = clientFiles.filter((path) =>
      /from\s+["'][^"']*service-role["']|import\s*\(\s*["'][^"']*service-role["']/.test(
        readFileSync(path, "utf8"),
      ),
    );

    expect(unsafeImports).toEqual([]);
  });
});
