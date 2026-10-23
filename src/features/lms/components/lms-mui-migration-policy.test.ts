import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const migratedSources = [
  "assign-homework-footer.tsx",
  "assign-homework-student-utils.tsx",
  "student-attendance-context-menu.tsx",
  "assign-date-time-picker.tsx",
];

describe("LMS ERG MUI migration policy", () => {
  it.each(migratedSources)("keeps %s free of legacy UI and Tailwind", (fileName) => {
    const source = readFileSync(resolve(process.cwd(), "src/features/lms/components", fileName), "utf8");

    expect(source).not.toContain("lucide-react");
    expect(source).not.toContain("@/components/ui/");
    expect(source).not.toMatch(/className\s*=/);
  });
});
