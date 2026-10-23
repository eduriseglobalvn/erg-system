import { existsSync, readFileSync, readdirSync } from "node:fs";
import { extname, join, resolve } from "node:path";

import { describe, expect, it } from "vitest";

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return [".ts", ".tsx"].includes(extname(entry.name)) ? [path] : [];
  });
}

describe("MUI icon path imports", () => {
  it("only imports icon modules that exist in the installed package", () => {
    const root = process.cwd();
    const invalidImports: string[] = [];

    for (const file of sourceFiles(resolve(root, "src"))) {
      const source = readFileSync(file, "utf8");
      for (const match of source.matchAll(/@mui\/icons-material\/([A-Za-z0-9]+)/g)) {
        const icon = match[1];
        if (!existsSync(resolve(root, "node_modules/@mui/icons-material", `${icon}.js`))) {
          invalidImports.push(`${file.replace(`${root}\\`, "")}: ${icon}`);
        }
      }
    }

    expect(invalidImports).toEqual([]);
  });

  it("does not route icon imports through the compatibility shim", () => {
    const root = process.cwd();
    const shim = resolve(root, "src/components/mui-icon-shim.tsx");
    const consumers = sourceFiles(resolve(root, "src"))
      .filter((file) => file !== shim)
      .filter((file) => /from\s+["']@\/components\/mui-icon-shim["']/.test(readFileSync(file, "utf8")))
      .map((file) => file.replace(`${root}\\`, ""));

    expect(existsSync(shim)).toBe(false);
    expect(consumers).toEqual([]);
  });

  it("does not import the MUI icon barrel", () => {
    const root = process.cwd();
    const barrelConsumers = sourceFiles(resolve(root, "src"))
      .filter((file) => /from\s+["']@mui\/icons-material["']/.test(readFileSync(file, "utf8")))
      .map((file) => file.replace(`${root}\\`, ""));

    expect(barrelConsumers).toEqual([]);
  });
});
