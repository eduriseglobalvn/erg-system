import { beforeEach, describe, expect, it } from "vitest";

import type { QuizEditorDraftDocument } from "@/features/lcms/quiz/quiz-editor/api/quiz-editor-api";

import { createMemoryQuizDraftDeviceStore, DeviceStorageFullError, type DeviceDraftRecord } from "./quiz-draft-device-store";
import {
  chooseInitialDocument,
  createBlankDraft,
  migrateLegacyLocalDrafts,
  newQuizDraftKey,
} from "./quiz-draft-initial-document";

const serverDoc = (docVersion: number, quizId = "q1") =>
  ({ quizId, draftId: "d1", docVersion, settings: { info: { title: "S" } }, playerTemplate: {}, tree: [] }) as unknown as QuizEditorDraftDocument;
const rec = (over: Partial<DeviceDraftRecord> = {}): DeviceDraftRecord => ({
  key: "q1", quizId: "q1", createIdempotencyKey: "k", baseDocVersion: 3, document: serverDoc(3), dirty: false,
  revision: 1, syncedRevision: 1, editedAt: "2026-11-01T00:00:00.000Z", syncedAt: "2026-11-01T00:00:00.000Z", writerId: "tab-1", ...over,
});
const legacyKey = (key: string) => `erg:quiz-editor:recovery:v1:tenant-1:${encodeURIComponent(key)}`;
const putLegacy = (key: string, savedAt: string, payload: QuizEditorDraftDocument) =>
  localStorage.setItem(legacyKey(key), JSON.stringify({ savedAt, payload }));

describe("chooseInitialDocument", () => {
  it("prefers a dirty device copy over the server draft", () => {
    expect(chooseInitialDocument(rec({ dirty: true }), serverDoc(5)).source).toBe("device");
  });
  it("prefers the server draft when the device copy is clean", () => {
    expect(chooseInitialDocument(rec({ dirty: false }), serverDoc(5)).source).toBe("server");
  });
  it("uses the device copy when there is no server draft yet (new quiz)", () => {
    expect(chooseInitialDocument(rec({ quizId: null, dirty: true }), undefined).source).toBe("device");
  });
  it("returns none when nothing exists", () => {
    expect(chooseInitialDocument(null, undefined)).toEqual({ document: null, source: "none" });
  });
});

describe("newQuizDraftKey", () => {
  it("includes the topic so two topics never share a draft", () => {
    expect(newQuizDraftKey("c", "l", "t1")).not.toBe(newQuizDraftKey("c", "l", "t2"));
    expect(newQuizDraftKey("c", null, "all")).toBe("new-quiz:c:all:all");
  });
});

describe("createBlankDraft", () => {
  it("starts at docVersion 0 with the given ids", () => {
    expect(createBlankDraft("q", "local-q")).toMatchObject({ quizId: "q", draftId: "local-q", docVersion: 0 });
  });
});

describe("migrateLegacyLocalDrafts", () => {
  beforeEach(() => localStorage.clear());

  it("migrates legacy localStorage drafts as dirty, then deletes the legacy key", async () => {
    putLegacy("q9", "2026-10-01T00:00:00.000Z", serverDoc(2, "q9"));
    const s = createMemoryQuizDraftDeviceStore();
    expect(await migrateLegacyLocalDrafts(s, "tenant-1:a", "tenant-1", "tab-1")).toBe(1);
    expect(await s.get("tenant-1:a", "q9")).toMatchObject({
      dirty: true, quizId: "q9", baseDocVersion: 2, revision: 1, syncedRevision: 0, syncedAt: null, writerId: "tab-1",
      editedAt: "2026-10-01T00:00:00.000Z",
    });
    expect(localStorage.getItem(legacyKey("q9"))).toBeNull();
  });

  it("keeps drafts older than 7 days (they may never have been sent)", async () => {
    putLegacy("q9", "2026-01-01T00:00:00.000Z", serverDoc(2, "q9"));
    const s = createMemoryQuizDraftDeviceStore();
    expect(await migrateLegacyLocalDrafts(s, "tenant-1:a", "tenant-1", "tab-1")).toBe(1);
    expect((await s.get("tenant-1:a", "q9"))?.dirty).toBe(true);
  });

  it("treats new-quiz keys as not created yet", async () => {
    putLegacy("new-quiz:c:all", "2026-10-01T00:00:00.000Z", serverDoc(0, "new-quiz:c:all"));
    const s = createMemoryQuizDraftDeviceStore();
    await migrateLegacyLocalDrafts(s, "tenant-1:a", "tenant-1", "tab-1");
    expect(await s.get("tenant-1:a", "new-quiz:c:all")).toMatchObject({ quizId: null, key: "new-quiz:c:all" });
  });

  it("keeps a newer store copy and only removes the legacy key", async () => {
    putLegacy("q9", "2026-10-01T00:00:00.000Z", serverDoc(2, "q9"));
    const s = createMemoryQuizDraftDeviceStore();
    await s.put("tenant-1:a", rec({ key: "q9", quizId: "q9", editedAt: "2026-10-02T00:00:00.000Z" }));
    expect(await migrateLegacyLocalDrafts(s, "tenant-1:a", "tenant-1", "tab-1")).toBe(0);
    expect((await s.get("tenant-1:a", "q9"))?.baseDocVersion).toBe(3);
    expect(localStorage.getItem(legacyKey("q9"))).toBeNull();
  });

  it("skips unreadable and mock drafts, and leaves other tenants alone", async () => {
    localStorage.setItem(legacyKey("bad"), "{not json");
    const mock = serverDoc(1, "m");
    mock.tree = [{ slides: [{ id: "slide-matching" }] }] as unknown as QuizEditorDraftDocument["tree"];
    putLegacy("m", "2026-10-01T00:00:00.000Z", mock);
    localStorage.setItem("erg:quiz-editor:recovery:v1:tenant-2:x", JSON.stringify({ savedAt: "2026-10-01T00:00:00.000Z", payload: serverDoc(1, "x") }));
    const s = createMemoryQuizDraftDeviceStore();
    expect(await migrateLegacyLocalDrafts(s, "tenant-1:a", "tenant-1", "tab-1")).toBe(0);
    expect(await s.list("tenant-1:a")).toEqual([]);
    expect(localStorage.getItem("erg:quiz-editor:recovery:v1:tenant-2:x")).not.toBeNull();
  });

  it("returns 0 when the storage accessor throws", async () => {
    const broken = { get length(): number { throw new DOMException("blocked", "SecurityError"); } } as unknown as Storage;
    expect(await migrateLegacyLocalDrafts(createMemoryQuizDraftDeviceStore(), "s", "tenant-1", "w", broken)).toBe(0);
  });

  it("keeps the legacy key and rethrows when the device is full", async () => {
    putLegacy("q9", "2026-10-01T00:00:00.000Z", serverDoc(2, "q9"));
    const s = createMemoryQuizDraftDeviceStore();
    s.put = async () => {
      throw new DeviceStorageFullError("full");
    };
    await expect(migrateLegacyLocalDrafts(s, "tenant-1:a", "tenant-1", "tab-1")).rejects.toBeInstanceOf(DeviceStorageFullError);
    expect(localStorage.getItem(legacyKey("q9"))).not.toBeNull();
  });

  it("skips a malformed key, leaves it in place and still migrates the rest", async () => {
    localStorage.setItem("erg:quiz-editor:recovery:v1:tenant-1:%E0%A4%A", "x");
    putLegacy("q9", "2026-10-01T00:00:00.000Z", serverDoc(2, "q9"));
    const s = createMemoryQuizDraftDeviceStore();
    expect(await migrateLegacyLocalDrafts(s, "tenant-1:a", "tenant-1", "tab-1")).toBe(1);
    expect(localStorage.getItem("erg:quiz-editor:recovery:v1:tenant-1:%E0%A4%A")).toBe("x");
  });

  it("does not migrate the default-quiz-draft placeholder", async () => {
    putLegacy("default-quiz-draft", "2026-10-01T00:00:00.000Z", serverDoc(1, "default-quiz-draft"));
    const s = createMemoryQuizDraftDeviceStore();
    expect(await migrateLegacyLocalDrafts(s, "tenant-1:a", "tenant-1", "tab-1")).toBe(0);
    expect(await s.list("tenant-1:a")).toEqual([]);
    expect(localStorage.getItem(legacyKey("default-quiz-draft"))).toBeNull();
  });

  it("replaces a store copy whose editedAt is unparseable", async () => {
    putLegacy("q9", "2026-10-01T00:00:00.000Z", serverDoc(2, "q9"));
    const s = createMemoryQuizDraftDeviceStore();
    await s.put("tenant-1:a", rec({ key: "q9", quizId: "q9", editedAt: "garbage" }));
    expect(await migrateLegacyLocalDrafts(s, "tenant-1:a", "tenant-1", "tab-1")).toBe(1);
    expect((await s.get("tenant-1:a", "q9"))?.baseDocVersion).toBe(2);
  });
});
