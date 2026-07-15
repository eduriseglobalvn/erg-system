import { describe, expect, test, beforeEach } from "vitest";

import { localQuizAttemptStore } from "@/features/lcms/quiz/quiz-runtime/api/local-quiz-attempt-store";
import type { LocalQuizAttemptSession } from "@/features/lcms/quiz/quiz-runtime/types/quiz-runtime-types";

const SESSION_KEY = "erg:local-quiz-attempt:v1:assignment-1:quiz-1";

describe("localQuizAttemptStore bookmarks", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  test("creates sessions with an empty bookmark list", async () => {
    const session = await localQuizAttemptStore.createSession({
      assignmentId: "assignment-1",
      attemptId: "attempt-1",
      packageHash: "hash-1",
      quizId: "quiz-1",
      quizVersion: "v1",
      submitIdempotencyKey: "submit-1",
    });

    expect(session.bookmarkedQuestionIds).toEqual([]);
  });

  test("persists bookmark toggles across reloads", async () => {
    const session = await localQuizAttemptStore.createSession({
      assignmentId: "assignment-1",
      attemptId: "attempt-1",
      packageHash: "hash-1",
      quizId: "quiz-1",
      quizVersion: "v1",
      submitIdempotencyKey: "submit-1",
    });

    const bookmarked = await localQuizAttemptStore.toggleBookmark(session, "question-2");
    const restored = await localQuizAttemptStore.getSession("assignment-1", "quiz-1");

    expect(bookmarked.bookmarkedQuestionIds).toEqual(["question-2"]);
    expect(restored?.bookmarkedQuestionIds).toEqual(["question-2"]);
  });

  test("keeps local attempt sessions separated by tenant portal and account", async () => {
    const studentA = await localQuizAttemptStore.createSession({
      accountId: "student-a",
      assignmentId: "assignment-1",
      attemptId: "attempt-a",
      packageHash: "hash-1",
      portal: "elearning",
      quizId: "quiz-1",
      quizVersion: "v1",
      submitIdempotencyKey: "submit-a",
      tenantId: "tenant-a",
    });
    const studentB = await localQuizAttemptStore.createSession({
      accountId: "student-b",
      assignmentId: "assignment-1",
      attemptId: "attempt-b",
      packageHash: "hash-1",
      portal: "elearning",
      quizId: "quiz-1",
      quizVersion: "v1",
      submitIdempotencyKey: "submit-b",
      tenantId: "tenant-a",
    });

    await localQuizAttemptStore.saveAnswer(studentA, "question-1", { choiceId: "a" });
    await localQuizAttemptStore.saveAnswer(studentB, "question-1", { choiceId: "b" });

    const restoredA = await localQuizAttemptStore.getSession("assignment-1", "quiz-1", {
      accountId: "student-a",
      portal: "elearning",
      tenantId: "tenant-a",
    });
    const restoredB = await localQuizAttemptStore.getSession("assignment-1", "quiz-1", {
      accountId: "student-b",
      portal: "elearning",
      tenantId: "tenant-a",
    });

    expect(restoredA?.attemptId).toBe("attempt-a");
    expect(restoredA?.answers["question-1"]).toEqual({ choiceId: "a" });
    expect(restoredB?.attemptId).toBe("attempt-b");
    expect(restoredB?.answers["question-1"]).toEqual({ choiceId: "b" });
  });

  test("defaults legacy stored sessions to an empty bookmark list", async () => {
    const legacySession = {
      version: 1,
      attemptId: "attempt-1",
      assignmentId: "assignment-1",
      quizId: "quiz-1",
      packageHash: "hash-1",
      quizVersion: "v1",
      startedAt: "2026-05-18T00:00:00.000Z",
      updatedAt: "2026-05-18T00:00:00.000Z",
      status: "in_progress",
      answers: {},
      clientEvents: [],
      submitIdempotencyKey: "submit-1",
    } satisfies Omit<LocalQuizAttemptSession, "bookmarkedQuestionIds"> & { version: number };

    window.localStorage.setItem(SESSION_KEY, JSON.stringify(legacySession));

    const restored = await localQuizAttemptStore.getSession("assignment-1", "quiz-1");

    expect(restored?.bookmarkedQuestionIds).toEqual([]);
  });
});
