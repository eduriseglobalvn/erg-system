import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { QuizEditorDraftDocument } from "@/features/lcms/quiz/quiz-editor/api/quiz-editor-api";

import { createMemoryQuizDraftDeviceStore } from "./quiz-draft-device-store";
import { QuizDraftSyncSession } from "./quiz-draft-sync-session";
import { uploadInlineImages } from "./upload-inline-images";

vi.mock("@/features/lcms/quiz/quiz-editor/api/quiz-editor-api", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  saveQuizEditorDraft: vi.fn(async () => ({ docVersion: 4 })),
}));
vi.mock("./upload-inline-images", () => ({
  createQuizImageUploader: () => ({}),
  uploadInlineImages: vi.fn(async (doc: unknown) => doc),
}));

const doc = (title: string, quizId: string) =>
  ({ quizId, draftId: `d-${quizId}`, docVersion: 3, settings: { info: { title } }, playerTemplate: {}, tree: [] }) as unknown as QuizEditorDraftDocument;

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  vi.clearAllMocks();
  vi.useRealTimers();
});

describe("QuizDraftSyncSession", () => {
  it("gives each engine its own image cache, so closed quizzes free their images", async () => {
    const session = new QuizDraftSyncSession({
      hydrate: vi.fn(),
      buildCreateInput: () => ({ title: "" }),
      deps: { store: createMemoryQuizDraftDeviceStore(), isOnline: () => true },
    });
    const editAndSend = async (quizId: string) => {
      session.open(quizId, doc("server", quizId), true);
      await vi.advanceTimersByTimeAsync(0);
      session.change(quizId, doc("server", quizId)); // the baseline
      session.change(quizId, doc("edited", quizId));
      await session.flushNow();
    };
    await editAndSend("q1");
    await editAndSend("q2");
    const caches = vi.mocked(uploadInlineImages).mock.calls.map((call) => call[4]);
    expect(caches).toHaveLength(2);
    expect(caches[0]).toBeInstanceOf(Map);
    expect(caches[1]).not.toBe(caches[0]);
    session.close();
  });
});
