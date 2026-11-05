import { act, renderHook } from "@testing-library/react";
import { StrictMode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { QuizEditorDraftDocument } from "@/features/lcms/quiz/quiz-editor/api/quiz-editor-api";
import { ApiClientError } from "@/lib/api-client";
import { getDefaultTenantId } from "@/lib/graphql-client";
import { getAuthScope } from "@/platform/auth/api/auth-storage";

import { createMemoryQuizDraftDeviceStore, quizDraftScope, type DeviceDraftRecord, type QuizDraftDeviceStore } from "./quiz-draft-device-store";
import { QuizDraftSyncEngine } from "./quiz-draft-sync-engine";
import { useQuizDraftSync } from "./use-quiz-draft-sync";

// The signed-in account can change while the editor stays open (a shared school computer).
const auth = vi.hoisted(() => ({ accountId: undefined as string | undefined }));
vi.mock("@/platform/auth/api/auth-storage", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/platform/auth/api/auth-storage")>();
  return { ...actual, getAuthScope: () => ({ ...actual.getAuthScope(), accountId: auth.accountId }) };
});

const scope = quizDraftScope(getDefaultTenantId(), getAuthScope().accountId);
const doc = (title: string, quizId = "q1", docVersion = 3) =>
  ({ quizId, draftId: `d-${quizId}`, docVersion, settings: { info: { title } }, playerTemplate: {}, tree: [] }) as unknown as QuizEditorDraftDocument;
const titleOf = (d: { settings?: unknown } | undefined) => (d?.settings as { info: { title: string } } | undefined)?.info.title;
const rec = (over: Partial<DeviceDraftRecord> = {}): DeviceDraftRecord => ({
  key: "q1", quizId: "q1", createIdempotencyKey: "quiz-editor-create:k", baseDocVersion: 3, document: doc("device"), dirty: false,
  revision: 1, syncedRevision: 1, editedAt: "2026-11-01T00:00:00.000Z", syncedAt: "2026-11-01T00:00:00.000Z", writerId: "other-tab", ...over,
});
const setVisibility = (state: DocumentVisibilityState) =>
  Object.defineProperty(document, "visibilityState", { configurable: true, get: () => state });
const settle = (ms = 0) => act(async () => { await vi.advanceTimersByTimeAsync(ms); });

type Props = { draftKey: string; serverDraft: QuizEditorDraftDocument | undefined; settled: boolean; document: QuizEditorDraftDocument };

let store: QuizDraftDeviceStore;
let online: boolean;
let api: { createQuiz: ReturnType<typeof vi.fn>; saveDraft: ReturnType<typeof vi.fn>; loadDraft: ReturnType<typeof vi.fn>; uploadImages: ReturnType<typeof vi.fn> };
let hydrate: ReturnType<typeof vi.fn<(d: QuizEditorDraftDocument) => void>>;
let onQuizCreated: ReturnType<typeof vi.fn<(id: string) => void>>;
let onSynced: ReturnType<typeof vi.fn<() => void>>;

function setup(initial: Partial<Props> = {}, wrapper?: typeof StrictMode) {
  const initialProps: Props = { draftKey: "q1", serverDraft: doc("server"), settled: true, document: doc("server"), ...initial };
  const deps = { store, api: api as never, isOnline: () => online, now: () => new Date() };
  return renderHook(
    (p: Props) =>
      useQuizDraftSync({
        draftKey: p.draftKey,
        serverDraft: p.serverDraft,
        serverDraftSettled: p.settled,
        document: p.document,
        hydrate,
        buildCreateInput: (d) => ({ title: titleOf(d) ?? "" }),
        onQuizCreated,
        onSynced,
        deps,
      }),
    { initialProps, wrapper },
  );
}

beforeEach(() => {
  vi.useFakeTimers();
  localStorage.clear();
  store = createMemoryQuizDraftDeviceStore();
  online = true;
  api = {
    createQuiz: vi.fn().mockResolvedValue({ quizId: "quiz-new", draftId: "d", docVersion: 0 }),
    saveDraft: vi.fn().mockResolvedValue({ docVersion: 4 }),
    loadDraft: vi.fn().mockResolvedValue(doc("server", "q1", 9)),
    uploadImages: vi.fn(async (d: QuizEditorDraftDocument) => d),
  };
  hydrate = vi.fn();
  onQuizCreated = vi.fn();
  onSynced = vi.fn();
});

afterEach(() => {
  auth.accountId = undefined;
  Reflect.deleteProperty(document, "visibilityState");
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("useQuizDraftSync", () => {
  it("hydrates once from the chosen document, then forwards edits to the engine", async () => {
    const { result, rerender } = setup();
    await settle();
    expect(result.current.ready).toBe(true);
    expect(hydrate).toHaveBeenCalledTimes(1);
    expect(hydrate).toHaveBeenCalledWith(doc("server"));
    const loaded = (await store.get(scope, "q1"))!.revision;

    rerender({ draftKey: "q1", serverDraft: doc("server"), settled: true, document: doc("edited") });
    await settle(299);
    expect((await store.get(scope, "q1"))!.revision).toBe(loaded);
    await settle(1);
    const stored = await store.get(scope, "q1");
    expect(stored?.revision).toBe(loaded + 1);
    expect(titleOf(stored?.document)).toBe("edited");
    expect(result.current.hasUnsyncedChanges).toBe(true);

    await settle(2000);
    expect(api.saveDraft).toHaveBeenCalledTimes(1);
    expect(result.current.status.kind).toBe("saved");
    expect(onSynced).toHaveBeenCalledTimes(1);
    expect(hydrate).toHaveBeenCalledTimes(1);
  });

  it("does not autosave quiz A content under quiz B's key while B is still loading", async () => {
    const { result, rerender } = setup({ draftKey: "A", serverDraft: doc("A", "A"), document: doc("A", "A") });
    await settle();
    expect(await store.get(scope, "A")).not.toBeNull();

    // Editor state still holds quiz A after the switch, and keeps changing.
    rerender({ draftKey: "B", serverDraft: undefined, settled: false, document: doc("A", "A") });
    rerender({ draftKey: "B", serverDraft: undefined, settled: false, document: doc("A typed", "A") });
    expect(result.current.ready).toBe(false);
    await settle(5000);
    expect(await store.get(scope, "B")).toBeNull();
    expect(api.saveDraft).not.toHaveBeenCalledWith(expect.objectContaining({ quizId: "B" }));

    rerender({ draftKey: "B", serverDraft: doc("B", "B"), settled: true, document: doc("A typed", "A") });
    await settle();
    expect(hydrate).toHaveBeenLastCalledWith(expect.objectContaining({ quizId: "B" }));
    await settle(5000);
    expect(titleOf((await store.get(scope, "B"))?.document)).toBe("B");
  });

  it("flushes when the window comes back online", async () => {
    online = false;
    const { rerender } = setup();
    await settle();
    rerender({ draftKey: "q1", serverDraft: doc("server"), settled: true, document: doc("offline edit") });
    await settle(5000);
    expect(api.saveDraft).not.toHaveBeenCalled();

    online = true;
    await act(async () => { window.dispatchEvent(new Event("online")); await vi.advanceTimersByTimeAsync(0); });
    expect(api.saveDraft).toHaveBeenCalledTimes(1);
  });

  it("asks before unload only when there are unsynced changes", async () => {
    const unload = () => {
      const event = new Event("beforeunload", { cancelable: true });
      window.dispatchEvent(event);
      return event.defaultPrevented;
    };
    const { rerender } = setup();
    await settle();
    expect(unload()).toBe(false);

    rerender({ draftKey: "q1", serverDraft: doc("server"), settled: true, document: doc("edited") });
    expect(unload()).toBe(true); // still in the 300 ms debounce
    await settle(300);
    expect(unload()).toBe(true); // dirty on the device, not sent yet
    await settle(2000);
    expect(unload()).toBe(false);
  });

  it("runs legacy migration once per scope before the first load", async () => {
    const legacyKey = (key: string) => `erg:quiz-editor:recovery:v1:${encodeURIComponent(getDefaultTenantId())}:${encodeURIComponent(key)}`;
    localStorage.setItem(legacyKey("q1"), JSON.stringify({ savedAt: new Date().toISOString(), payload: doc("legacy") }));
    const first = setup();
    await settle();
    expect(localStorage.getItem(legacyKey("q1"))).toBeNull();
    expect(hydrate).toHaveBeenCalledWith(doc("legacy")); // the migrated copy is dirty, so it wins over the server
    first.unmount();

    localStorage.setItem(legacyKey("q2"), JSON.stringify({ savedAt: new Date().toISOString(), payload: doc("legacy 2", "q2") }));
    setup({ draftKey: "q2", serverDraft: doc("server", "q2"), document: doc("server", "q2") });
    await settle();
    expect(localStorage.getItem(legacyKey("q2"))).not.toBeNull();
  });

  it("reports recovered edits when the device copy was unsent", async () => {
    online = false;
    await store.put(scope, rec({ dirty: true, revision: 4, syncedRevision: 1, editedAt: "2026-11-04T10:00:00.000Z" }));
    const { result } = setup();
    await settle();
    expect(result.current.recovered).toEqual({ pendingEdits: 3, editedAt: "2026-11-04T10:00:00.000Z" });
  });

  it("resumes after sign-in when the tab regains focus", async () => {
    await store.put(scope, rec({ dirty: true, revision: 2, syncedRevision: 1 }));
    api.saveDraft.mockRejectedValueOnce(new ApiClientError("Unauthorized", "UNAUTHORIZED", 401));
    const { result } = setup();
    await settle();
    expect(result.current.status.kind).toBe("signed-out");
    expect(api.saveDraft).toHaveBeenCalledTimes(1);

    await act(async () => { window.dispatchEvent(new Event("focus")); await vi.advanceTimersByTimeAsync(0); });
    expect(api.saveDraft).toHaveBeenCalledTimes(2);
    expect(result.current.status.kind).toBe("saved");
  });

  it("restoreBackup hydrates the backup and marks it as a new edit", async () => {
    const createdAt = "2026-11-04T09:00:00.000Z";
    await store.addBackup(scope, { key: "q1", reason: "other-tab", document: doc("backup"), createdAt });
    const { result } = setup();
    await settle();
    expect(result.current.backups).toHaveLength(1);

    act(() => result.current.restoreBackup(createdAt));
    await settle();
    expect(hydrate).toHaveBeenLastCalledWith(doc("backup"));
    expect(result.current.hasUnsyncedChanges).toBe(true);
    expect(titleOf((await store.get(scope, "q1"))?.document)).toBe("backup");
  });

  it("keeps the same engine when a new quiz is re-keyed to the id it just created", async () => {
    const start = vi.spyOn(QuizDraftSyncEngine.prototype, "start");
    const newKey = "new-quiz:c:all:t";
    const { result, rerender } = setup({ draftKey: newKey, serverDraft: undefined, document: doc("blank", newKey) });
    await settle();
    rerender({ draftKey: newKey, serverDraft: undefined, settled: true, document: doc("first", newKey) });
    await settle(2300);
    expect(api.createQuiz).toHaveBeenCalledTimes(1);
    expect(onQuizCreated).toHaveBeenCalledWith("quiz-new");

    rerender({ draftKey: "quiz-new", serverDraft: undefined, settled: false, document: doc("first", newKey) });
    rerender({ draftKey: "quiz-new", serverDraft: doc("first", "quiz-new", 4), settled: true, document: doc("second", newKey) });
    expect(result.current.ready).toBe(true);
    await settle(2300);
    expect(start).toHaveBeenCalledTimes(1);
    expect(hydrate).not.toHaveBeenCalled();
    expect(api.createQuiz).toHaveBeenCalledTimes(1);
    expect(api.saveDraft).toHaveBeenLastCalledWith(expect.objectContaining({ quizId: "quiz-new", docVersion: 4 }));
    expect(titleOf((await store.get(scope, "quiz-new"))?.document)).toBe("second");
    expect(await store.get(scope, newKey)).toBeNull();

    // Back on the new-quiz page: that is a fresh quiz, not the one just created.
    rerender({ draftKey: newKey, serverDraft: undefined, settled: true, document: doc("second", newKey) });
    await settle();
    expect(start).toHaveBeenCalledTimes(2);
  });

  it("keeps an edit still in the debounce when the hook unmounts", async () => {
    const { rerender, unmount } = setup();
    await settle();
    rerender({ draftKey: "q1", serverDraft: doc("server"), settled: true, document: doc("last words") });
    unmount();
    await settle();
    const stored = await store.get(scope, "q1");
    expect(titleOf(stored?.document)).toBe("last words");
    expect(stored?.dirty).toBe(true);
    await settle(5000);
    expect(api.saveDraft).not.toHaveBeenCalled(); // a disposed engine never sends
  });

  it("writes the pending edit and sends it at once on pagehide", async () => {
    const { rerender } = setup();
    await settle();
    rerender({ draftKey: "q1", serverDraft: doc("server"), settled: true, document: doc("leaving") });
    await act(async () => { window.dispatchEvent(new Event("pagehide")); await vi.advanceTimersByTimeAsync(0); });
    expect(api.saveDraft).toHaveBeenCalledWith(expect.objectContaining({ settings: doc("leaving").settings }));
  });

  it("runs a single live engine under StrictMode", async () => {
    const { result, rerender } = setup({}, StrictMode);
    await settle();
    expect(result.current.ready).toBe(true);
    expect(hydrate).toHaveBeenCalledTimes(1);
    rerender({ draftKey: "q1", serverDraft: doc("server"), settled: true, document: doc("strict edit") });
    await settle(2300);
    expect(api.saveDraft).toHaveBeenCalledTimes(1);
    expect(titleOf((await store.get(scope, "q1"))?.document)).toBe("strict edit");
  });

  it("never forwards a re-rendered copy of the document it became ready with", async () => {
    const newKey = "new-quiz:c:all:t";
    const blank = () => doc("blank", newKey);
    const { rerender } = setup({ draftKey: newKey, serverDraft: undefined, document: blank() });
    await settle();
    for (let i = 0; i < 3; i += 1) {
      rerender({ draftKey: newKey, serverDraft: undefined, settled: true, document: blank() }); // not memoized, same JSON
      await settle(1000);
    }
    await settle(5000);
    expect(api.createQuiz).not.toHaveBeenCalled();
    expect(await store.get(scope, newKey)).toBeNull();

    rerender({ draftKey: newKey, serverDraft: undefined, settled: true, document: doc("typed", newKey) });
    await settle(300);
    expect(titleOf((await store.get(scope, newKey))?.document)).toBe("typed");
    rerender({ draftKey: newKey, serverDraft: undefined, settled: true, document: blank() }); // back to blank is an edit now
    await settle(300);
    expect(titleOf((await store.get(scope, newKey))?.document)).toBe("blank");
  });

  it("writes nothing for a key left while its engine was still starting", async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    const get = store.get.bind(store);
    store.get = async (s, key) => {
      if (key === "A") await gate;
      return get(s, key);
    };
    const { rerender } = setup({ draftKey: "A", serverDraft: doc("A", "A"), document: doc("A", "A") });
    await settle();
    rerender({ draftKey: "B", serverDraft: doc("B", "B"), settled: true, document: doc("A", "A") });
    await settle();
    release();
    await settle(5000);
    expect(await get(scope, "A")).toBeNull();
    expect(hydrate).not.toHaveBeenCalledWith(expect.objectContaining({ quizId: "A" }));
    expect(api.saveDraft).not.toHaveBeenCalled();
  });

  it("writes the pending edit and sends it when the page is hidden", async () => {
    const { rerender } = setup();
    await settle();
    rerender({ draftKey: "q1", serverDraft: doc("server"), settled: true, document: doc("hidden") });
    setVisibility("hidden");
    await act(async () => { document.dispatchEvent(new Event("visibilitychange")); await vi.advanceTimersByTimeAsync(0); });
    expect(api.saveDraft).toHaveBeenCalledWith(expect.objectContaining({ settings: doc("hidden").settings }));
  });

  it("resumes after sign-in when the page becomes visible", async () => {
    await store.put(scope, rec({ dirty: true, revision: 2, syncedRevision: 1 }));
    api.saveDraft.mockRejectedValueOnce(new ApiClientError("Unauthorized", "UNAUTHORIZED", 401));
    const { result } = setup();
    await settle();
    expect(result.current.status.kind).toBe("signed-out");
    setVisibility("visible");
    await act(async () => { document.dispatchEvent(new Event("visibilitychange")); await vi.advanceTimersByTimeAsync(0); });
    expect(api.saveDraft).toHaveBeenCalledTimes(2);
  });

  it("does not send one account's edits after another account signs in", async () => {
    await store.put(scope, rec({ dirty: true, revision: 2, syncedRevision: 1 }));
    api.saveDraft.mockRejectedValueOnce(new ApiClientError("Unauthorized", "UNAUTHORIZED", 401));
    const { result } = setup();
    await settle();
    expect(result.current.status.kind).toBe("signed-out");

    auth.accountId = "someone-else";
    await act(async () => { window.dispatchEvent(new Event("focus")); await vi.advanceTimersByTimeAsync(0); });
    setVisibility("visible");
    await act(async () => { document.dispatchEvent(new Event("visibilitychange")); await vi.advanceTimersByTimeAsync(0); });
    expect(api.saveDraft).toHaveBeenCalledTimes(1);
    expect((await store.get(scope, "q1"))?.dirty).toBe(true);
  });

  it("restarts the engine for the same key after a failed start", async () => {
    const get = store.get.bind(store);
    store.get = vi.fn(get).mockRejectedValueOnce(new Error("IndexedDB is broken"));
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { result, rerender } = setup();
    await settle();
    expect(result.current.status.kind).toBe("error");
    expect(result.current.ready).toBe(false);

    rerender({ draftKey: "q1", serverDraft: doc("server"), settled: true, document: doc("server") }); // a refetched server draft
    await settle();
    expect(result.current.ready).toBe(true);
    expect(hydrate).toHaveBeenCalledWith(doc("server"));
  });
});
