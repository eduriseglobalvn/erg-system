import { describe, expect, it } from "vitest";

import type { QuizEditorDraftDocument } from "@/features/lcms/quiz/quiz-editor/api/quiz-editor-api";

import {
  createMemoryQuizDraftDeviceStore,
  quizDraftScope,
  type DeviceDraftRecord,
} from "./quiz-draft-device-store";

const doc = (title: string) =>
  ({ quizId: "q1", draftId: "d1", docVersion: 3, settings: { info: { title } }, playerTemplate: {}, tree: [] }) as unknown as QuizEditorDraftDocument;
const rec = (over: Partial<DeviceDraftRecord> = {}): DeviceDraftRecord => ({
  key: "q1", quizId: "q1", createIdempotencyKey: "k", baseDocVersion: 3, document: doc("A"), dirty: false,
  revision: 1, syncedRevision: 1, editedAt: "2026-11-01T00:00:00.000Z", syncedAt: "2026-11-01T00:00:00.000Z", writerId: "tab-1", ...over,
});

describe("memory quiz draft device store", () => {
  it("keeps scopes apart", async () => {
    const s = createMemoryQuizDraftDeviceStore();
    await s.put("t:a", rec());
    expect(await s.get("t:b", "q1")).toBeNull();
    expect((await s.get("t:a", "q1"))?.document.settings.info.title).toBe("A");
    expect(await s.list("t:b")).toEqual([]);
    expect(s.persistent).toBe(false);
  });

  it("stores copies, not references", async () => {
    const s = createMemoryQuizDraftDeviceStore();
    const r = rec();
    await s.put("t:a", r);
    r.document.settings.info.title = "changed";
    expect((await s.get("t:a", "q1"))?.document.settings.info.title).toBe("A");
  });

  it("removes a draft", async () => {
    const s = createMemoryQuizDraftDeviceStore();
    await s.put("t:a", rec());
    await s.remove("t:a", "q1");
    expect(await s.get("t:a", "q1")).toBeNull();
  });

  it("prune removes synced drafts older than 7 days but never dirty ones", async () => {
    const s = createMemoryQuizDraftDeviceStore();
    await s.put("t:a", rec({ key: "old-clean" }));
    await s.put("t:a", rec({ key: "old-dirty", dirty: true }));
    await s.prune("t:a", new Date("2026-11-09T00:00:01.000Z"));
    expect(await s.get("t:a", "old-clean")).toBeNull();
    expect(await s.get("t:a", "old-dirty")).not.toBeNull();
  });

  it("prune removes backups older than 30 days", async () => {
    const s = createMemoryQuizDraftDeviceStore();
    await s.addBackup("t:a", { key: "q1", reason: "conflict-mine", document: doc("old"), createdAt: "2026-10-01T00:00:00.000Z" });
    await s.addBackup("t:a", { key: "q1", reason: "other-tab", document: doc("new"), createdAt: "2026-10-15T00:00:00.000Z" });
    await s.prune("t:a", new Date("2026-11-01T00:00:00.000Z"));
    const left = await s.listBackups("t:a", "q1");
    expect(left.map((b) => b.createdAt)).toEqual(["2026-10-15T00:00:00.000Z"]);
  });
});

describe("quizDraftScope", () => {
  it("combines tenant and account", () => {
    expect(quizDraftScope("t1", "a1")).toBe("t1:a1");
    expect(quizDraftScope("t1", undefined)).toBe("t1:anonymous");
  });
});
