import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const migratedSources = [
  "class-students-workspace.tsx",
  "class-list-workspace.tsx",
  "class-assignment-dialog.tsx",
  "class-management-page.tsx",
  "class-reports-workspace.tsx",
  "class-students-table.tsx",
  "overview-workspace.tsx",
  "student-profile-detail-drawer.tsx",
];

describe("LMS classroom ERG MUI migration policy", () => {
  it.each(migratedSources)("keeps %s free of legacy UI and Tailwind", (fileName) => {
    const source = readFileSync(resolve(process.cwd(), "src/features/lms/classroom/components", fileName), "utf8");

    expect(source).not.toContain("lucide-react");
    expect(source).not.toContain("@/components/ui/");
    expect(source).not.toMatch(/className\s*=/);
  });
});
