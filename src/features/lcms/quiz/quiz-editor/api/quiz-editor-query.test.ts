import { describe, expect, test } from "vitest";

import {
  QUIZ_EDITOR_DRAFT_STALE_TIME_MS,
  QUIZ_EDITOR_REFERENCE_GC_TIME_MS,
  QUIZ_EDITOR_WORKSPACE_STALE_TIME_MS,
  quizEditorMutationKeys,
  quizEditorDraftQueryOptions,
  quizEditorVersionsQueryOptions,
  quizEditorWorkspaceQueryOptions,
} from "@/features/lcms/quiz/quiz-editor/api/quiz-editor-query";

describe("quizEditor query options", () => {
  test("scopes workspace, draft, and version caches by tenant", () => {
    const workspaceOptions = quizEditorWorkspaceQueryOptions({ tenantId: "tenant-a", search: "Excel" });
    const draftOptions = quizEditorDraftQueryOptions("quiz-a", "tenant-a");
    const versionsOptions = quizEditorVersionsQueryOptions("quiz-a", "tenant-a");

    expect(workspaceOptions.queryKey).toEqual([
      "quiz-editor",
      "workspace",
      "tenant-a",
      {
        categoryId: "",
        kind: "",
        levelId: "",
        page: 0,
        search: "Excel",
        size: 20,
        status: "",
        subjectId: "",
      },
    ]);
    expect(workspaceOptions.staleTime).toBe(QUIZ_EDITOR_WORKSPACE_STALE_TIME_MS);
    expect(workspaceOptions.gcTime).toBe(QUIZ_EDITOR_REFERENCE_GC_TIME_MS);
    expect(draftOptions.queryKey).toEqual(["quiz-editor", "draft", "tenant-a", "quiz-a"]);
    expect(draftOptions.staleTime).toBe(QUIZ_EDITOR_DRAFT_STALE_TIME_MS);
    expect(versionsOptions.queryKey).toEqual(["quiz-editor", "versions", "tenant-a", "quiz-a"]);
    expect(versionsOptions.staleTime).toBe(QUIZ_EDITOR_WORKSPACE_STALE_TIME_MS);
  });

  test("defines stable mutation keys for editor authoring commands", () => {
    expect(quizEditorMutationKeys.create).toEqual(["quiz-editor", "mutation", "create"]);
    expect(quizEditorMutationKeys.saveDraft).toEqual(["quiz-editor", "mutation", "save-draft"]);
    expect(quizEditorMutationKeys.upsertSlide).toEqual(["quiz-editor", "mutation", "upsert-slide"]);
    expect(quizEditorMutationKeys.reorderSlides).toEqual(["quiz-editor", "mutation", "reorder-slides"]);
    expect(quizEditorMutationKeys.validate).toEqual(["quiz-editor", "mutation", "validate"]);
    expect(quizEditorMutationKeys.publish).toEqual(["quiz-editor", "mutation", "publish"]);
    expect(quizEditorMutationKeys.fork).toEqual(["quiz-editor", "mutation", "fork"]);
    expect(quizEditorMutationKeys.mediaPresign).toEqual(["quiz-editor", "mutation", "media-presign"]);
    expect(quizEditorMutationKeys.mediaCommit).toEqual(["quiz-editor", "mutation", "media-commit"]);
    expect(quizEditorMutationKeys.exportBundle).toEqual(["quiz-editor", "mutation", "export-bundle"]);
  });
});
