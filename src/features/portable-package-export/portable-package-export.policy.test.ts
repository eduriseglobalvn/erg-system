import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const read = (file: string) => readFileSync(resolve(process.cwd(), file), "utf8");

describe("portable package authoring boundary", () => {
  it("is discoverable from Admin and permission-gated Teacher operations", () => {
    const admin = read("src/features/lcms/quiz/question-bank/components/question-bank-workspace-shell.tsx");
    const teacher = read("src/features/lms/components/exercise-bank-page.tsx");

    expect(admin).toContain("PortablePackageExportDialog");
    expect(teacher).toContain("PortablePackageCatalogDialog");
    expect(teacher).toContain('permission: "lms.quiz.read"');
  });

  it("does not expose the authoring/export feature from Student code", () => {
    const runtime = read("src/features/elearning/student-dashboard/components/student-dashboard-workspace-runtime.tsx");
    const mobile = read("src/features/elearning/student-dashboard/components/student-dashboard-mobile-shell.tsx");

    expect(runtime).not.toContain("portable-package-export");
    expect(mobile).not.toContain("portable-package-export");
  });
});
