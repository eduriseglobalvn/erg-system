import fs from "node:fs";
import path from "node:path";

import { describe, expect, test } from "vitest";

const auditedQueryOwners = [
  "src/features/lcms/quiz/question-bank/api/question-bank-query.ts",
  "src/features/lcms/quiz/quiz-editor/api/quiz-editor-query.ts",
  "src/features/lcms/quiz/quiz-reports/api/quiz-report-query.ts",
  "src/features/lcms/school-management/hooks/use-school-management.ts",
  "src/features/lcms/admin-operations/components/user-access-control-workspace.tsx",
  "src/features/lcms/admin-operations/components/learning-resource-authoring-workspace.tsx",
  "src/features/lcms/admin-operations/components/admin-operations-workspace.tsx",
  "src/features/lcms/components/lcms-google-calendar-workspace.tsx",
  "src/features/teaching-calendar/components/teaching-schedule-batch-panel.tsx",
];

describe("LCMS query cancellation policy", () => {
  test.each(auditedQueryOwners)("does not drop QueryFunctionContext.signal in %s", (relativePath) => {
    const source = fs.readFileSync(path.resolve(process.cwd(), relativePath), "utf8");

    expect(source).not.toMatch(/queryFn\s*:\s*\(\)\s*=>/);
  });
});
