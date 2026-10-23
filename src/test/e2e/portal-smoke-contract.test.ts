import fs from "node:fs";
import path from "node:path";

import { describe, expect, test } from "vitest";

const root = process.cwd();
const read = (relativePath: string) => {
  const absolutePath = path.resolve(root, relativePath);
  return fs.existsSync(absolutePath) ? fs.readFileSync(absolutePath, "utf8") : "";
};

describe("portal smoke E2E contract", () => {
  test("defines one Playwright project and command per portal", () => {
    const config = read("playwright.config.ts");
    const packageJson = JSON.parse(read("package.json")) as { scripts?: Record<string, string> };

    for (const portal of ["lms", "lcms", "crm", "elearning"]) {
      expect(config).toContain(`name: "${portal}"`);
      expect(packageJson.scripts?.[`e2e:${portal}`]).toContain(`--project=${portal}`);
    }
    expect(config).toContain("webServer:");
    expect(config).toContain("host-resolver-rules");
  });

  test("keeps Playwright specs out of the Vitest unit suite", () => {
    const viteConfig = read("vite.config.ts");

    expect(viteConfig).toContain('"src/test/e2e/**/*.spec.ts"');
  });

  test("keeps auth, bootstrap, interaction and API-failure smoke coverage per portal", () => {
    for (const portal of ["lms", "lcms", "crm", "elearning"]) {
      const spec = read(`src/test/e2e/${portal}.smoke.spec.ts`);
      expect(spec).toContain("assertGuestRedirect");
      expect(spec).toContain("seedAuthenticatedPortal");
      expect(spec).toContain("assertMainRoute");
      expect(spec).toContain("assertApiFailureBoundary");
    }
  });

  test("runs portal projects independently in CI and uploads their reports", () => {
    const workflow = read(".github/workflows/portal-smoke.yml");

    expect(workflow).toContain("matrix:");
    expect(workflow).toMatch(/portal:\s*\[lms, lcms, crm, elearning\]/);
    expect(workflow).toContain("bun run e2e:${{ matrix.portal }}");
    expect(workflow).toContain("playwright-report-${{ matrix.portal }}");
  });
});
