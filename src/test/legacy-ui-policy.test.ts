import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const fixtures: string[] = [];

function createFixture(source: string) {
  const directory = mkdtempSync(join(tmpdir(), "erg-legacy-ui-"));
  fixtures.push(directory);
  writeFileSync(join(directory, "surface.tsx"), source, "utf8");
  return directory;
}

function runPolicy(scope: string) {
  return execFileSync(
    process.execPath,
    [resolve("scripts/check-legacy-ui.mjs"), scope],
    { cwd: process.cwd(), encoding: "utf8", stdio: "pipe" },
  );
}

afterEach(() => {
  for (const fixture of fixtures.splice(0)) {
    rmSync(fixture, { force: true, recursive: true });
  }
});

describe("legacy UI policy", () => {
  it("accepts path-imported MUI with sx styling", () => {
    const fixture = createFixture(`
      import Box from "@mui/material/Box";
      export function Surface() {
        return <Box sx={{ display: "flex", gap: 2 }} />;
      }
    `);

    expect(runPolicy(fixture)).toContain("Legacy UI policy passed");
  });

  it("rejects Tailwind utilities and legacy UI imports", () => {
    const fixture = createFixture(`
      import { Menu } from "lucide-react";
      export function Surface() {
        return <div className="flex items-center gap-2">Legacy</div>;
      }
    `);

    expect(() => runPolicy(fixture)).toThrow(/Command failed/);
  });

  it("ignores test fixture source that documents rejected imports", () => {
    const fixture = createFixture(`
      import Box from "@mui/material/Box";
      export const Surface = () => <Box sx={{ p: 2 }} />;
    `);
    const testDirectory = join(fixture, "test");
    mkdirSync(testDirectory);
    writeFileSync(
      join(testDirectory, "policy.test.ts"),
      `const rejectedExample = 'import { Menu } from "lucide-react"';`,
      "utf8",
    );

    expect(runPolicy(fixture)).toContain("Legacy UI policy passed");
  });

  it("keeps shared dashboard layouts free of legacy UI", () => {
    expect(runPolicy(resolve("src/layouts"))).toContain("Legacy UI policy passed");
  });
});
