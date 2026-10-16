import { describe, expect, test } from "vitest";

import { createQuizPackage } from "@/lib/assessment-engine";
import {
  MemoryScopedJsonStore,
  OfflineQuizSnapshotStore,
} from "@/features/lcms/quiz/quiz-runtime/api/offline-quiz-snapshot-store";
import type { Quiz } from "@/lib/types";

const quiz: Quiz = {
  id: "quiz-a",
  title: "Offline quiz",
  subtitle: "",
  version: "v3",
  description: "",
  themeId: "erg-default",
  theme: {
    pageBackground: "#fff",
    playerBackground: "#fff",
    canvasBorder: "#ddd",
    headerBackground: "#fff",
    headerText: "#111",
    accentStart: "#111",
    accentEnd: "#222",
    optionText: "#111",
    optionSelectedBackground: "#eee",
    inputBackground: "#fff",
    sidebarActiveBackground: "#eee",
    sidebarActiveText: "#111",
  },
  settings: { mode: "testing", passPercent: 50, shuffleQuestions: false, shuffleChoices: false, revealFeedbackPerStep: false },
  sections: [{
    id: "section-a",
    title: "Section",
    questions: [{
      id: "question-a",
      kind: "single_choice",
      title: "Question",
      points: 1,
      feedback: { correct: "", incorrect: "", partial: "" },
      choices: [{ id: "a", label: "A", correct: false }],
    }],
  }],
};

const scope = { tenantId: "tenant-a", accountId: "student-a", workspace: "STUDENT" } as const;
const capability = {
  status: "ready" as const,
  snapshot: Object.freeze({
    scope,
    assignmentId: "assignment-a",
    quizId: "quiz-a",
    attemptId: "attempt-a",
    packageId: "package-a",
    packageHash: "hash-a",
    quizVersion: "v3",
    serverTimeAtStart: "2026-08-09T08:00:00.000Z",
    deadlineAt: "2026-08-09T09:00:00.000Z",
    serverClockOffsetMs: 0,
  }),
};

describe("offline quiz snapshot store", () => {
  test("stores only an approved server-authoritative package and rejects answer material", async () => {
    const store = new OfflineQuizSnapshotStore(new MemoryScopedJsonStore());
    const packageValue = createQuizPackage(quiz, { gradingMode: "server-authoritative", source: "server" });
    const approvedCapability = {
      ...capability,
      snapshot: Object.freeze({ ...capability.snapshot, packageHash: packageValue.contentHash }),
    };

    await expect(store.save({ scope, capability: approvedCapability, quizPackage: packageValue })).resolves.toMatchObject({ status: "stored" });
    expect(await store.get({ scope, assignmentId: "assignment-a", quizId: "quiz-a", attemptId: "attempt-a", nowMs: Date.parse("2026-08-09T08:30:00.000Z") })).toMatchObject({ packageHash: packageValue.contentHash });

    const unsafePackage = createQuizPackage(quiz, { gradingMode: "client-first", source: "server" });
    await expect(store.save({ scope, capability: approvedCapability, quizPackage: unsafePackage })).rejects.toMatchObject({ code: "SNAPSHOT_MISMATCH" });
  });

  test("does not cross tenant/account/attempt scope and expires from the server deadline", async () => {
    const store = new OfflineQuizSnapshotStore(new MemoryScopedJsonStore());
    const packageValue = createQuizPackage(quiz, { gradingMode: "server-authoritative", source: "server" });
    const approvedCapability = {
      ...capability,
      snapshot: Object.freeze({ ...capability.snapshot, packageHash: packageValue.contentHash }),
    };
    await store.save({ scope, capability: approvedCapability, quizPackage: packageValue });

    expect(await store.get({ scope: { ...scope, accountId: "student-b" }, assignmentId: "assignment-a", quizId: "quiz-a", attemptId: "attempt-a", nowMs: Date.parse("2026-08-09T08:30:00.000Z") })).toBeNull();
    expect(await store.get({ scope, assignmentId: "assignment-a", quizId: "quiz-a", attemptId: "attempt-a", nowMs: Date.parse("2026-08-09T09:00:01.000Z") })).toBeNull();
  });
});
