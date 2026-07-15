import { beforeEach, expect, test, vi } from "vitest";

import { createQuizPackage } from "@/lib/assessment-engine";
import { apiRequest } from "@/lib/api-client";
import { sampleQuiz } from "@/lib/sample-quiz";
import {
  buildClientSubmitPayload,
  getQuizPackage,
  prepareQuizPackageForAttempt,
  saveAttemptAnswer,
  saveAttemptDraft,
  startAttempt,
  syncAttempt,
  submitFinalAttempt,
} from "@/features/lcms/quiz/quiz-runtime/api/quiz-runtime-api";

vi.mock("@/lib/api-client", () => {
  return {
    apiRequest: vi.fn(),
    hasApiBase: () => true,
  };
});

const apiRequestMock = vi.mocked(apiRequest);

beforeEach(() => {
  apiRequestMock.mockReset();
});

test("loads quiz packages with the elearning student portal session", async () => {
  const quizPackage = createQuizPackage(sampleQuiz, {
    gradingMode: "server-authoritative",
    source: "server",
  });
  apiRequestMock.mockResolvedValueOnce(quizPackage as never);

  await getQuizPackage(sampleQuiz.id);

  expect(apiRequestMock).toHaveBeenCalledWith(`/api/v1/lms/quizzes/${sampleQuiz.id}/package`, {
    cache: "default",
    portal: "elearning",
  });
});

test("can load quiz packages with the LMS teacher portal session", async () => {
  const quizPackage = createQuizPackage(sampleQuiz, {
    gradingMode: "server-authoritative",
    source: "server",
  });
  apiRequestMock.mockResolvedValueOnce(quizPackage as never);

  await getQuizPackage(sampleQuiz.id, "lms");

  expect(apiRequestMock).toHaveBeenCalledWith(`/api/v1/lms/quizzes/${sampleQuiz.id}/package`, {
    cache: "default",
    portal: "lms",
  });
});

test("reuses the normalized runtime package if a revalidation exposes an empty 304 body", async () => {
  const quizPackage = createQuizPackage(sampleQuiz, {
    gradingMode: "server-authoritative",
    source: "server",
  });
  apiRequestMock.mockResolvedValueOnce(quizPackage as never);
  apiRequestMock.mockResolvedValueOnce(undefined as never);

  const firstLoad = await getQuizPackage(sampleQuiz.id);
  const revalidatedLoad = await getQuizPackage(sampleQuiz.id);

  expect(revalidatedLoad).toBe(firstLoad);
});

test("does not reuse normalized runtime packages across tenants", async () => {
  const quizPackage = createQuizPackage(sampleQuiz, {
    gradingMode: "server-authoritative",
    source: "server",
  });
  apiRequestMock.mockResolvedValueOnce(quizPackage as never);
  apiRequestMock.mockResolvedValueOnce(undefined as never);

  await getQuizPackage(sampleQuiz.id, "elearning", "tenant-a");

  await expect(getQuizPackage(sampleQuiz.id, "elearning", "tenant-b")).rejects.toThrow(
    "Quiz package returned no body and no cached package is available.",
  );
});

test("does not fall back to local quiz when API package loading fails", async () => {
  const error = new Error("Request failed: 500");
  apiRequestMock.mockRejectedValueOnce(error);

  await expect(getQuizPackage(sampleQuiz.id)).rejects.toBe(error);
});

test("normalizes published backend quiz detail and merges client answer key", async () => {
  apiRequestMock.mockResolvedValueOnce({
    version: 3,
    contentHash: "hash-1",
    packageHash: "hash-1",
    gradingMode: "client-first",
    answerKey: {
      q1: { correctChoiceId: "a" },
    },
    quiz: {
      quiz: { id: "quiz-1", title: "Demo", version: 3, kind: "train" },
      slides: [
        {
          id: "section-1",
          title: "Section",
          questions: [
            {
              id: "q1",
              kind: "single_choice",
              title: "Question",
              points: 1,
              choices: [
                { id: "a", label: "A" },
                { id: "b", label: "B" },
              ],
            },
          ],
        },
      ],
      settings: { settings: { mode: "training", passPercent: 80 } },
      result: {},
      theme: {},
    },
  } as never);

  const quizPackage = await getQuizPackage("quiz-1");

  expect(quizPackage.quiz.sections[0]?.questions[0]?.choices?.[0]).toMatchObject({
    id: "a",
    correct: true,
  });
  expect(quizPackage.quiz.settings.mode).toBe("training");
  expect(quizPackage.quiz.settings.passPercent).toBe(80);
});

test("prepares per-attempt shuffle without changing the canonical package hash", () => {
  const canonicalPackage = createQuizPackage({
    ...sampleQuiz,
    settings: {
      ...sampleQuiz.settings,
      mode: "testing",
      shuffleChoices: false,
      shuffleQuestions: false,
    },
  });

  const attemptA = prepareQuizPackageForAttempt(canonicalPackage, "student-a");
  const attemptB = prepareQuizPackageForAttempt(canonicalPackage, "student-b");

  expect(attemptA.contentHash).toBe(canonicalPackage.contentHash);
  expect(attemptA.quiz.settings.shuffleQuestions).toBe(true);
  expect(attemptA.quiz.settings.shuffleChoices).toBe(true);
  expect(attemptA.quiz.sections).not.toEqual(attemptB.quiz.sections);
});

test("keeps training attempts in canonical order even when authoring settings request shuffle", () => {
  const canonicalPackage = createQuizPackage({
    ...sampleQuiz,
    settings: {
      ...sampleQuiz.settings,
      mode: "training",
      shuffleChoices: true,
      shuffleQuestions: true,
    },
  });

  const attemptA = prepareQuizPackageForAttempt(canonicalPackage, "student-a");
  const attemptB = prepareQuizPackageForAttempt(canonicalPackage, "student-b");

  expect(attemptA.contentHash).toBe(canonicalPackage.contentHash);
  expect(attemptA.quiz.settings.shuffleQuestions).toBe(false);
  expect(attemptA.quiz.settings.shuffleChoices).toBe(false);
  expect(attemptA.quiz.sections).toEqual(canonicalPackage.quiz.sections);
  expect(attemptA.quiz.sections).toEqual(attemptB.quiz.sections);
});

test("starts quiz attempts with the elearning student portal session", async () => {
  apiRequestMock.mockResolvedValueOnce({ attemptId: "attempt-server-1" } as never);

  await startAttempt({
    assignmentId: "assignment-1",
    idempotencyKey: "start-key-1",
    localAttemptId: "attempt-local-1",
    packageHash: "hash-1",
    packageId: "package-1",
    quizId: sampleQuiz.id,
  });

  expect(apiRequestMock).toHaveBeenCalledWith(
    "/api/v1/lms/attempts",
    expect.objectContaining({
      portal: "elearning",
      method: "POST",
    }),
  );
});

test("does not create a local server-start marker when API start attempt fails", async () => {
  const error = new Error("Request failed: 500");
  apiRequestMock.mockRejectedValueOnce(error);

  await expect(
    startAttempt({
      assignmentId: "assignment-1",
      idempotencyKey: "start-key-1",
      localAttemptId: "attempt-local-1",
      packageHash: "hash-1",
      packageId: "package-1",
      quizId: sampleQuiz.id,
    }),
  ).rejects.toBe(error);
});

test("does not mark a local attempt as server-started when API start response has no attempt id", async () => {
  apiRequestMock.mockResolvedValueOnce({} as never);

  await expect(
    startAttempt({
      assignmentId: "assignment-1",
      idempotencyKey: "start-key-1",
      localAttemptId: "attempt-local-1",
      packageHash: "hash-1",
      packageId: "package-1",
      quizId: sampleQuiz.id,
    }),
  ).rejects.toThrow("Start attempt response is missing attemptId.");
});

test("submits final quiz attempts with the elearning student portal session", async () => {
  const quizPackage = createQuizPackage(sampleQuiz);
  const payload = buildClientSubmitPayload({
    answers: {},
    attemptId: "attempt-1",
    clientEvents: [],
    quizPackage,
    startedAt: "2026-06-19T01:00:00.000Z",
    submittedAt: "2026-06-19T01:05:00.000Z",
  });
  apiRequestMock.mockResolvedValueOnce({
    answers: {},
    id: "attempt-1",
    maxScore: 10,
    passed: false,
    percent: 0,
    quizId: sampleQuiz.id,
    submittedCount: 0,
    totalQuestions: 10,
    totalScore: 0,
  } as never);

  await submitFinalAttempt({
    attemptId: "attempt-1",
    idempotencyKey: "submit-key-1",
    payload,
    quiz: sampleQuiz,
    quizPackage,
  });

  expect(apiRequestMock).toHaveBeenCalledWith(
    "/api/v1/lms/attempts/attempt-1/submit",
    expect.objectContaining({
      portal: "elearning",
      method: "POST",
    }),
  );
});

test("normalizes the backend aggregate submit response without local grading", async () => {
  const quizPackage = createQuizPackage(sampleQuiz);
  const payload = buildClientSubmitPayload({
    answers: {},
    attemptId: "attempt-1",
    clientEvents: [],
    quizPackage,
    startedAt: "2026-06-19T01:00:00.000Z",
    submittedAt: "2026-06-19T01:05:00.000Z",
  });
  apiRequestMock.mockResolvedValueOnce({
    score: 7,
    maxScore: 10,
    percent: 70,
    passed: true,
  } as never);

  const attempt = await submitFinalAttempt({
    attemptId: "attempt-1",
    idempotencyKey: "submit-key-1",
    payload,
    quiz: sampleQuiz,
    quizPackage,
  });

  expect(attempt).toMatchObject({
    id: "attempt-1",
    quizId: sampleQuiz.id,
    totalScore: 7,
    maxScore: 10,
    percent: 70,
    passed: true,
  });
});

test("keeps backend aggregate submit score instead of replacing it with local grading", async () => {
  const quizPackage = createQuizPackage(sampleQuiz);
  const payload = buildClientSubmitPayload({
    answers: {},
    attemptId: "attempt-1",
    clientEvents: [],
    quizPackage,
    startedAt: "2026-06-19T01:00:00.000Z",
    submittedAt: "2026-06-19T01:05:00.000Z",
  });
  apiRequestMock.mockResolvedValueOnce({
    score: 3,
    maxScore: 10,
    percent: 30,
    passed: false,
  } as never);

  const attempt = await submitFinalAttempt({
    attemptId: "attempt-1",
    idempotencyKey: "submit-key-1",
    payload,
    quiz: sampleQuiz,
    quizPackage,
  });

  expect(attempt.totalScore).toBe(3);
  expect(attempt.percent).toBe(30);
  expect(attempt.passed).toBe(false);
});

test("does not locally grade final submit when API submit fails", async () => {
  const quizPackage = createQuizPackage(sampleQuiz);
  const payload = buildClientSubmitPayload({
    answers: {},
    attemptId: "attempt-1",
    clientEvents: [],
    quizPackage,
    startedAt: "2026-06-19T01:00:00.000Z",
    submittedAt: "2026-06-19T01:05:00.000Z",
  });
  const error = new Error("Request failed: 500");
  apiRequestMock.mockRejectedValueOnce(error);

  await expect(
    submitFinalAttempt({
      attemptId: "attempt-1",
      idempotencyKey: "submit-key-1",
      payload,
      quiz: sampleQuiz,
      quizPackage,
    }),
  ).rejects.toBe(error);
});

test("does not locally grade final submit when API submit response has an invalid shape", async () => {
  const quizPackage = createQuizPackage(sampleQuiz);
  const payload = buildClientSubmitPayload({
    answers: {},
    attemptId: "attempt-1",
    clientEvents: [],
    quizPackage,
    startedAt: "2026-06-19T01:00:00.000Z",
    submittedAt: "2026-06-19T01:05:00.000Z",
  });
  apiRequestMock.mockResolvedValueOnce({ status: "submitted" } as never);

  await expect(
    submitFinalAttempt({
      attemptId: "attempt-1",
      idempotencyKey: "submit-key-1",
      payload,
      quiz: sampleQuiz,
      quizPackage,
    }),
  ).rejects.toThrow("Submit attempt response is missing a valid attempt result.");
});

test("saves runtime draft snapshots through the BE draft endpoint", async () => {
  apiRequestMock.mockResolvedValueOnce({
    answers: {},
    assignmentId: "assignment-1",
    id: "attempt-1",
    packageHash: "hash-1",
    score: 0,
    status: "in_progress",
    maxScore: 0,
    passed: false,
    percent: 0,
    quizId: sampleQuiz.id,
  } as never);

  await saveAttemptDraft({
    attemptId: "attempt-1",
    payload: {
      answers: {
        q1: { choiceId: "a" },
      },
      events: [{ id: "evt-1", type: "answer_changed" }],
      packageHash: "hash-1",
      quizVersion: "v1",
    },
  });

  expect(apiRequestMock).toHaveBeenCalledWith(
    "/api/v1/lms/attempts/attempt-1/draft",
    expect.objectContaining({
      method: "PATCH",
      portal: "elearning",
      body: JSON.stringify({
        answers: {
          q1: { choiceId: "a" },
        },
        events: [{ id: "evt-1", type: "answer_changed" }],
        packageHash: "hash-1",
        quizVersion: "v1",
      }),
    }),
  );
});

test("fails runtime draft save when BE does not return an attempt", async () => {
  apiRequestMock.mockResolvedValueOnce({ saved: true } as never);

  await expect(
    saveAttemptDraft({
      attemptId: "attempt-1",
      payload: { answers: {} },
    }),
  ).rejects.toThrow("Save draft response is missing a valid server attempt.");
});

test("saves a single training answer through the BE answer endpoint", async () => {
  apiRequestMock.mockResolvedValueOnce({
    attemptId: "attempt-1",
    questionId: "q1",
    saved: true,
  } as never);

  await saveAttemptAnswer({
    attemptId: "attempt-1",
    questionId: "q1",
    payload: {
      answer: { choiceId: "a" },
      answeredAt: "2026-07-08T01:00:00.000Z",
      clientResult: { awardedPoints: 1 },
    },
  });

  expect(apiRequestMock).toHaveBeenCalledWith(
    "/api/v1/lms/attempts/attempt-1/answers/q1",
    expect.objectContaining({
      method: "PUT",
      portal: "elearning",
    }),
  );
});

test("syncs attempt event logs and fails on BE conflicts", async () => {
  apiRequestMock.mockResolvedValueOnce({
    status: "in_progress",
    conflicts: [],
  } as never);

  await syncAttempt({
    attemptId: "attempt-1",
    payload: {
      packageHash: "hash-1",
      events: [{ id: "evt-1", type: "answer_changed" }],
    },
  });

  expect(apiRequestMock).toHaveBeenCalledWith(
    "/api/v1/lms/attempts/attempt-1/sync",
    expect.objectContaining({
      method: "POST",
      portal: "elearning",
    }),
  );

  apiRequestMock.mockResolvedValueOnce({
    status: "conflict",
    conflicts: ["package_hash"],
  } as never);

  await expect(
    syncAttempt({
      attemptId: "attempt-1",
      payload: {
        packageHash: "wrong-hash",
        events: [],
      },
    }),
  ).rejects.toThrow("Sync attempt conflict: package_hash");
});
