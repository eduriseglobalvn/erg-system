import { describe, expect, test, vi } from "vitest";

const api = vi.hoisted(() => ({ loadQuizEditorWorkspace: vi.fn() }));
vi.mock("@/features/lcms/quiz/quiz-editor/api/quiz-editor-api", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  loadQuizEditorWorkspace: api.loadQuizEditorWorkspace,
}));

import {
  QUIZ_EDITOR_DRAFT_STALE_TIME_MS,
  QUIZ_EDITOR_REFERENCE_GC_TIME_MS,
  QUIZ_EDITOR_WORKSPACE_STALE_TIME_MS,
  quizEditorMutationKeys,
  quizEditorDraftQueryOptions,
  quizEditorLevelQuizzesQueryOptions,
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
        portal: "lcms",
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

  test("reads every page of a Level's quizzes, so no topic shows \"Chưa có bài\" past the first 50", async () => {
    const page = (ids: string[], hasNext: boolean) => ({ quizzes: { items: ids.map((id) => ({ id })), hasNext } });
    api.loadQuizEditorWorkspace.mockResolvedValueOnce(page(["a", "b"], true)).mockResolvedValueOnce(page(["c"], false));
    const options = quizEditorLevelQuizzesQueryOptions({ subjectId: "s", levelId: "l" });
    const items = await options.queryFn({ signal: new AbortController().signal });
    expect(items.map((item) => item.id)).toEqual(["a", "b", "c"]);
    expect(api.loadQuizEditorWorkspace.mock.calls.map(([input]) => input.page)).toEqual([0, 1]);
    // Under the workspace root, so every save that refreshes the workspace refreshes it too.
    expect(options.queryKey.slice(0, 2)).toEqual(["quiz-editor", "workspace"]);
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
