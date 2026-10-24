import { beforeEach, expect, test } from "vitest";

import { clearLocalQuizDraft, loadLocalQuizDraft, saveLocalQuizDraft } from "./quiz-editor-local-draft";

beforeEach(() => localStorage.clear());

test("persists a tenant and quiz scoped recovery draft", () => {
  saveLocalQuizDraft("tenant-a", "quiz-1", { docVersion: 7, tree: [{ id: "group-1" }] });

  expect(loadLocalQuizDraft("tenant-a", "quiz-1")).toMatchObject({
    payload: { docVersion: 7, tree: [{ id: "group-1" }] },
  });
  expect(loadLocalQuizDraft("tenant-b", "quiz-1")).toBeNull();

  clearLocalQuizDraft("tenant-a", "quiz-1");
  expect(loadLocalQuizDraft("tenant-a", "quiz-1")).toBeNull();
});

test("supports default fallback draft key when quizId is empty", () => {
  const defaultDraftKey = "default-quiz-draft";
  saveLocalQuizDraft("erg", defaultDraftKey, {
    quizId: defaultDraftKey,
    docVersion: 1,
    tree: [{ id: "group-1", title: "Custom Group", slides: [] }],
  });

  const draft = loadLocalQuizDraft<{ tree: Array<{ title: string }> }>("erg", defaultDraftKey);
  expect(draft?.payload.tree[0]?.title).toBe("Custom Group");

  clearLocalQuizDraft("erg", defaultDraftKey);
  expect(loadLocalQuizDraft("erg", defaultDraftKey)).toBeNull();
});
