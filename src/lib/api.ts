import {
  buildAttemptSyncPayload,
  createAttemptSession,
  createQuizPackage,
  gradeAnswerLocally,
  gradeAttemptLocally,
  markSessionSyncFailed,
  markSessionSynced,
} from "@/lib/assessment-engine";
import { apiRequest, hasApiBase } from "@/lib/api-client";
import { browserAttemptStore } from "@/lib/attempt-store";
import { getAllQuestions } from "@/lib/quiz";
import { sampleQuiz } from "@/lib/sample-quiz";
import { getGradingStrategy } from "@/lib/platform";
import type {
  AnswerPayload,
  AnswerResult,
  Attempt,
  AttemptSession,
  AttemptSyncPayload,
  Quiz,
  QuizPackage,
  QuizSummary,
  StudentProgress,
} from "@/lib/types";

const API_BASE = hasApiBase();
const GRADING_STRATEGY = getGradingStrategy();
const CLIENT_FIRST_GRADING = GRADING_STRATEGY === "client-first";

let localSession: AttemptSession | null = null;

export async function fetchQuizList(): Promise<QuizSummary[]> {
  if (!API_BASE) {
    return getLocalQuizList();
  }

  try {
    const data = await apiRequest<{ items: QuizSummary[] }>("/api/lms/quizzes");
    return data.items;
  } catch {
    return getLocalQuizList();
  }
}

export async function fetchQuiz(id: string): Promise<Quiz> {
  if (!API_BASE) {
    return sampleQuiz;
  }

  if (CLIENT_FIRST_GRADING) {
    try {
      const quizPackage = await apiRequest<QuizPackage>(`/api/lms/quizzes/${id}/package`);
      if (isQuizPackage(quizPackage)) {
        return quizPackage.quiz;
      }
    } catch {
      // Keep compatibility with the current mock/API shape while BE package endpoint is not ready.
    }
  }

  try {
    return await apiRequest<Quiz>(`/api/lms/quizzes/${id}`);
  } catch {
    return sampleQuiz;
  }
}

export async function saveQuiz(quiz: Quiz): Promise<Quiz> {
  if (!API_BASE) {
    return quiz;
  }

  try {
    return await apiRequest<Quiz>(`/api/lms/quizzes/${quiz.id}`, {
      method: "PUT",
      body: JSON.stringify(quiz),
    });
  } catch {
    return quiz;
  }
}

export async function createAttempt(quizInput: Quiz | string): Promise<Attempt> {
  const quiz = resolveQuiz(quizInput);

  if (!API_BASE || CLIENT_FIRST_GRADING) {
    const session = createLocalSession(quiz);
    await persistSession(session);

    if (API_BASE) {
      syncSessionInBackground(session);
    }

    return session.attempt;
  }

  try {
    return await apiRequest<Attempt>("/api/lms/attempts", {
      method: "POST",
      body: JSON.stringify({ quizId: quiz.id }),
    });
  } catch {
    const session = createLocalSession(quiz);
    await persistSession(session);
    return session.attempt;
  }
}

export async function submitAnswer(
  attemptId: string,
  quiz: Quiz,
  questionId: string,
  answer: AnswerPayload,
): Promise<{ attempt: Attempt; result: AnswerResult }> {
  if (!API_BASE || CLIENT_FIRST_GRADING) {
    const response = await submitLocalAnswer(attemptId, quiz, questionId, answer);

    if (API_BASE) {
      syncSessionInBackground(response.session);
    }

    return {
      attempt: response.session.attempt,
      result: response.result,
    };
  }

  try {
    return await apiRequest<{ attempt: Attempt; result: AnswerResult }>(`/api/lms/attempts/${attemptId}/answers`, {
      method: "POST",
      body: JSON.stringify({ questionId, answer }),
    });
  } catch {
    const response = await submitLocalAnswer(attemptId, quiz, questionId, answer);
    return {
      attempt: response.session.attempt,
      result: response.result,
    };
  }
}

export async function submitAttempt(
  attemptId: string,
  quiz: Quiz,
  answers: Record<string, AnswerPayload>,
): Promise<Attempt> {
  if (!API_BASE || CLIENT_FIRST_GRADING) {
    const session = await submitLocalAttempt(attemptId, quiz, answers);

    if (API_BASE) {
      syncSessionInBackground(session);
    }

    return session.attempt;
  }

  try {
    return await apiRequest<Attempt>(`/api/lms/attempts/${attemptId}/submit`, {
      method: "POST",
      body: JSON.stringify({ answers }),
    });
  } catch {
    return (await submitLocalAttempt(attemptId, quiz, answers)).attempt;
  }
}

export async function fetchStudentProgress(quizId: string): Promise<StudentProgress[]> {
  if (!API_BASE) {
    return getLocalStudentProgress(quizId);
  }

  try {
    const data = await apiRequest<{ items: StudentProgress[] }>(`/api/lms/quizzes/${quizId}/students`);
    return data.items;
  } catch {
    return getLocalStudentProgress(quizId);
  }
}

async function submitLocalAnswer(
  attemptId: string,
  quiz: Quiz,
  questionId: string,
  answer: AnswerPayload,
): Promise<{ session: AttemptSession; result: AnswerResult }> {
  const session = await ensureLocalSession(attemptId, quiz);
  const graded = gradeAnswerLocally(session, questionId, answer);
  localSession = graded.session;
  await persistSession(graded.session);

  return graded;
}

async function submitLocalAttempt(
  attemptId: string,
  quiz: Quiz,
  answers: Record<string, AnswerPayload>,
): Promise<AttemptSession> {
  const session = await ensureLocalSession(attemptId, quiz);
  const submittedSession = gradeAttemptLocally(session, answers);
  localSession = submittedSession;
  await persistSession(submittedSession);

  return submittedSession;
}

async function ensureLocalSession(attemptId: string, quiz: Quiz): Promise<AttemptSession> {
  if (localSession?.attempt.id === attemptId) {
    return localSession;
  }

  const storedSession = await browserAttemptStore.getSession(attemptId);
  if (storedSession) {
    localSession = storedSession;
    return storedSession;
  }

  return createLocalSession(quiz, attemptId);
}

function createLocalSession(quiz: Quiz, attemptId?: string): AttemptSession {
  const quizPackage = createQuizPackage(quiz, {
    gradingMode: GRADING_STRATEGY,
    source: API_BASE ? "server" : "local",
  });
  localSession = createAttemptSession(quizPackage, attemptId);
  return localSession;
}

async function persistSession(session: AttemptSession) {
  await browserAttemptStore.saveSession(session);
  await browserAttemptStore.queueSyncPayload(buildAttemptSyncPayload(session));
}

function syncSessionInBackground(session: AttemptSession) {
  if (!API_BASE) {
    return;
  }

  const payload = buildAttemptSyncPayload(session);
  void postAttemptSyncPayload(payload)
    .then(async () => {
      const syncedSession = markSessionSynced(session);
      localSession = syncedSession;
      await browserAttemptStore.saveSession(syncedSession);
      await browserAttemptStore.markSynced(session.attempt.id);
    })
    .catch(async (error) => {
      const failedSession = markSessionSyncFailed(
        session,
        error instanceof Error ? error.message : "Unknown sync error",
      );
      localSession = failedSession;
      await browserAttemptStore.saveSession(failedSession);
      await browserAttemptStore.queueSyncPayload(buildAttemptSyncPayload(failedSession));
    });
}

async function postAttemptSyncPayload(payload: AttemptSyncPayload) {
  const answers = Object.fromEntries(
    Object.values(payload.attempt.answers).map((record) => [record.questionId, record.input]),
  );
  const path = payload.submittedAt
    ? `/api/lms/attempts/${payload.attemptId}/submit`
    : `/api/lms/attempts/${payload.attemptId}/sync`;

  await apiRequest<Attempt>(path, {
    method: "POST",
    body: JSON.stringify({
      ...payload,
      answers,
      clientResult: payload.attempt,
    }),
  });
}

function getLocalQuizList(): QuizSummary[] {
  return [
    {
      id: sampleQuiz.id,
      title: sampleQuiz.title,
      subtitle: sampleQuiz.subtitle,
      version: sampleQuiz.version,
      sectionCount: sampleQuiz.sections.length,
      questionCount: getAllQuestions(sampleQuiz).length,
    },
  ];
}

function resolveQuiz(quizInput: Quiz | string): Quiz {
  return typeof quizInput === "string" ? sampleQuiz : quizInput;
}

function isQuizPackage(value: unknown): value is QuizPackage {
  return Boolean(
    value &&
      typeof value === "object" &&
      "quiz" in value &&
      "contentHash" in value &&
      "quizVersion" in value,
  );
}

function getLocalStudentProgress(quizId: string): StudentProgress[] {
  const totalQuestions = getAllQuestions(sampleQuiz).length;
  return [
    {
      id: "student-1",
      studentName: "Nguyễn Khánh Linh",
      quizId,
      quizTitle: sampleQuiz.title,
      mode: sampleQuiz.settings.mode,
      status: "in_progress",
      currentQuestionIndex: 4,
      currentQuestionTitle: "Bạn đăng một video lên trang web của công ty...",
      answeredCount: 4,
      totalQuestions,
      percentComplete: 67,
      score: null,
      passed: null,
      startedAt: "2026-04-20T08:05:00+07:00",
      submittedAt: null,
      lastActiveAt: "2026-04-20T08:31:00+07:00",
    },
    {
      id: "student-2",
      studentName: "Trần Minh Đức",
      quizId,
      quizTitle: sampleQuiz.title,
      mode: "testing",
      status: "submitted",
      currentQuestionIndex: totalQuestions,
      currentQuestionTitle: "Đã nộp bài",
      answeredCount: totalQuestions,
      totalQuestions,
      percentComplete: 100,
      score: 54,
      passed: false,
      startedAt: "2026-04-20T07:42:00+07:00",
      submittedAt: "2026-04-20T08:14:00+07:00",
      lastActiveAt: "2026-04-20T08:14:00+07:00",
    },
    {
      id: "student-3",
      studentName: "Phạm Gia Hân",
      quizId,
      quizTitle: sampleQuiz.title,
      mode: "training",
      status: "in_progress",
      currentQuestionIndex: 2,
      currentQuestionTitle: "Hãy sắp xếp các bước sử dụng Start Menu...",
      answeredCount: 2,
      totalQuestions,
      percentComplete: 34,
      score: null,
      passed: null,
      startedAt: "2026-04-20T08:18:00+07:00",
      submittedAt: null,
      lastActiveAt: "2026-04-20T08:29:00+07:00",
    },
    {
      id: "student-4",
      studentName: "Lê Hoàng Nam",
      quizId,
      quizTitle: sampleQuiz.title,
      mode: sampleQuiz.settings.mode,
      status: "not_started",
      currentQuestionIndex: 0,
      currentQuestionTitle: "Chưa bắt đầu",
      answeredCount: 0,
      totalQuestions,
      percentComplete: 0,
      score: null,
      passed: null,
      startedAt: null,
      submittedAt: null,
      lastActiveAt: "2026-04-20T07:50:00+07:00",
    },
  ];
}
