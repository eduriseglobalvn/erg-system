import type { QuizEditorDraftDocument } from "@/features/lcms/quiz/quiz-editor/api/quiz-editor-api";
import {
  createEmptyQuizEditorGroups,
  createMockPlayerTemplate,
  createNewQuizProjectSettings,
} from "@/features/lcms/quiz/quiz-editor/api/quiz-editor-project-defaults";
import { createClientIdempotencyKey, isLegacyMockDraft } from "@/features/lcms/quiz/quiz-editor/components/quiz-editor-workspace-utils";

import type { DeviceDraftRecord, QuizDraftDeviceStore } from "./quiz-draft-device-store";

// Prefix of the old localStorage drafts, moved into the device store once.
const LEGACY_PREFIX = "erg:quiz-editor:recovery:v1";
export const NEW_QUIZ_PREFIX = "new-quiz:";
const OLD_PLACEHOLDER_KEY = "default-quiz-draft";

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

/**
 * A dirty device copy holds unsent edits and wins; so does a clean one saved past the server copy (a fetch that raced
 * the closing editor's last send). Otherwise the server copy is the truth.
 */
export function chooseInitialDocument(
  device: DeviceDraftRecord | null,
  server: QuizEditorDraftDocument | undefined,
): { document: QuizEditorDraftDocument | null; source: "device" | "server" | "none" } {
  if (device && (device.dirty || !server || device.baseDocVersion > server.docVersion)) return { document: device.document, source: "device" };
  if (server) return { document: server, source: "server" };
  return { document: null, source: "none" };
}

/** Moves localStorage drafts of one tenant into the device store as dirty records. Returns how many were stored. */
export async function migrateLegacyLocalDrafts(
  store: QuizDraftDeviceStore,
  scope: string,
  tenantId: string,
  writerId: string,
  storage?: Storage,
): Promise<number> {
  const prefix = `${LEGACY_PREFIX}:${encodeURIComponent(tenantId)}:`;
  const found = scanLegacyKeys(storage, prefix);
  if (!found) return 0;

  let migrated = 0;
  for (const legacyKey of found.legacyKeys) {
    const decoded = decodeKey(legacyKey.slice(prefix.length));
    if (decoded === null) continue; // malformed: leave it for a human, keep migrating the rest
    const key = currentNewQuizKey(decoded);
    if (key === OLD_PLACEHOLDER_KEY) {
      found.storage.removeItem(legacyKey); // the old hook cleared it too; it is not a real quiz
      continue;
    }
    const legacy = readLegacy(found.storage.getItem(legacyKey));
    if (legacy && !isLegacyMockDraft(legacy.payload)) {
      const existing = await store.get(scope, key);
      if (!existing || !(Date.parse(existing.editedAt) >= legacy.savedAtMs)) {
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
    found.storage.removeItem(legacyKey);
  }
  return migrated;
}

/**
 * The old editor keyed a new quiz "new-quiz:<course>:<level>", or "new-quiz:default" with no course; the topic came
 * later. Map both to the key the editor opens now with all topics (no course: the key it opens when there is none).
 */
function currentNewQuizKey(key: string): string {
  if (key === `${NEW_QUIZ_PREFIX}default`) return newQuizDraftKey("", null, "all");
  const isOld = key.startsWith(NEW_QUIZ_PREFIX) && key.slice(NEW_QUIZ_PREFIX.length).split(":").length === 2;
  return isOld ? `${key}:all` : key;
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

// localStorage accessors throw in Safari private mode or with blocked site data.
function scanLegacyKeys(storage: Storage | undefined, prefix: string): { storage: Storage; legacyKeys: string[] } | null {
  try {
    const target = storage ?? globalThis.localStorage;
    if (!target) return null;
    const legacyKeys: string[] = [];
    for (let i = 0; i < target.length; i += 1) {
      const k = target.key(i);
      if (k?.startsWith(prefix)) legacyKeys.push(k);
    }
    return { storage: target, legacyKeys };
  } catch {
    return null;
  }
}

function decodeKey(encoded: string): string | null {
  try {
    return decodeURIComponent(encoded);
  } catch {
    return null;
  }
}
