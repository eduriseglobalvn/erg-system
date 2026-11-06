import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { expect, test } from "vitest";

test("keeps learning-resource and question-bank fixtures behind the explicit dev gate", () => {
  const files = [
    "src/features/lms/learning-resources/api/learning-resource-library-query-api.ts",
    "src/features/question-bank/api/question-bank-api.ts",
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
  const authoringFixtures = readFileSync(resolve(process.cwd(), "src/test/fixtures/mock-learning-resource-authoring-data.ts"), "utf8");
  const authoringWorkspace = readFileSync(resolve(process.cwd(), "src/features/lcms/admin-operations/components/learning-resource-authoring-workspace.tsx"), "utf8");
  const authoringController = readFileSync(resolve(process.cwd(), "src/features/lcms/admin-operations/components/learning-resource-authoring-create-dialog-controller.ts"), "utf8");
  const teacherDashboard = readFileSync(resolve(process.cwd(), "src/features/lms/learning-resources/api/teacher-resource-dashboard-api.ts"), "utf8");

  expect(quizEditor).not.toContain("runtimeFixturesEnabled");
  // No synthetic draft, gated or not: the editor reads the server or the device copy only.
  expect(quizEditor).not.toMatch(/mockDraft|createMock\w*\(/);
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

test("keeps demo fixtures out of production code", () => {
  const viteConfig = readFileSync(resolve(process.cwd(), "vite.config.ts"), "utf8");
  const classroomDefaults = readFileSync(resolve(process.cwd(), "src/features/lms/classroom/api/classroom-defaults.ts"), "utf8");
  const authoringDefaults = readFileSync(resolve(process.cwd(), "src/features/lcms/admin-operations/api/learning-resource-authoring-defaults.ts"), "utf8");

  expect(viteConfig).not.toContain("runtime-stubs");
  expect(classroomDefaults).not.toContain("runtimeFixturesEnabled");
  expect(authoringDefaults).toContain("USE_LEARNING_RESOURCE_AUTHORING_MOCK = false");

  // Production code may reach src/test/fixtures only through a dynamic import behind the DEV fixture gate.
  const staticFixtureImport = /^\s*(?:import|export)\b[^\n]*\bfrom\s+["']@\/test\/fixtures/m;
  const offenders = listSources(resolve(process.cwd(), "src"))
    .filter((file) => !/[\\/]src[\\/]test[\\/]/.test(file) && !/\.test\.tsx?$/.test(file))
    .filter((file) => staticFixtureImport.test(readFileSync(file, "utf8")));
  expect(offenders).toEqual([]);
});

function listSources(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) return listSources(path);
    return /\.tsx?$/.test(entry.name) ? [path] : [];
  });
}
