import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { expect, test } from "vitest";

test("keeps learning-resource and question-bank fixtures behind the explicit dev gate", () => {
  const files = [
    "src/features/lms/learning-resources/api/learning-resource-library-query-api.ts",
    "src/features/lcms/quiz/question-bank/api/question-bank-api.ts",
    "src/features/lcms/quiz/question-bank/api/question-bank-query.ts",
    "src/features/lms/infrastructure/lms-dashboard-api.ts",
    "src/features/elearning/student-dashboard/api/student-dashboard-api.ts",
  ];
  for (const fileName of files) {
    const source = readFileSync(resolve(process.cwd(), fileName), "utf8");
    expect(source, `${fileName} still grants fixtures from a missing API base`).not.toMatch(/!hasApiBase\(\)[^\n]*(?:mock|MOCK|FIXTURE)/i);
    expect(source, `${fileName} does not use the shared fixture gate`).toContain("runtimeFixturesEnabled");
  }
});

test("keeps quiz and authoring synthetic payloads behind the explicit dev gate", () => {
  const quizEditor = readFileSync(resolve(process.cwd(), "src/features/lcms/quiz/quiz-editor/api/quiz-editor-api.ts"), "utf8");
  const quizPackage = readFileSync(resolve(process.cwd(), "src/features/lcms/quiz/quiz-runtime/api/quiz-runtime-package-api.ts"), "utf8");
  const attemptCommands = readFileSync(resolve(process.cwd(), "src/features/lcms/quiz/quiz-runtime/api/quiz-runtime-attempt-command-api.ts"), "utf8");
  const authoringFixtures = readFileSync(resolve(process.cwd(), "src/features/lcms/admin-operations/api/mock-learning-resource-authoring-data.ts"), "utf8");
  const authoringWorkspace = readFileSync(resolve(process.cwd(), "src/features/lcms/admin-operations/components/learning-resource-authoring-workspace.tsx"), "utf8");
  const authoringController = readFileSync(resolve(process.cwd(), "src/features/lcms/admin-operations/components/learning-resource-authoring-create-dialog-controller.ts"), "utf8");
  const teacherDashboard = readFileSync(resolve(process.cwd(), "src/features/lms/learning-resources/api/teacher-resource-dashboard-api.ts"), "utf8");

  expect(quizEditor).toContain("runtimeFixturesEnabled()");
  expect(quizEditor).not.toMatch(/if \(!hasApiBase\(\)\)\s*{\s*return mockDraft/s);
  expect(quizPackage).toContain("runtimeFixturesEnabled()");
  expect(quizPackage).not.toMatch(/if \(!hasApiBase\(\)\)\s*{\s*return createQuizPackage/s);
  expect(attemptCommands).toContain("runtimeFixturesEnabled()");
  expect(attemptCommands).not.toMatch(/if \(!hasApiBase\(\)\)\s*{\s*return (?:\{ attemptId|gradeFinalAttemptLocally)/s);
  expect(authoringFixtures).toContain("runtimeFixturesEnabled()");
  expect(authoringWorkspace).toContain("USE_LEARNING_RESOURCE_AUTHORING_MOCK ? mockExplorerLocalContent : []");
  expect(authoringWorkspace).not.toMatch(/hasApiBase\(\)[^\n]*\?[^\n]*:[^\n]*mock/i);
  expect(authoringController).not.toContain("hasApiBase()");
  expect(authoringController).toContain("USE_LEARNING_RESOURCE_AUTHORING_MOCK");
  expect(teacherDashboard).toContain("runtimeFixturesEnabled()");
  expect(teacherDashboard).not.toMatch(/if \(!hasApiBase\(\)\)/);
});

test("replaces synchronous fixture modules with empty production adapters", () => {
  const viteConfig = readFileSync(resolve(process.cwd(), "vite.config.ts"), "utf8");
  const classroomStub = readFileSync(resolve(process.cwd(), "src/features/runtime-stubs/classroom-data.ts"), "utf8");
  const authoringStub = readFileSync(resolve(process.cwd(), "src/features/runtime-stubs/learning-resource-authoring-data.ts"), "utf8");
  const monitoringStub = readFileSync(resolve(process.cwd(), "src/features/runtime-stubs/training-monitoring-data.ts"), "utf8");

  expect(viteConfig).toContain('mode === "production"');
  expect(viteConfig).toContain("runtime-stubs/classroom-data.ts");
  expect(viteConfig).toContain("runtime-stubs/learning-resource-authoring-data.ts");
  expect(viteConfig).toContain("runtime-stubs/training-monitoring-data.ts");
  expect(classroomStub).not.toContain("runtimeFixturesEnabled");
  expect(authoringStub).toContain("USE_LEARNING_RESOURCE_AUTHORING_MOCK = false");
  expect(monitoringStub).toContain("assignments: []");
});
