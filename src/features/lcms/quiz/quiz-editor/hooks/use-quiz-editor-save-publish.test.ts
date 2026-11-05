import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { createElement, useSyncExternalStore, type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createNewQuizProjectSettings } from "@/features/lcms/quiz/quiz-editor/api/quiz-editor-project-defaults";
import { slideFingerprint } from "@/features/lcms/quiz/quiz-editor/model/quiz-publish-state";
import type { UseQuizDraftSyncResult } from "@/features/lcms/quiz/quiz-editor/sync/use-quiz-draft-sync";
import type { QuizEditorSlide, QuizProjectSettings } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";

const { publishQuizEditorDraft, toast } = vi.hoisted(() => ({
  publishQuizEditorDraft: vi.fn(),
  toast: { error: vi.fn(), success: vi.fn() },
}));
vi.mock("@/features/lcms/quiz/quiz-editor/api/quiz-editor-api", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  publishQuizEditorDraft,
}));
vi.mock("sonner", () => ({ toast }));

import { useQuizEditorPublish } from "./use-quiz-editor-save-publish";

const fakeSync = (overrides: Partial<UseQuizDraftSyncResult> = {}): UseQuizDraftSyncResult => ({
  status: { kind: "saved", at: "2026-11-05T03:00:00.000Z" },
  ready: true,
  persistent: true,
  quizId: "quiz-1",
  docVersion: 4,
  hasUnsyncedChanges: false,
  flushNow: vi.fn(async () => undefined),
  resolveConflict: vi.fn(),
  recovered: null,
  backups: [],
  restoreBackup: vi.fn(),
  ...overrides,
});

/** Serves `sync` the way useQuizDraftSync does: an external store that changes before flushNow resolves. */
const slides: QuizEditorSlide[] = ["s1", "s2", "s3"].map((id) => ({ id, title: `Câu ${id}`, kind: "multiple-choice" }));

/** Applies what the hook handed to the quizProject setter, as React would. */
function settingsAfter(updateQuizProject: ReturnType<typeof vi.fn>, current: QuizProjectSettings) {
  const update = updateQuizProject.mock.calls[0]?.[0] as QuizProjectSettings | ((value: QuizProjectSettings) => QuizProjectSettings);
  return typeof update === "function" ? update(current) : update;
}

function setup(initial: UseQuizDraftSyncResult, questionSlides = slides) {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => createElement(QueryClientProvider, { client }, children);
  let snapshot = initial;
  const listeners = new Set<() => void>();
  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };
  const setSync = (next: UseQuizDraftSyncResult) => {
    snapshot = next;
    for (const listener of listeners) listener();
  };
  const setSlidesPublished = vi.fn();
  const updateQuizProject = vi.fn();
  const onPublished = vi.fn();
  const view = renderHook(
    () => useQuizEditorPublish({
      sync: useSyncExternalStore(subscribe, () => snapshot),
      draftId: "draft-1",
      questionSlides,
      setSlidesPublished,
      updateQuizProject,
      onPublished,
    }),
    { wrapper },
  );
  return { ...view, setSync, setSlidesPublished, updateQuizProject, onPublished };
}

/** Like the session: the engine sends, then the snapshot changes, then flushNow resolves. No act(), so React schedules as in the app. */
function flushTo(setSync: (next: UseQuizDraftSyncResult) => void, after: Partial<UseQuizDraftSyncResult>) {
  const flushNow = vi.fn(async () => {
    await Promise.resolve();
    setSync(fakeSync({ ...after, flushNow }));
  });
  return flushNow;
}

const actEnvironment = globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean };

describe("useQuizEditorPublish", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    publishQuizEditorDraft.mockResolvedValue({ quizVersionId: "v1", versionLabel: "1.0", versionNumber: 1 });
  });
  afterEach(() => {
    actEnvironment.IS_REACT_ACT_ENVIRONMENT = true;
  });

  it("blocks publish with a reason while offline or in conflict", async () => {
    const { result, setSync } = setup(fakeSync({ status: { kind: "offline", pendingEdits: 1 } }));
    expect(result.current.publishBlockedReason).toBe("Cần có mạng để xuất bản.");
    await act(() => result.current.handlePublish());

    act(() => setSync(fakeSync({ status: { kind: "conflict" } })));
    expect(result.current.publishBlockedReason).toBe("Cần chọn bản để giữ trước khi xuất bản.");
    await act(() => result.current.handlePublish());

    expect(publishQuizEditorDraft).not.toHaveBeenCalled();
    act(() => setSync(fakeSync()));
    expect(result.current.publishBlockedReason).toBeNull();
  });

  it("flushes pending changes first, then publishes the whole quiz with an idempotency key tied to the draft and its version", async () => {
    const view = setup(fakeSync({ status: { kind: "pending" }, docVersion: 4 }));
    // The flush sends the last edit; the server answers with docVersion 5.
    const flushNow = flushTo(view.setSync, { docVersion: 5 });
    act(() => view.setSync(fakeSync({ status: { kind: "pending" }, docVersion: 4, flushNow })));

    actEnvironment.IS_REACT_ACT_ENVIRONMENT = false;
    await view.result.current.handlePublish();

    expect(flushNow.mock.invocationCallOrder[0]).toBeLessThan(publishQuizEditorDraft.mock.invocationCallOrder[0]!);
    expect(publishQuizEditorDraft).toHaveBeenCalledWith(
      expect.objectContaining({ quizId: "quiz-1", docVersion: 5, idempotencyKey: "quiz-editor-publish:quiz-1:draft-1:5" }),
    );
    expect(view.setSlidesPublished).toHaveBeenCalledWith(["s1", "s2", "s3"]);
    const current = createNewQuizProjectSettings("Phân số");
    const next = settingsAfter(view.updateQuizProject, current);
    expect(next.publishedFingerprints).toEqual(Object.fromEntries(slides.map((slide) => [slide.id, slideFingerprint(slide)])));
    expect(next.info).toEqual(current.info);
    expect(view.onPublished).toHaveBeenCalledTimes(1);
    expect(toast.success).toHaveBeenCalled();
    await waitFor(() => expect(view.result.current.isPublishing).toBe(false));
  });

  it("stops when the flush did not reach the server", async () => {
    const view = setup(fakeSync({ status: { kind: "pending" } }));
    const flushNow = flushTo(view.setSync, { status: { kind: "error", message: "500" } });
    act(() => view.setSync(fakeSync({ status: { kind: "pending" }, flushNow })));

    actEnvironment.IS_REACT_ACT_ENVIRONMENT = false;
    await view.result.current.handlePublish();

    expect(flushNow).toHaveBeenCalledTimes(1);
    expect(toast.error).toHaveBeenCalledWith("Chưa gửi được thay đổi lên máy chủ nên chưa xuất bản.");
    expect(publishQuizEditorDraft).not.toHaveBeenCalled();
    expect(view.setSlidesPublished).not.toHaveBeenCalled();
    expect(view.updateQuizProject).not.toHaveBeenCalled();
    await waitFor(() => expect(view.result.current.isPublishing).toBe(false));
  });

  it("leaves the fingerprints untouched when the server rejects the publish", async () => {
    publishQuizEditorDraft.mockRejectedValue(new Error("Câu 2 chưa có đáp án đúng"));
    const view = setup(fakeSync());

    actEnvironment.IS_REACT_ACT_ENVIRONMENT = false;
    await view.result.current.handlePublish();

    expect(publishQuizEditorDraft).toHaveBeenCalledTimes(1);
    expect(view.updateQuizProject).not.toHaveBeenCalled();
    expect(view.setSlidesPublished).not.toHaveBeenCalled();
    await waitFor(() => expect(view.result.current.isPublishing).toBe(false));
  });

  it("publishes when the device is full but every change reached the server", async () => {
    const view = setup(fakeSync({ status: { kind: "storage-full" }, hasUnsyncedChanges: true }));
    const flushNow = flushTo(view.setSync, { status: { kind: "storage-full" }, hasUnsyncedChanges: false });
    act(() => view.setSync(fakeSync({ status: { kind: "storage-full" }, hasUnsyncedChanges: true, flushNow })));

    actEnvironment.IS_REACT_ACT_ENVIRONMENT = false;
    await view.result.current.handlePublish();

    expect(publishQuizEditorDraft).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(view.result.current.isPublishing).toBe(false));
  });

  it("does not publish from a full device while changes are still unsent", async () => {
    const view = setup(fakeSync({ status: { kind: "storage-full" }, hasUnsyncedChanges: true }));
    const flushNow = flushTo(view.setSync, { status: { kind: "storage-full" }, hasUnsyncedChanges: true });
    act(() => view.setSync(fakeSync({ status: { kind: "storage-full" }, hasUnsyncedChanges: true, flushNow })));

    actEnvironment.IS_REACT_ACT_ENVIRONMENT = false;
    await view.result.current.handlePublish();

    expect(publishQuizEditorDraft).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith("Chưa gửi được thay đổi lên máy chủ nên chưa xuất bản.");
    await waitFor(() => expect(view.result.current.isPublishing).toBe(false));
  });

  it("blocks publish with a reason when there is no question", async () => {
    const { result } = setup(fakeSync(), []);
    expect(result.current.publishBlockedReason).toBe("Chưa có câu hỏi để xuất bản.");
    await act(() => result.current.handlePublish());
    expect(publishQuizEditorDraft).not.toHaveBeenCalled();
  });

  it("ignores a second click while publishing", async () => {
    let release!: () => void;
    publishQuizEditorDraft.mockImplementation(
      () => new Promise((resolve) => { release = () => resolve({ quizVersionId: "v1", versionLabel: "1.0", versionNumber: 1 }); }),
    );
    const { result } = setup(fakeSync());

    let first!: Promise<void>;
    await act(async () => {
      first = result.current.handlePublish();
      await Promise.resolve();
    });
    expect(result.current.isPublishing).toBe(true);
    await act(() => result.current.handlePublish());
    await waitFor(() => expect(publishQuizEditorDraft).toHaveBeenCalledTimes(1));
    await act(async () => {
      release();
      await first;
    });

    expect(publishQuizEditorDraft).toHaveBeenCalledTimes(1);
    expect(result.current.isPublishing).toBe(false);
  });
});
