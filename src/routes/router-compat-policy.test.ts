import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

const sourceRoot = join(process.cwd(), "src");

describe("TanStack Router compatibility policy", () => {
  test("removes the legacy router compatibility module", () => {
    expect(existsSync(join(sourceRoot, "routes", "router-compat.tsx"))).toBe(false);
  });

  test("prevents production and test imports from reintroducing router-compat", () => {
    const offenders = collectSourceFiles(sourceRoot)
      .filter((path) => readFileSync(path, "utf8").includes("router-compat"))
      .map((path) => path.slice(sourceRoot.length + 1).replaceAll("\\", "/"))
      .filter((path) => path !== "routes/router-compat-policy.test.ts");

    expect(offenders).toEqual([]);
  });
});

function collectSourceFiles(directory: string): string[] {
  const entries = readdirSync(directory, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return collectSourceFiles(path);
    return /\.(?:ts|tsx)$/.test(entry.name) ? [path] : [];
  });
}
