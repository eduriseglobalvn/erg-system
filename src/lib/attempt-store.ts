import type { AttemptSession, AttemptSyncPayload } from "@/lib/types";
import {
  getPersistedJsonValue,
  listPersistedJsonKeys,
  removePersistedJsonValue,
  setPersistedJsonValue,
} from "@/stores/persisted-store";

const SESSION_PREFIX = "erg:attempt-session:";
const OUTBOX_PREFIX = "erg:attempt-sync:";

export type AttemptStore = {
  getSession: (attemptId: string) => Promise<AttemptSession | null>;
  saveSession: (session: AttemptSession) => Promise<void>;
  queueSyncPayload: (payload: AttemptSyncPayload) => Promise<void>;
  listPendingSyncPayloads: () => Promise<AttemptSyncPayload[]>;
  markSynced: (attemptId: string) => Promise<void>;
};

export const browserAttemptStore: AttemptStore = {
  async getSession(attemptId) {
    return readJson<AttemptSession>(`${SESSION_PREFIX}${attemptId}`);
  },
  async saveSession(session) {
    writeJson(`${SESSION_PREFIX}${session.attempt.id}`, session);
  },
  async queueSyncPayload(payload) {
    writeJson(`${OUTBOX_PREFIX}${payload.attemptId}`, payload);
  },
  async listPendingSyncPayloads() {
    if (!canUseLocalStorage()) {
      return [];
    }

    return listPersistedJsonKeys(OUTBOX_PREFIX)
      .filter((key) => key.startsWith(OUTBOX_PREFIX))
      .map((key) => readJson<AttemptSyncPayload>(key))
      .filter((payload): payload is AttemptSyncPayload => Boolean(payload));
  },
  async markSynced(attemptId) {
    if (!canUseLocalStorage()) {
      return;
    }

    removePersistedJsonValue(`${OUTBOX_PREFIX}${attemptId}`);
  },
};

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
