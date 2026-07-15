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
