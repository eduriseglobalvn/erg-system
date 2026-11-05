import { useEffect, useLayoutEffect, useState, useSyncExternalStore } from "react";

import type { QuizEditorDraftDocument } from "@/features/lcms/quiz/quiz-editor/api/quiz-editor-api";

import type { DeviceDraftBackup } from "./quiz-draft-device-store";
import type { QuizDraftSyncStatus } from "./quiz-draft-sync-engine";
import { LOADING_SNAPSHOT, QuizDraftSyncSession, type QuizDraftSyncSessionOptions } from "./quiz-draft-sync-session";

export type UseQuizDraftSyncOptions = QuizDraftSyncSessionOptions & {
  /** quizId, or newQuizDraftKey(...) before the quiz exists. */
  draftKey: string;
  serverDraft: QuizEditorDraftDocument | undefined;
  /** The server draft query is done (or not needed, for a new quiz). */
  serverDraftSettled: boolean;
  /** Built from the editor state. */
  document: QuizEditorDraftDocument;
};

export type UseQuizDraftSyncResult = {
  status: QuizDraftSyncStatus;
  ready: boolean;
  persistent: boolean;
  quizId: string | null;
  docVersion: number;
  hasUnsyncedChanges: boolean;
  flushNow: () => Promise<void>;
  /** Hydrates the server copy itself when choosing "server". */
  resolveConflict: (choice: "mine" | "server") => Promise<void>;
  setBaseDocVersion: (version: number) => Promise<void>;
  /** Set when reopening found device edits that were never sent. */
  recovered: { pendingEdits: number; editedAt: string } | null;
  /** Copies of the open draft, newest first. */
  backups: DeviceDraftBackup[];
  /** Hydrates that copy and stores it as a new edit. */
  restoreBackup: (createdAt: string) => void;
};

/** Device autosave and server sync for the quiz editor: one engine per draft key, see QuizDraftSyncSession. */
export function useQuizDraftSync(options: UseQuizDraftSyncOptions): UseQuizDraftSyncResult {
  const { draftKey, serverDraft, serverDraftSettled, document } = options;
  const [session] = useState(() => new QuizDraftSyncSession(options));
  useLayoutEffect(() => session.setOptions(options));
  const snapshot = useSyncExternalStore(session.subscribe, session.getSnapshot, session.getSnapshot);

  // Effect order matters: on a key change `open` swaps the engine before `change` sees the new document.
  useEffect(() => () => session.close(), [session]);
  useEffect(() => session.listen(window), [session]);
  useEffect(() => session.open(draftKey, serverDraft, serverDraftSettled), [session, draftKey, serverDraft, serverDraftSettled]);
  useEffect(() => session.change(draftKey, document), [session, draftKey, document, snapshot.ready]);

  const { keys: _keys, ...state } = snapshot.keys.includes(draftKey) ? snapshot : LOADING_SNAPSHOT;
  return {
    ...state,
    flushNow: session.flushNow,
    resolveConflict: session.resolveConflict,
    setBaseDocVersion: session.setBaseDocVersion,
    restoreBackup: session.restoreBackup,
  };
}
