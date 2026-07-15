import type { LocalQuizAttemptSession, QuizRuntimePortal } from "@/features/lcms/quiz/quiz-runtime/types/quiz-runtime-types";
import type { AnswerPayload } from "@/lib/types";
import { getDefaultTenantId } from "@/lib/graphql-client";
import {
  getPersistedJsonValue,
  removePersistedJsonValue,
  setPersistedJsonValue,
} from "@/stores/persisted-store";

const SESSION_VERSION = 1;
const SESSION_PREFIX = "erg:local-quiz-attempt:v1:";

type StoredSession = LocalQuizAttemptSession & {
  version: number;
};

export type LocalQuizAttemptScope = {
  accountId?: string | null;
  portal?: QuizRuntimePortal | null;
  tenantId?: string | null;
};

export const localQuizAttemptStore = {
  async getSession(assignmentId: string, quizId: string, scope?: LocalQuizAttemptScope): Promise<LocalQuizAttemptSession | null> {
    const stored = readStoredSession(assignmentId, quizId, scope);
    if (!stored || stored.version !== SESSION_VERSION) {
      return null;
    }

    return {
      attemptId: stored.attemptId,
      accountId: stored.accountId,
      assignmentId: stored.assignmentId,
      quizId: stored.quizId,
      portal: stored.portal,
      packageHash: stored.packageHash,
      quizVersion: stored.quizVersion,
      tenantId: stored.tenantId,
      startedAt: stored.startedAt,
      updatedAt: stored.updatedAt,
      submittedAt: stored.submittedAt,
      status: stored.status,
      answers: stored.answers,
      bookmarkedQuestionIds: stored.bookmarkedQuestionIds ?? [],
      clientEvents: stored.clientEvents,
      serverStarted: stored.serverStarted ?? false,
      shuffleSeed: stored.shuffleSeed,
      startIdempotencyKey: stored.startIdempotencyKey,
      submitIdempotencyKey: stored.submitIdempotencyKey,
    };
  },

  async createSession(input: {
    accountId?: string | null;
    assignmentId: string;
    attemptId: string;
    packageHash: string;
    portal?: QuizRuntimePortal | null;
    quizId: string;
    quizVersion: string;
    shuffleSeed?: string;
    startIdempotencyKey: string;
    submitIdempotencyKey: string;
    tenantId?: string | null;
  }): Promise<LocalQuizAttemptSession> {
    const now = new Date().toISOString();
    const session: LocalQuizAttemptSession = {
      attemptId: input.attemptId,
      accountId: normalizeAccountId(input.accountId),
      assignmentId: input.assignmentId,
      quizId: input.quizId,
      portal: normalizePortal(input.portal),
      packageHash: input.packageHash,
      quizVersion: input.quizVersion,
      tenantId: normalizeTenantId(input.tenantId),
      startedAt: now,
      updatedAt: now,
      status: "in_progress",
      answers: {},
      bookmarkedQuestionIds: [],
      clientEvents: [
        {
          id: createRuntimeKey("evt"),
          type: "attempt_started",
          createdAt: now,
          packageHash: input.packageHash,
          quizVersion: input.quizVersion,
        },
      ],
      serverStarted: false,
      shuffleSeed: input.shuffleSeed,
      startIdempotencyKey: input.startIdempotencyKey,
      submitIdempotencyKey: input.submitIdempotencyKey,
    };

    await this.saveSession(session);
    return session;
  },

  async saveSession(session: LocalQuizAttemptSession): Promise<void> {
    writeJson(getSessionKey(session.assignmentId, session.quizId, session), {
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
          id: createRuntimeKey("evt"),
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
          id: createRuntimeKey("evt"),
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
        id: createRuntimeKey("evt"),
        type: "attempt_submitted",
        submittedAt,
      },
    );
  },

  async markServerStarted(
    session: LocalQuizAttemptSession,
    attemptId: string,
  ): Promise<LocalQuizAttemptSession> {
    const now = new Date().toISOString();
    const nextSession: LocalQuizAttemptSession = {
      ...session,
      attemptId,
      serverStarted: true,
      startedAt: now,
      updatedAt: now,
      clientEvents: [
        ...session.clientEvents,
        {
          id: createRuntimeKey("evt"),
          type: "server_attempt_started",
          createdAt: now,
        },
      ],
    };

    await this.saveSession(nextSession);
    return nextSession;
  },

  async clearSession(assignmentId: string, quizId: string): Promise<void> {
    if (!canUseLocalStorage()) {
      return;
    }

    removePersistedJsonValue(getSessionKey(assignmentId, quizId));
  },

  async clearScopedSession(assignmentId: string, quizId: string, scope: LocalQuizAttemptScope): Promise<void> {
    if (!canUseLocalStorage()) {
      return;
    }

    removePersistedJsonValue(getSessionKey(assignmentId, quizId, scope));
  },

  async clearSessionsForQuiz(quizId: string): Promise<void> {
    if (!canUseLocalStorage()) {
      return;
    }

    for (let index = window.localStorage.length - 1; index >= 0; index -= 1) {
      const key = window.localStorage.key(index);
      if (key?.startsWith(SESSION_PREFIX) && key.endsWith(`:${quizId}`)) {
        removePersistedJsonValue(key);
      }
    }
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
            id: createRuntimeKey("evt"),
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

function readStoredSession(assignmentId: string, quizId: string, scope?: LocalQuizAttemptScope) {
  if (scope) {
    return readJson<StoredSession>(getSessionKey(assignmentId, quizId, scope));
  }

  return readJson<StoredSession>(getSessionKey(assignmentId, quizId, {})) ?? readJson<StoredSession>(getLegacySessionKey(assignmentId, quizId));
}

export function createRuntimeKey(prefix: string) {
  const randomId =
    typeof globalThis.crypto?.randomUUID === "function"
      ? globalThis.crypto.randomUUID()
      : `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;

  return `${prefix}_${randomId}`;
}

function getSessionKey(assignmentId: string, quizId: string, scope?: LocalQuizAttemptScope) {
  if (!scope) {
    return getLegacySessionKey(assignmentId, quizId);
  }

  return `${SESSION_PREFIX}${normalizeTenantId(scope.tenantId)}:${normalizePortal(scope.portal)}:${normalizeAccountId(scope.accountId)}:${assignmentId}:${quizId}`;
}

function getLegacySessionKey(assignmentId: string, quizId: string) {
  return `${SESSION_PREFIX}${assignmentId}:${quizId}`;
}

function normalizeTenantId(tenantId: LocalQuizAttemptScope["tenantId"]) {
  return tenantId?.trim() || getDefaultTenantId();
}

function normalizePortal(portal: LocalQuizAttemptScope["portal"]) {
  return portal ?? "elearning";
}

function normalizeAccountId(accountId: LocalQuizAttemptScope["accountId"]) {
  return accountId?.trim() || "anonymous";
}

function readJson<T>(key: string): T | null {
  if (!canUseLocalStorage()) {
    return null;
  }

  return getPersistedJsonValue<T | null>(key, null);
}

function writeJson(key: string, value: unknown) {
  if (!canUseLocalStorage()) {
    return;
  }

  setPersistedJsonValue(key, value);
}

function canUseLocalStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}
