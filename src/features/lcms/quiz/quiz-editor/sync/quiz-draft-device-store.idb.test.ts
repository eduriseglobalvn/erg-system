import { beforeEach, describe, expect, it, vi } from "vitest";

import type { QuizEditorDraftDocument } from "@/features/lcms/quiz/quiz-editor/api/quiz-editor-api";

const fake = vi.hoisted(() => ({
  data: new Map<string, unknown>(),
  setError: null as unknown,
  afterKeys: null as null | (() => void),
}));

vi.mock("idb-keyval", () => ({
  createStore: () => (_mode: string, cb: (os: unknown) => Promise<void>) => {
    const transaction: { oncomplete?: () => void; onerror?: () => void; onabort?: () => void; error?: unknown } = {};
    const os = {
      transaction,
      get(k: string) {
        const req: { result: unknown; onsuccess?: () => void } = { result: fake.data.get(k) };
        queueMicrotask(() => req.onsuccess?.());
        return req;
      },
      delete(k: string) {
        fake.data.delete(k);
      },
    };
    const result = cb(os);
    setTimeout(() => transaction.oncomplete?.(), 0);
    return result;
  },
  get: async (k: string) => fake.data.get(k),
  set: async (k: string, v: unknown) => {
    if (fake.setError) throw fake.setError;
    fake.data.set(k, structuredClone(v));
  },
  del: async (k: string) => void fake.data.delete(k),
  keys: async () => {
    const all = [...fake.data.keys()];
    fake.afterKeys?.();
    return all;
  },
}));

import { createQuizDraftDeviceStore, DeviceStorageFullError, type DeviceDraftRecord } from "./quiz-draft-device-store";

const doc = { quizId: "q1", docVersion: 3, settings: { info: { title: "A" } }, tree: [] } as unknown as QuizEditorDraftDocument;
const rec = (over: Partial<DeviceDraftRecord> = {}): DeviceDraftRecord => ({
  key: "q1", quizId: "q1", createIdempotencyKey: "k", baseDocVersion: 3, document: doc, dirty: false,
  revision: 1, syncedRevision: 1, editedAt: "2026-11-01T00:00:00.000Z", syncedAt: "2026-11-01T00:00:00.000Z", writerId: "tab-1", ...over,
});

describe("idb quiz draft device store", () => {
  beforeEach(() => {
    fake.data.clear();
    fake.setError = null;
    fake.afterKeys = null;
    vi.stubGlobal("indexedDB", {});
  });

  it("is persistent when indexedDB exists", () => {
    expect(createQuizDraftDeviceStore().persistent).toBe(true);
  });

  it.each(["QuotaExceededError", "NS_ERROR_DOM_QUOTA_REACHED"])("maps %s to DeviceStorageFullError", async (name) => {
    fake.setError = new DOMException("", name);
    await expect(createQuizDraftDeviceStore().put("t:a", rec())).rejects.toBeInstanceOf(DeviceStorageFullError);
  });

  it("rethrows other errors untouched", async () => {
    fake.setError = new Error("boom");
    await expect(createQuizDraftDeviceStore().put("t:a", rec())).rejects.toThrow("boom");
  });

  it("filters by exact scope and key", async () => {
    const s = createQuizDraftDeviceStore();
    await s.put("t:a", rec({ key: "q1" }));
    await s.put("t:ab", rec({ key: "q2" }));
    await s.put("t:a", rec({ key: "q10" }));
    expect((await s.list("t:a")).map((r) => r.key).sort()).toEqual(["q1", "q10"]);
    const backup = (key: string) => ({ key, reason: "other-tab" as const, document: doc, createdAt: "2026-10-20T00:00:00.000Z" });
    await s.addBackup("t:a", backup("q1"));
    await s.addBackup("t:a", backup("q10"));
    expect(await s.listBackups("t:a", "q1")).toHaveLength(1);
  });

  it("prune removes stale clean drafts and old backups but not dirty drafts", async () => {
    const s = createQuizDraftDeviceStore();
    await s.put("t:a", rec({ key: "clean" }));
    await s.put("t:a", rec({ key: "dirty", dirty: true }));
    await s.addBackup("t:a", { key: "clean", reason: "conflict-mine", document: doc, createdAt: "2026-09-01T00:00:00.000Z" });
    await s.prune("t:a", new Date("2026-11-09T00:00:01.000Z"));
    expect(await s.get("t:a", "clean")).toBeNull();
    expect(await s.get("t:a", "dirty")).not.toBeNull();
    expect(await s.listBackups("t:a", "clean")).toEqual([]);
  });

  it("prune keeps a draft that another tab made dirty after the key scan", async () => {
    const s = createQuizDraftDeviceStore();
    await s.put("t:a", rec({ key: "q1" }));
    fake.afterKeys = () => {
      fake.data.set("t:a|draft|q1", rec({ key: "q1", dirty: true }));
      fake.afterKeys = null;
    };
    await s.prune("t:a", new Date("2026-11-09T00:00:01.000Z"));
    expect(await s.get("t:a", "q1")).not.toBeNull();
  });
});
