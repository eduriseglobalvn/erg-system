import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { QuizEditorDraftDocument } from "@/features/lcms/quiz/quiz-editor/api/quiz-editor-api";
import { ApiClientError } from "@/lib/api-client";

import {
  createMemoryQuizDraftDeviceStore,
  DeviceStorageFullError,
  type DeviceDraftRecord,
  type QuizDraftDeviceStore,
} from "./quiz-draft-device-store";
import { classifySyncError, QuizDraftSyncEngine, type QuizDraftSyncDeps } from "./quiz-draft-sync-engine";

const scope = "t1:a1";
const doc = (title: string, docVersion = 3) =>
  ({ quizId: "q1", draftId: "d1", docVersion, settings: { info: { title } }, playerTemplate: {}, tree: [] }) as unknown as QuizEditorDraftDocument;
const serverDoc = (docVersion: number) => doc("server", docVersion);
const rec = (over: Partial<DeviceDraftRecord> = {}): DeviceDraftRecord => ({
  key: "q1", quizId: "q1", createIdempotencyKey: "quiz-editor-create:k", baseDocVersion: 3, document: doc("device"), dirty: false,
  revision: 1, syncedRevision: 1, editedAt: "2026-11-01T00:00:00.000Z", syncedAt: "2026-11-01T00:00:00.000Z", writerId: "tab-1", ...over,
});
const titleOf = (input: { settings?: unknown }) => (input.settings as { info: { title: string } }).info.title;

let store: QuizDraftDeviceStore;
let online: boolean;
let api: {
  createQuiz: ReturnType<typeof vi.fn>;
  saveDraft: ReturnType<typeof vi.fn>;
  loadDraft: ReturnType<typeof vi.fn>;
  uploadImages: ReturnType<typeof vi.fn>;
};
let deps: QuizDraftSyncDeps;
let engine: QuizDraftSyncEngine;

beforeEach(() => {
  vi.useFakeTimers();
  store = createMemoryQuizDraftDeviceStore();
  online = true;
  api = {
    createQuiz: vi.fn().mockResolvedValue({ quizId: "quiz-new", draftId: "d", docVersion: 0 }),
    saveDraft: vi.fn().mockResolvedValue({ docVersion: 4 }),
    loadDraft: vi.fn().mockResolvedValue(serverDoc(9)),
    uploadImages: vi.fn(async (d: QuizEditorDraftDocument) => d),
  };
  deps = {
    store, scope, writerId: "tab-1",
    api: api as unknown as QuizDraftSyncDeps["api"],
    isOnline: () => online,
    now: () => new Date(),
    buildCreateInput: (d) => ({ title: titleOf(d) }),
    onQuizCreated: vi.fn(),
  };
  engine = new QuizDraftSyncEngine(deps, "q1");
});

afterEach(() => {
  engine.dispose();
  vi.useRealTimers();
});

describe("QuizDraftSyncEngine", () => {
  it("saves to the device at once and to the server 2s after the last edit", async () => {
    await engine.edit(doc("A")); await engine.edit(doc("AB"));
    expect((await store.get(scope, "q1"))?.dirty).toBe(true);
    await vi.advanceTimersByTimeAsync(1999); expect(api.saveDraft).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);    expect(api.saveDraft).toHaveBeenCalledTimes(1);
    expect(engine.status).toMatchObject({ kind: "saved" });
    expect((await store.get(scope, "q1"))?.dirty).toBe(false);
  });

  it("ignores an edit with identical content", async () => {
    await engine.edit(doc("A")); await vi.advanceTimersByTimeAsync(2000);
    await engine.edit(doc("A"));
    expect((await store.get(scope, "q1"))?.revision).toBe(1);
    expect(engine.hasUnsyncedChanges).toBe(false);
    await vi.advanceTimersByTimeAsync(60_000);
    expect(api.saveDraft).toHaveBeenCalledTimes(1);
  });

  it("keeps newer edits dirty when a save finishes", async () => {
    api.saveDraft.mockImplementation(() => new Promise((r) => setTimeout(() => r({ docVersion: 4 }), 500)));
    await engine.edit(doc("A")); await vi.advanceTimersByTimeAsync(2000);
    await engine.edit(doc("A2")); await vi.advanceTimersByTimeAsync(500);
    expect(engine.hasUnsyncedChanges).toBe(true);
    await vi.advanceTimersByTimeAsync(2000);
    expect(api.saveDraft).toHaveBeenLastCalledWith(expect.objectContaining({ docVersion: 4 }));
    expect(titleOf(api.saveDraft.mock.calls[1][0])).toBe("A2");
  });

  it("never runs two saves at once", async () => {
    let finish: (v: { docVersion: number }) => void = () => undefined;
    api.saveDraft.mockImplementationOnce(() => new Promise((r) => { finish = r; }));
    await engine.edit(doc("A"));
    const first = engine.flushNow();
    await vi.advanceTimersByTimeAsync(0);
    await engine.edit(doc("B"));
    const second = engine.flushNow();
    await vi.advanceTimersByTimeAsync(0);
    expect(api.saveDraft).toHaveBeenCalledTimes(1);
    finish({ docVersion: 4 });
    await Promise.all([first, second]);
    expect(api.saveDraft).toHaveBeenCalledTimes(2);
    expect(titleOf(api.saveDraft.mock.calls[1][0])).toBe("B");
    expect(api.saveDraft.mock.calls[1][0].docVersion).toBe(4);
    expect(engine.status).toMatchObject({ kind: "saved" });
  });

  it("goes offline on a network error and retries 2s, 5s, 15s, 30s, 30s", async () => {
    api.saveDraft.mockRejectedValue(new ApiClientError("x", "NETWORK_ERROR", 0));
    await engine.edit(doc("A")); await vi.advanceTimersByTimeAsync(2000);
    expect(engine.status).toEqual({ kind: "offline", pendingEdits: 1 });
    expect(api.saveDraft).toHaveBeenCalledTimes(1);
    let calls = 1;
    for (const ms of [2000, 5000, 15000, 30000, 30000]) {
      await vi.advanceTimersByTimeAsync(ms - 1);
      expect(api.saveDraft).toHaveBeenCalledTimes(calls);
      await vi.advanceTimersByTimeAsync(1);
      expect(api.saveDraft).toHaveBeenCalledTimes((calls += 1));
    }
    expect(calls).toBe(6);
  });

  it("starts the retry delays over after a successful save", async () => {
    const offline = new ApiClientError("x", "NETWORK_ERROR", 0);
    api.saveDraft.mockRejectedValueOnce(offline).mockResolvedValueOnce({ docVersion: 4 }).mockRejectedValueOnce(offline);
    await engine.edit(doc("A")); await vi.advanceTimersByTimeAsync(2000);
    await vi.advanceTimersByTimeAsync(2000);
    expect(engine.status).toMatchObject({ kind: "saved" });
    await engine.edit(doc("B")); await vi.advanceTimersByTimeAsync(2000);
    expect(api.saveDraft).toHaveBeenCalledTimes(3);
    await vi.advanceTimersByTimeAsync(1999);
    expect(api.saveDraft).toHaveBeenCalledTimes(3);
    await vi.advanceTimersByTimeAsync(1);
    expect(api.saveDraft).toHaveBeenCalledTimes(4);
  });

  it("does not call the server while the browser reports offline, and flushes on notifyOnline", async () => {
    online = false;
    await engine.edit(doc("A")); await vi.advanceTimersByTimeAsync(60_000);
    expect(api.saveDraft).not.toHaveBeenCalled();
    expect(engine.status).toEqual({ kind: "offline", pendingEdits: 1 });
    online = true;
    engine.notifyOnline();
    await vi.advanceTimersByTimeAsync(0);
    expect(api.saveDraft).toHaveBeenCalledTimes(1);
    expect(engine.status).toMatchObject({ kind: "saved" });
  });

  it("creates the quiz once with a persisted idempotency key, then re-keys the device record", async () => {
    engine = new QuizDraftSyncEngine(deps, "new-quiz:c:l:t");
    await engine.start(undefined); await engine.edit(doc("A")); await vi.advanceTimersByTimeAsync(2000);
    expect(api.createQuiz).toHaveBeenCalledTimes(1);
    expect(api.createQuiz).toHaveBeenCalledWith(expect.objectContaining({ title: "A", idempotencyKey: expect.stringMatching(/^quiz-editor-create:/) }));
    expect(await store.get(scope, "new-quiz:c:l:t")).toBeNull();
    expect((await store.get(scope, "quiz-new"))?.quizId).toBe("quiz-new");
    expect(deps.onQuizCreated).toHaveBeenCalledWith("quiz-new");
    expect(api.saveDraft).toHaveBeenCalledWith(expect.objectContaining({ quizId: "quiz-new", docVersion: 0 }));
    expect(engine.quizId).toBe("quiz-new");
  });

  it("reuses the persisted idempotency key after a lost create response", async () => {
    api.createQuiz.mockRejectedValueOnce(new ApiClientError("x", "NETWORK_ERROR", 0)).mockResolvedValueOnce({ quizId: "quiz-new", draftId: "d", docVersion: 0 });
    engine = new QuizDraftSyncEngine(deps, "new-quiz:c:l:t");
    await engine.start(undefined); await engine.edit(doc("A"));
    await vi.advanceTimersByTimeAsync(2000);
    await vi.advanceTimersByTimeAsync(2000);
    expect(api.createQuiz).toHaveBeenCalledTimes(2);
    const [first, second] = api.createQuiz.mock.calls.map((c) => c[0].idempotencyKey);
    expect(second).toBe(first);
    expect(api.saveDraft).toHaveBeenCalledTimes(1);
    expect(deps.onQuizCreated).toHaveBeenCalledTimes(1);
  });

  it("a new engine on the same store reuses the idempotency key after a lost create response", async () => {
    api.createQuiz.mockRejectedValueOnce(new ApiClientError("x", "NETWORK_ERROR", 0));
    engine = new QuizDraftSyncEngine(deps, "new-quiz:c:l:t");
    await engine.start(undefined); await engine.edit(doc("A"));
    await vi.advanceTimersByTimeAsync(2000);
    engine.dispose();
    engine = new QuizDraftSyncEngine(deps, "new-quiz:c:l:t");
    await engine.start(undefined);
    await vi.advanceTimersByTimeAsync(0);
    expect(api.createQuiz).toHaveBeenCalledTimes(2);
    const [first, second] = api.createQuiz.mock.calls.map((c) => c[0].idempotencyKey);
    expect(second).toBe(first);
    expect(deps.onQuizCreated).toHaveBeenCalledTimes(1);
  });

  it("reports the created quiz even when the re-keyed record cannot be stored", async () => {
    engine = new QuizDraftSyncEngine(deps, "new-quiz:c:l:t");
    await engine.start(undefined); await engine.edit(doc("A"));
    store.put = vi.fn().mockRejectedValue(new Error("idb broke"));
    await vi.advanceTimersByTimeAsync(2000);
    expect(deps.onQuizCreated).toHaveBeenCalledWith("quiz-new");
  });

  it("moves to conflict on 409 STALE_DRAFT and stops retrying", async () => {
    api.saveDraft.mockRejectedValue(new ApiClientError("x", "STALE_DRAFT", 409));
    await engine.edit(doc("A")); await vi.advanceTimersByTimeAsync(2000);
    expect(engine.status).toEqual({ kind: "conflict" });
    await engine.edit(doc("A2"));
    expect((await store.get(scope, "q1"))?.document).toEqual(doc("A2"));
    await vi.advanceTimersByTimeAsync(60_000);
    expect(api.saveDraft).toHaveBeenCalledTimes(1);
    expect(engine.status).toEqual({ kind: "conflict" });
  });

  it("resolveConflict('mine') backs up the server copy, rebases on its version and saves", async () => {
    api.saveDraft.mockRejectedValueOnce(new ApiClientError("x", "STALE_DRAFT", 409));
    await engine.edit(doc("mine")); await vi.advanceTimersByTimeAsync(2000);
    expect(engine.status).toEqual({ kind: "conflict" });
    expect(await engine.resolveConflict("mine")).toBeNull();
    const backups = await store.listBackups(scope, "q1");
    expect(backups).toHaveLength(1);
    expect(backups[0]).toMatchObject({ reason: "conflict-mine", document: serverDoc(9) });
    expect(api.saveDraft).toHaveBeenCalledTimes(2);
    expect(api.saveDraft).toHaveBeenLastCalledWith(expect.objectContaining({ docVersion: 9 }));
    expect(titleOf(api.saveDraft.mock.calls[1][0])).toBe("mine");
    expect(engine.status).toMatchObject({ kind: "saved" });
  });

  it("resolveConflict('server') backs up my copy and returns the server document", async () => {
    api.saveDraft.mockRejectedValueOnce(new ApiClientError("x", "STALE_DRAFT", 409));
    await engine.edit(doc("mine")); await vi.advanceTimersByTimeAsync(2000);
    expect(await engine.resolveConflict("server")).toEqual(serverDoc(9));
    const record = await store.get(scope, "q1");
    expect(record).toMatchObject({ dirty: false, baseDocVersion: 9, document: serverDoc(9) });
    expect((await store.listBackups(scope, "q1"))[0]).toMatchObject({ reason: "conflict-server", document: doc("mine") });
    expect(engine.status).toMatchObject({ kind: "saved" });
    expect(engine.docVersion).toBe(9);
    await vi.advanceTimersByTimeAsync(60_000);
    expect(api.saveDraft).toHaveBeenCalledTimes(1);
  });

  it("pauses on 401 and resumes on the next flush", async () => {
    api.saveDraft.mockRejectedValueOnce(new ApiClientError("x", "HTTP_401", 401));
    await engine.edit(doc("A")); await vi.advanceTimersByTimeAsync(2000);
    expect(engine.status).toEqual({ kind: "signed-out" });
    await vi.advanceTimersByTimeAsync(60_000);
    expect(api.saveDraft).toHaveBeenCalledTimes(1);
    await engine.flushNow();
    expect(api.saveDraft).toHaveBeenCalledTimes(2);
    expect(engine.status).toMatchObject({ kind: "saved" });
  });

  it("reports storage-full when the device store is full and keeps the edit in memory", async () => {
    store.put = vi.fn().mockRejectedValue(new DeviceStorageFullError("full"));
    await engine.edit(doc("A"));
    expect(engine.status).toEqual({ kind: "storage-full" });
    expect(engine.hasUnsyncedChanges).toBe(true);
    await engine.flushNow();
    expect(api.saveDraft).toHaveBeenCalledWith(expect.objectContaining({ quizId: "q1" }));
    expect(titleOf(api.saveDraft.mock.calls[0][0])).toBe("A");
  });

  it("clears storage-full after a later successful store write", async () => {
    const put = store.put.bind(store);
    store.put = vi.fn().mockRejectedValueOnce(new DeviceStorageFullError("full")).mockImplementation(put);
    await engine.edit(doc("A"));
    expect(engine.status).toEqual({ kind: "storage-full" });
    await engine.edit(doc("B"));
    expect(engine.status).toEqual({ kind: "pending" });
  });

  it("backs up another tab's unsynced record before overwriting", async () => {
    await store.put(scope, rec({ key: "q1", dirty: true, writerId: "tab-OTHER", document: doc("from other tab") }));
    await engine.edit(doc("mine"));
    expect((await store.listBackups(scope, "q1"))[0]).toMatchObject({ reason: "other-tab", document: doc("from other tab") });
    expect((await store.get(scope, "q1"))).toMatchObject({ writerId: "tab-1", document: doc("mine") });
  });

  it("backs up the same other-tab record only once", async () => {
    await store.put(scope, rec({ key: "q1", dirty: true, writerId: "tab-OTHER", revision: 5, document: doc("from other tab") }));
    store.put = vi.fn().mockRejectedValue(new DeviceStorageFullError("full")); // our write fails, the other tab's record stays
    await engine.edit(doc("mine"));
    await vi.advanceTimersByTimeAsync(1000); // distinct createdAt, so a second backup would not overwrite the first
    await engine.edit(doc("mine again"));
    expect(await store.listBackups(scope, "q1")).toHaveLength(1);
  });

  it("does not back up a dirty record it recovered on start", async () => {
    await store.put(scope, rec({ dirty: true, revision: 3, syncedRevision: 1, writerId: "tab-OLD" }));
    online = false;
    await engine.start(serverDoc(3));
    await engine.edit(doc("next"));
    expect(await store.listBackups(scope, "q1")).toEqual([]);
  });

  it("uploads inline images before saving", async () => {
    const uploaded = doc("uploaded");
    api.uploadImages.mockResolvedValueOnce(uploaded);
    await engine.edit(doc("data-url"));
    await engine.flushNow();
    expect(api.uploadImages).toHaveBeenCalledWith(doc("data-url"));
    expect(titleOf(api.saveDraft.mock.calls[0][0])).toBe("uploaded");
    expect((await store.get(scope, "q1"))?.document).toEqual(uploaded);
  });

  it("treats the UI's pre-upload copy as unchanged after its images were uploaded", async () => {
    api.uploadImages.mockResolvedValue(doc("uploaded"));
    await engine.edit(doc("data-url"));
    await engine.flushNow();
    await engine.edit(doc("data-url"));
    expect((await store.get(scope, "q1"))?.revision).toBe(1);
    expect(engine.hasUnsyncedChanges).toBe(false);
    await vi.advanceTimersByTimeAsync(60_000);
    expect(api.saveDraft).toHaveBeenCalledTimes(1);
  });

  it("classifySyncError", () => {
    expect(classifySyncError(new ApiClientError("x", "REQUEST_TIMEOUT", 408))).toBe("network");
    expect(classifySyncError(new ApiClientError("x", "NETWORK_ERROR", 0))).toBe("network");
    expect(classifySyncError(new ApiClientError("x", "STALE_DRAFT", 409))).toBe("stale");
    expect(classifySyncError(new ApiClientError("x", "HTTP_401", 401))).toBe("auth");
    expect(classifySyncError(new ApiClientError("x", "HTTP_500", 500))).toBe("other");
    expect(classifySyncError(new Error("boom"))).toBe("other");
  });

  it("start() with a dirty device copy sends it without waiting for an edit", async () => {
    await store.put(scope, rec({ dirty: true, revision: 3, syncedRevision: 1 }));
    expect(await engine.start(serverDoc(3))).toEqual(doc("device"));
    expect(engine.status).toEqual({ kind: "pending" });
    expect(engine.recovered).toEqual({ pendingEdits: 2, editedAt: "2026-11-01T00:00:00.000Z" });
    await vi.advanceTimersByTimeAsync(0);
    expect(api.saveDraft).toHaveBeenCalledTimes(1);
  });

  it("start() with a clean device copy loads the server draft and keeps the create key", async () => {
    await store.put(scope, rec({ createIdempotencyKey: "quiz-editor-create:keep" }));
    expect(await engine.start(serverDoc(7))).toEqual(serverDoc(7));
    expect(engine.status).toEqual({ kind: "saved", at: null });
    expect(engine.recovered).toBeNull();
    expect(await store.get(scope, "q1")).toMatchObject({ dirty: false, baseDocVersion: 7, createIdempotencyKey: "quiz-editor-create:keep", document: serverDoc(7) });
    expect(engine.docVersion).toBe(7);
  });

  it("start() with nothing returns null and stays saved", async () => {
    engine = new QuizDraftSyncEngine(deps, "new-quiz:c:l:t");
    expect(await engine.start(undefined)).toBeNull();
    expect(engine.status).toEqual({ kind: "saved", at: null });
    expect(engine.quizId).toBeNull();
  });

  it("reports an unexpected error without retrying", async () => {
    api.saveDraft.mockRejectedValueOnce(new Error("boom"));
    await engine.edit(doc("A")); await vi.advanceTimersByTimeAsync(2000);
    expect(engine.status).toEqual({ kind: "error", message: "boom" });
    await vi.advanceTimersByTimeAsync(60_000);
    expect(api.saveDraft).toHaveBeenCalledTimes(1);
  });

  it("records a save that finishes after dispose, without notifying anyone", async () => {
    let finish: (v: { docVersion: number }) => void = () => undefined;
    api.saveDraft.mockImplementationOnce(() => new Promise((r) => { finish = r; }));
    const listener = vi.fn();
    engine.subscribe(listener);
    await engine.edit(doc("A"));
    const flushing = engine.flushNow();
    await vi.advanceTimersByTimeAsync(0);
    listener.mockClear();
    engine.dispose();
    finish({ docVersion: 4 });
    await flushing;
    expect(listener).not.toHaveBeenCalled();
    expect(await store.get(scope, "q1")).toMatchObject({ dirty: false, baseDocVersion: 4, syncedRevision: 1 });
  });

  it("leaves a newer record alone when a save finishes after dispose", async () => {
    let finish: (v: { docVersion: number }) => void = () => undefined;
    api.saveDraft.mockImplementationOnce(() => new Promise((r) => { finish = r; }));
    await engine.edit(doc("A"));
    const flushing = engine.flushNow();
    await vi.advanceTimersByTimeAsync(0);
    engine.dispose();
    await store.put(scope, rec({ dirty: true, revision: 2, syncedRevision: 0, writerId: "tab-1", document: doc("newer") }));
    finish({ docVersion: 4 });
    await flushing;
    expect(await store.get(scope, "q1")).toMatchObject({ dirty: true, revision: 2, document: doc("newer") });
  });

  it("an edit queued before dispose neither writes nor arms a timer", async () => {
    const pending = engine.edit(doc("A"));
    engine.dispose();
    await pending;
    expect(await store.get(scope, "q1")).toBeNull();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("survives a status listener that throws", async () => {
    engine.subscribe((s) => {
      if (s.kind === "saving") throw new Error("listener");
    });
    await engine.edit(doc("A"));
    await expect(engine.flushNow()).resolves.toBeUndefined();
  });
});
