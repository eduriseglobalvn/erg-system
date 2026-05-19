import type { LocalQuizAttemptSession } from "@/features/quiz-runtime/types/quiz-runtime-types";
import type { AnswerPayload } from "@/lib/types";

const SESSION_VERSION = 1;
const SESSION_PREFIX = "erg:local-quiz-attempt:v1:";

type StoredSession = LocalQuizAttemptSession & {
  version: number;
};

export const localQuizAttemptStore = {
  async getSession(assignmentId: string, quizId: string): Promise<LocalQuizAttemptSession | null> {
    const stored = readJson<StoredSession>(getSessionKey(assignmentId, quizId));
    if (!stored || stored.version !== SESSION_VERSION) {
      return null;
    }

    return {
      attemptId: stored.attemptId,
      assignmentId: stored.assignmentId,
      quizId: stored.quizId,
      packageHash: stored.packageHash,
      quizVersion: stored.quizVersion,
      startedAt: stored.startedAt,
      updatedAt: stored.updatedAt,
      submittedAt: stored.submittedAt,
      status: stored.status,
      answers: stored.answers,
      bookmarkedQuestionIds: stored.bookmarkedQuestionIds ?? [],
      clientEvents: stored.clientEvents,
      submitIdempotencyKey: stored.submitIdempotencyKey,
    };
  },

  async createSession(input: {
    assignmentId: string;
    attemptId: string;
    packageHash: string;
    quizId: string;
    quizVersion: string;
    submitIdempotencyKey: string;
  }): Promise<LocalQuizAttemptSession> {
    const now = new Date().toISOString();
    const session: LocalQuizAttemptSession = {
      attemptId: input.attemptId,
      assignmentId: input.assignmentId,
      quizId: input.quizId,
      packageHash: input.packageHash,
      quizVersion: input.quizVersion,
      startedAt: now,
      updatedAt: now,
      status: "in_progress",
      answers: {},
      bookmarkedQuestionIds: [],
      clientEvents: [
        {
          type: "attempt_started",
          createdAt: now,
          packageHash: input.packageHash,
          quizVersion: input.quizVersion,
        },
      ],
      submitIdempotencyKey: input.submitIdempotencyKey,
    };

    await this.saveSession(session);
    return session;
  },

  async saveSession(session: LocalQuizAttemptSession): Promise<void> {
    writeJson(getSessionKey(session.assignmentId, session.quizId), {
      ...session,
      version: SESSION_VERSION,
    });
  },

  async saveAnswer(
    session: LocalQuizAttemptSession,
    questionId: string,
    answer: AnswerPayload,
  ): Promise<LocalQuizAttemptSession> {
    const now = new Date().toISOString();
    const nextSession: LocalQuizAttemptSession = {
      ...session,
      answers: {
        ...session.answers,
        [questionId]: answer,
      },
      clientEvents: [
        ...session.clientEvents,
        {
          type: "answer_changed",
          createdAt: now,
          questionId,
        },
      ],
      status: session.status === "submit_failed" ? "in_progress" : session.status,
      updatedAt: now,
    };

    await this.saveSession(nextSession);
    return nextSession;
  },

  async toggleBookmark(
    session: LocalQuizAttemptSession,
    questionId: string,
  ): Promise<LocalQuizAttemptSession> {
    const bookmarkedQuestionIds = session.bookmarkedQuestionIds.includes(questionId)
      ? session.bookmarkedQuestionIds.filter((id) => id !== questionId)
      : [...session.bookmarkedQuestionIds, questionId];

    const now = new Date().toISOString();
    const nextSession: LocalQuizAttemptSession = {
      ...session,
      bookmarkedQuestionIds,
      updatedAt: now,
      clientEvents: [
        ...session.clientEvents,
        {
          type: "bookmark_toggled",
          createdAt: now,
          questionId,
          bookmarked: bookmarkedQuestionIds.includes(questionId),
        },
      ],
    };

    await this.saveSession(nextSession);
    return nextSession;
  },

  async markSubmitting(session: LocalQuizAttemptSession): Promise<LocalQuizAttemptSession> {
    return this.saveWithStatus(session, "submitting");
  },

  async markSubmitFailed(
    session: LocalQuizAttemptSession,
    reason: string,
  ): Promise<LocalQuizAttemptSession> {
    return this.saveWithStatus(session, "submit_failed", {
      type: "submit_failed",
      reason,
    });
  },

  async markSubmitted(
    session: LocalQuizAttemptSession,
    submittedAt: string,
  ): Promise<LocalQuizAttemptSession> {
    return this.saveWithStatus(
      {
        ...session,
        submittedAt,
      },
      "submitted",
      {
        type: "attempt_submitted",
        submittedAt,
      },
    );
  },

  async clearSession(assignmentId: string, quizId: string): Promise<void> {
    if (!canUseLocalStorage()) {
      return;
    }

    window.localStorage.removeItem(getSessionKey(assignmentId, quizId));
  },

  async saveWithStatus(
    session: LocalQuizAttemptSession,
    status: LocalQuizAttemptSession["status"],
    event?: Record<string, unknown>,
  ): Promise<LocalQuizAttemptSession> {
    const now = new Date().toISOString();
    const nextSession: LocalQuizAttemptSession = {
      ...session,
      status,
      updatedAt: now,
      clientEvents: event
        ? [
            ...session.clientEvents,
            {
              createdAt: now,
              ...event,
            },
          ]
        : session.clientEvents,
    };

    await this.saveSession(nextSession);
    return nextSession;
  },
};

export function createRuntimeKey(prefix: string) {
  const randomId =
    typeof globalThis.crypto?.randomUUID === "function"
      ? globalThis.crypto.randomUUID()
      : `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;

  return `${prefix}_${randomId}`;
}

function getSessionKey(assignmentId: string, quizId: string) {
  return `${SESSION_PREFIX}${assignmentId}:${quizId}`;
}

function readJson<T>(key: string): T | null {
  if (!canUseLocalStorage()) {
    return null;
  }

  const raw = window.localStorage.getItem(key);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    window.localStorage.removeItem(key);
    return null;
  }
}

function writeJson(key: string, value: unknown) {
  if (!canUseLocalStorage()) {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

function canUseLocalStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}
