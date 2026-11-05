import { onlineManager, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { QuizEditorDraftDocument } from "@/features/lcms/quiz/quiz-editor/api/quiz-editor-api";
import { ApiClientError } from "@/lib/api-client";
import { getDefaultTenantId } from "@/lib/graphql-client";
import { getAuthScope } from "@/platform/auth/api/auth-storage";

import {
  createMemoryQuizDraftDeviceStore,
  quizDraftScope,
  type QuizDraftDeviceStore,
} from "../sync/quiz-draft-device-store";
import { createBlankDraft } from "../sync/quiz-draft-initial-document";
import { useQuizEditorState } from "./use-quiz-editor-state";
import { useQuizEditorSync } from "./use-quiz-editor-sync";

const { api, device } = vi.hoisted(() => ({
  api: { loadQuizEditorDraft: vi.fn(), saveQuizEditorDraft: vi.fn(), createQuizEditorQuiz: vi.fn() },
  device: { store: null as unknown as QuizDraftDeviceStore },
}));
vi.mock("@/features/lcms/quiz/quiz-editor/api/quiz-editor-api", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  ...api,
}));
// The session keeps one store per page; delegate to a fresh in-memory one per test.
vi.mock("../sync/quiz-draft-device-store", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../sync/quiz-draft-device-store")>();
  const proxy = new Proxy({} as QuizDraftDeviceStore, {
    get: (_target, key) => {
      const value = (device.store as unknown as Record<PropertyKey, unknown>)[key];
      return typeof value === "function" ? value.bind(device.store) : value;
    },
  });
  return { ...actual, createQuizDraftDeviceStore: () => proxy };
});

const scope = quizDraftScope(getDefaultTenantId(), getAuthScope().accountId);
const titled = (title: string, quizId = "q1"): QuizEditorDraftDocument => {
  const blank = createBlankDraft(quizId, `d-${quizId}`);
  return { ...blank, docVersion: 3, settings: { ...blank.settings, info: { ...blank.settings.info, title } } };
};
const settle = (ms = 0) => act(async () => { await vi.advanceTimersByTimeAsync(ms); });

function setup(quizId: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => createElement(QueryClientProvider, { client }, children);
  return renderHook(
    ({ id }: { id: string }) => {
      const editor = useQuizEditorState(null);
      const sync = useQuizEditorSync({
        quizId: id,
        scope: {
          questionBankQuery: { isPending: false },
          questionBankSubjects: [],
          selectedCourseId: "c1",
          selectedLevelId: null,
          selectedTopicId: "all",
        } as never,
        editor,
        questionSlides: [],
        selectedSlideId: null,
        questionEditorOpen: false,
        onQuizCreated: vi.fn(),
        onPublished: vi.fn(),
      });
      return { editor, sync };
    },
    { initialProps: { id: quizId }, wrapper },
  );
}

beforeEach(() => {
  vi.useFakeTimers();
  device.store = createMemoryQuizDraftDeviceStore();
  api.loadQuizEditorDraft.mockReset().mockResolvedValue(titled("Server copy"));
  api.saveQuizEditorDraft.mockReset().mockResolvedValue({ docVersion: 4 });
  api.createQuizEditorQuiz.mockReset();
});

afterEach(() => {
  onlineManager.setOnline(true);
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("useQuizEditorSync", () => {
  it("opens a quiz without saving it back", async () => {
    const { result } = setup("q1");
    await settle();
    await settle();
    expect(result.current.sync.sync.ready).toBe(true);
    expect(result.current.editor.quizProject.info.title).toBe("Server copy");
    await settle(5000);
    expect(api.saveQuizEditorDraft).not.toHaveBeenCalled();
  });

  it("resets to a blank draft when the key moves to a new quiz", async () => {
    const { result, rerender } = setup("q1");
    await settle();
    await settle();
    expect(result.current.editor.quizProject.info.title).toBe("Server copy");

    rerender({ id: "" });
    await settle();
    expect(result.current.sync.sync.ready).toBe(true);
    expect(result.current.editor.quizProject.info.title).toBe("Bài kiểm tra mới");
    expect(result.current.editor.groups).toEqual(createBlankDraft("", "x").tree);
  });

  it("opens the device copy when the draft query is paused offline", async () => {
    await device.store.put(scope, {
      key: "q1", quizId: "q1", createIdempotencyKey: "k", baseDocVersion: 3, document: titled("Device copy"), dirty: false,
      revision: 1, syncedRevision: 1, editedAt: "2026-11-05T00:00:00.000Z", syncedAt: "2026-11-05T00:00:00.000Z", writerId: "w",
    });
    onlineManager.setOnline(false);
    const { result } = setup("q1");
    await settle();
    await settle();
    expect(api.loadQuizEditorDraft).not.toHaveBeenCalled();
    expect(result.current.sync.sync.ready).toBe(true);
    expect(result.current.editor.quizProject.info.title).toBe("Device copy");
  });

  it("opens the device copy when the draft request fails on the network", async () => {
    api.loadQuizEditorDraft.mockRejectedValue(new ApiClientError("offline", "NETWORK_ERROR", 0));
    await device.store.put(scope, {
      key: "q1", quizId: "q1", createIdempotencyKey: "k", baseDocVersion: 3, document: titled("Device copy"), dirty: true,
      revision: 2, syncedRevision: 1, editedAt: "2026-11-05T00:00:00.000Z", syncedAt: null, writerId: "w",
    });
    const { result } = setup("q1");
    await settle();
    await settle();
    expect(result.current.sync.sync.ready).toBe(true);
    expect(result.current.editor.quizProject.info.title).toBe("Device copy");
  });

  it("shows a retryable error for a quiz never opened on this device while offline", async () => {
    onlineManager.setOnline(false);
    const { result } = setup("q1");
    await settle();
    await settle();
    expect(result.current.sync.sync.ready).toBe(false);
    expect(result.current.sync.loadFailed).toBe(true);
    expect(result.current.sync.sync.status).toEqual({ kind: "error", message: "Cần có mạng để mở bài này lần đầu trên máy này." });
  });
});
