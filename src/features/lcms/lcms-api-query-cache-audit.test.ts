import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { questionBankQueryKeys } from "@/features/lcms/quiz/question-bank/api/question-bank-query";
import { quizEditorQueryKeys } from "@/features/lcms/quiz/quiz-editor/api/quiz-editor-query";
import { quizReportQueryKeys } from "@/features/lcms/quiz/quiz-reports/api/quiz-report-query";
import { quizRuntimeQueryKeys } from "@/features/lcms/quiz/quiz-runtime/api/quiz-runtime-query";
import { schoolManagementQueryKeys } from "@/features/lcms/school-management/api/school-management-api";
import { teachingCalendarQueryKeys } from "@/features/teaching-calendar/api/teaching-calendar-api";
import { queryKeys } from "@/lib/query-keys";
import { isPersistableQuery } from "@/lib/query-persistence";

describe("LCMS API/query/cache audit characterization", () => {
  it("keeps quiz workspaces and reports scoped by tenant plus entity/filter", () => {
    expect(questionBankQueryKeys.workspace("tenant-a", {
      page: 1,
      search: "  algebra  ",
      subjectId: "math",
    })).toEqual([
      "question-bank",
      "tenant-a",
      "workspace",
      {
        includeQuestions: true,
        levelId: "",
        page: 1,
        quizKind: "",
        search: "algebra",
        size: 50,
        status: "",
        subjectId: "math",
        topicId: "",
      },
    ]);
    expect(quizEditorQueryKeys.draft("quiz-a", "tenant-a"))
      .toEqual(["quiz-editor", "draft", "tenant-a", "quiz-a"]);
    expect(quizReportQueryKeys.assignmentReport("assignment-a", "tenant-a"))
      .toEqual(["quiz-reports", "tenant-a", "assignment-report", "assignment-a"]);
    expect(quizRuntimeQueryKeys.package("elearning", "quiz-a", "tenant-a"))
      .toEqual(["quiz-runtime", "package", "tenant-a", "elearning", "quiz-a"]);
  });

  it("uses portal and tenant scopes for calendar while retaining bounded domain roots", () => {
    expect(teachingCalendarQueryKeys.referenceCatalog("lcms", "tenant-a"))
      .toEqual(["teaching-calendar", "lcms", "tenant-a", "reference-catalog"]);
    expect(schoolManagementQueryKeys.directory("tenant-a", "admin-a", "erg"))
      .toEqual(["lcms", "school-management", "tenant-a", "admin-a", "directory", "erg"]);
    expect(queryKeys.adminOperations.userAccess.detailAccess("user-a", "tenant-a", "admin-a"))
      .toEqual(["admin-operations", "user-access", "tenant-a", "admin-a", "detail", "user-a", "access"]);
  });

  it("isolates permission-filtered LCMS caches when the active account changes", () => {
    expect(schoolManagementQueryKeys.operations("tenant-a", "admin-a", "school-a"))
      .not.toEqual(schoolManagementQueryKeys.operations("tenant-a", "admin-b", "school-a"));
    expect(queryKeys.adminOperations.userAccess.users("", "active", "tenant-a", "admin-a"))
      .not.toEqual(queryKeys.adminOperations.userAccess.users("", "active", "tenant-a", "admin-b"));
    expect(queryKeys.adminOperations.learningResourcesWorkspace(120, "tenant-a", "admin-a"))
      .not.toEqual(queryKeys.adminOperations.learningResourcesWorkspace(120, "tenant-a", "admin-b"));
    expect(queryKeys.adminOperations.educationUnits("", "", "tenant-a", "admin-a"))
      .not.toEqual(queryKeys.adminOperations.educationUnits("", "", "tenant-a", "admin-b"));
  });

  it("does not persist LCMS authoring, access, report or quiz package data by accident", () => {
    const rejectedKeys = [
      questionBankQueryKeys.workspace("tenant-a"),
      quizEditorQueryKeys.draft("quiz-a", "tenant-a"),
      quizReportQueryKeys.assignmentReport("assignment-a", "tenant-a"),
      quizRuntimeQueryKeys.package("elearning", "quiz-a", "tenant-a"),
      queryKeys.adminOperations.userAccess.detailAccess("user-a", "tenant-a", "admin-a"),
      schoolManagementQueryKeys.operations("tenant-a", "admin-a", "school-a"),
    ];

    rejectedKeys.forEach((queryKey) => {
      expect(isPersistableQuery({ queryKey })).toBe(false);
    });
  });

  it("contains no bare TanStack Query invalidation in LCMS query owners", () => {
    const owners = [
      "quiz/question-bank/api/question-bank-query.ts",
      "quiz/quiz-editor/api/quiz-editor-query.ts",
      "school-management/hooks/use-school-management.ts",
      "components/lcms-google-calendar-workspace.tsx",
    ];

    owners.forEach((relativePath) => {
      const source = fs.readFileSync(
        path.resolve(process.cwd(), "src/features/lcms", relativePath),
        "utf8",
      );
      expect(source).not.toMatch(/invalidateQueries\s*\(\s*\)/);
      expect(source).not.toMatch(/invalidateQueries\s*\(\s*\{\s*}\s*\)/);
    });
  });
});
