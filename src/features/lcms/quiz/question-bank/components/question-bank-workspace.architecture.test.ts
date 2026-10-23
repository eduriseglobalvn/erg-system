import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const workspacePath = path.resolve(process.cwd(), "src/features/lcms/quiz/question-bank/components/question-bank-workspace.tsx");
const compositionPath = path.resolve(process.cwd(), "src/features/lcms/quiz/question-bank/components/question-bank-workspace-shell.tsx");
const controllerPath = path.resolve(process.cwd(), "src/features/lcms/quiz/question-bank/components/use-question-bank-workspace.ts");

describe("QuestionBankWorkspace architecture", () => {
  it("giữ public facade dưới 300 dòng và tách các presentation owner theo cohesion", () => {
    const source = fs.readFileSync(workspacePath, "utf8");
    expect(source.split(/\r?\n/).length).toBeLessThanOrEqual(300);

    const compositionSource = fs.readFileSync(compositionPath, "utf8");
    for (const owner of [
      "./question-bank-compact-header",
      "./question-bank-structure-panel",
      "./question-library",
      "./question-form-dialog",
      "./quiz-builder-panel",
      "./quiz-bank-panel",
      "./question-bank-copy",
    ]) {
      expect(compositionSource).toContain(owner);
    }
    expect(compositionSource).toContain("useQuestionBankWorkspaceController");
    expect(fs.existsSync(controllerPath)).toBe(true);
  });
});
