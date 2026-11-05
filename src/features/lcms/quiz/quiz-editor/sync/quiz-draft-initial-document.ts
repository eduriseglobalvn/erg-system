import type { QuizEditorDraftDocument } from "@/features/lcms/quiz/quiz-editor/api/quiz-editor-api";
import {
  createEmptyQuizEditorGroups,
  createMockPlayerTemplate,
  createNewQuizProjectSettings,
} from "@/features/lcms/quiz/quiz-editor/api/quiz-editor-project-defaults";
import { createClientIdempotencyKey, isLegacyMockDraft } from "@/features/lcms/quiz/quiz-editor/components/quiz-editor-workspace-utils";

import type { DeviceDraftRecord, QuizDraftDeviceStore } from "./quiz-draft-device-store";

// Same prefix as api/quiz-editor-local-draft.ts, which Task 7 deletes.
const LEGACY_PREFIX = "erg:quiz-editor:recovery:v1";
const NEW_QUIZ_PREFIX = "new-quiz:";

export function createBlankDraft(quizId: string, draftId: string): QuizEditorDraftDocument {
  return {
    quizId,
    draftId,
    docVersion: 0,
    settings: createNewQuizProjectSettings("Bài kiểm tra mới"),
    playerTemplate: createMockPlayerTemplate(),
    tree: createEmptyQuizEditorGroups(),
  };
}

export function newQuizDraftKey(courseId: string, levelId: string | null, topicId: string): string {
  return `${NEW_QUIZ_PREFIX}${courseId}:${levelId ?? "all"}:${topicId}`;
}

/** A dirty device copy holds unsent edits and wins; otherwise the server copy is the truth. */
export function chooseInitialDocument(
  device: DeviceDraftRecord | null,
  server: QuizEditorDraftDocument | undefined,
): { document: QuizEditorDraftDocument | null; source: "device" | "server" | "none" } {
  if (device && (device.dirty || !server)) return { document: device.document, source: "device" };
  if (server) return { document: server, source: "server" };
  return { document: null, source: "none" };
}

/** Moves localStorage drafts of one tenant into the device store as dirty records. Returns how many were stored. */
export async function migrateLegacyLocalDrafts(
  store: QuizDraftDeviceStore,
  scope: string,
  tenantId: string,
  writerId: string,
  storage: Storage | undefined = globalThis.localStorage,
): Promise<number> {
  if (!storage) return 0;
  const prefix = `${LEGACY_PREFIX}:${encodeURIComponent(tenantId)}:`;
  const legacyKeys: string[] = [];
  for (let i = 0; i < storage.length; i += 1) {
    const k = storage.key(i);
    if (k?.startsWith(prefix)) legacyKeys.push(k);
  }

  let migrated = 0;
  for (const legacyKey of legacyKeys) {
    const key = decodeURIComponent(legacyKey.slice(prefix.length));
    const legacy = readLegacy(storage.getItem(legacyKey));
    if (legacy && !isLegacyMockDraft(legacy.payload)) {
      const existing = await store.get(scope, key);
      if (!existing || Date.parse(existing.editedAt) < legacy.savedAtMs) {
        await store.put(scope, {
          key,
          quizId: key.startsWith(NEW_QUIZ_PREFIX) ? null : key,
          createIdempotencyKey: createClientIdempotencyKey("quiz-editor-create"),
          baseDocVersion: legacy.payload.docVersion,
          document: legacy.payload,
          dirty: true,
          revision: 1,
          syncedRevision: 0,
          editedAt: new Date(legacy.savedAtMs).toISOString(),
          syncedAt: null,
          writerId,
        });
        migrated += 1;
      }
    }
    // Removed only after the store write succeeded (put throws otherwise), so a failed move loses nothing.
    storage.removeItem(legacyKey);
  }
  return migrated;
}

function readLegacy(raw: string | null): { savedAtMs: number; payload: QuizEditorDraftDocument } | null {
  try {
    const parsed = JSON.parse(raw ?? "null") as { savedAt?: string; payload?: QuizEditorDraftDocument } | null;
    const savedAtMs = Date.parse(parsed?.savedAt ?? "");
    return parsed?.payload && Number.isFinite(savedAtMs) ? { savedAtMs, payload: parsed.payload } : null;
  } catch {
    return null;
  }
}
