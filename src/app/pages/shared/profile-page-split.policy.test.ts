import fs from "node:fs";
import path from "node:path";

import { describe, expect, test } from "vitest";

const root = process.cwd();
const source = (relativePath: string) => fs.readFileSync(path.resolve(root, relativePath), "utf8");

describe("profile page ownership", () => {
  test("keeps the app page a thin wrapper over the feature", () => {
    const page = source("src/app/pages/shared/profile-page.tsx");
    expect(page.split(/\r?\n/).length).toBeLessThanOrEqual(20);
    expect(page).toContain('from "@/features/profile/components/profile-page"');
  });

  test("splits profile state, panels and presentation helpers", () => {
    const featurePage = source("src/features/profile/components/profile-page.tsx");
    expect(featurePage.split(/\r?\n/).length).toBeLessThanOrEqual(220);
    expect(featurePage).toContain('from "@/features/profile/hooks/use-profile-page-controller"');
    expect(source("src/features/profile/hooks/use-profile-page-controller.ts")).toContain("useProfilePageController");
    expect(source("src/features/profile/components/profile-panels.tsx")).toContain("ProfileFormPanel");
    expect(source("src/features/profile/components/profile-primitives.tsx")).toContain("ProfileTabButton");
  });
});
