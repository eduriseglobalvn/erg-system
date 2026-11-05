import {
  createQuizEditorQuiz,
  loadQuizEditorDraft,
  saveQuizEditorDraft,
  type QuizEditorDraftDocument,
} from "@/features/lcms/quiz/quiz-editor/api/quiz-editor-api";
import { getDefaultTenantId } from "@/lib/graphql-client";
import { getAuthScope } from "@/platform/auth/api/auth-storage";

import { createQuizDraftDeviceStore, quizDraftScope, type DeviceDraftBackup, type QuizDraftDeviceStore } from "./quiz-draft-device-store";
import { migrateLegacyLocalDrafts } from "./quiz-draft-initial-document";
import { QuizDraftSyncEngine, type QuizDraftSyncApi, type QuizDraftSyncDeps, type QuizDraftSyncStatus } from "./quiz-draft-sync-engine";
import { createQuizImageUploader, uploadInlineImages } from "./upload-inline-images";

export const EDIT_DEBOUNCE_MS = 300;

export type QuizDraftSyncSessionOptions = {
  hydrate: (doc: QuizEditorDraftDocument) => void;
  buildCreateInput: QuizDraftSyncDeps["buildCreateInput"];
  onQuizCreated?: (quizId: string) => void;
  onSynced?: () => void;
  deps?: Partial<Pick<QuizDraftSyncDeps, "store" | "api" | "isOnline" | "now">>;
};

export type QuizDraftSyncSnapshot = {
  /** Draft keys the current engine answers to: its start key, plus the quiz id once it created the quiz. */
  keys: readonly string[];
  ready: boolean;
  persistent: boolean;
  status: QuizDraftSyncStatus;
  quizId: string | null;
  docVersion: number;
  hasUnsyncedChanges: boolean;
  recovered: { pendingEdits: number; editedAt: string } | null;
  backups: DeviceDraftBackup[];
};

export const LOADING_SNAPSHOT: QuizDraftSyncSnapshot = {
  keys: [], ready: false, persistent: false, status: { kind: "loading" }, quizId: null, docVersion: 0, hasUnsyncedChanges: false, recovered: null, backups: [],
};

type Slot = {
  engine: QuizDraftSyncEngine;
  store: QuizDraftDeviceStore;
  scope: string;
  keys: string[];
  ready: boolean;
  /** False until the first document after `ready` was seen; that one is never an edit (see `change`). */
  seenDocument: boolean;
  backups: DeviceDraftBackup[];
};

// One id per tab, so the engine can tell this tab's device records from another tab's.
const WRITER_ID: string =
  globalThis.crypto?.randomUUID?.() ?? `tab-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
let defaultStore: QuizDraftDeviceStore | null = null;
const imageCaches = new Map<string, Map<string, string>>();
const migrations = new WeakMap<QuizDraftDeviceStore, Map<string, Promise<void>>>();

function migrateOnce(store: QuizDraftDeviceStore, scope: string, tenantId: string): Promise<void> {
  const byScope = migrations.get(store) ?? new Map<string, Promise<void>>();
  migrations.set(store, byScope);
  let run = byScope.get(scope);
  if (!run) {
    // A failed move keeps the legacy keys; the editor must still open.
    run = migrateLegacyLocalDrafts(store, scope, tenantId, WRITER_ID).then(
      () => undefined,
      (error: unknown) => console.error("Cannot migrate legacy quiz drafts", error),
    );
    byScope.set(scope, run);
  }
  return run;
}

function defaultApi(scope: string): QuizDraftSyncApi {
  const cache = imageCaches.get(scope) ?? new Map<string, string>();
  imageCaches.set(scope, cache);
  const uploader = createQuizImageUploader();
  return {
    createQuiz: createQuizEditorQuiz,
    saveDraft: saveQuizEditorDraft,
    loadDraft: (quizId) => loadQuizEditorDraft(quizId),
    uploadImages: (doc) => uploadInlineImages(doc, uploader, undefined, undefined, cache),
  };
}

/**
 * Owns the engine behind `useQuizDraftSync`: one live engine at a time, the 300 ms edit debounce, and the window events.
 * A plain object so React StrictMode's mount/unmount/mount can close and reopen it without losing an edit.
 */
export class QuizDraftSyncSession {
  private latest: QuizDraftSyncSessionOptions;
  private slot: Slot | null = null;
  private pending: { engine: QuizDraftSyncEngine; document: QuizEditorDraftDocument } | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private snapshot = LOADING_SNAPSHOT;
  private readonly listeners = new Set<() => void>();

  constructor(options: QuizDraftSyncSessionOptions) {
    this.latest = options;
  }

  /** The hook passes each render's options, so callbacks are never stale. */
  setOptions(options: QuizDraftSyncSessionOptions): void {
    this.latest = options;
  }

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = () => this.snapshot;

  /** Starts an engine for `draftKey`, unless the live one already answers to it (it created that quiz). */
  open(draftKey: string, serverDraft: QuizEditorDraftDocument | undefined, settled: boolean): void {
    const current = this.slot;
    if (current?.keys.includes(draftKey)) {
      if (draftKey === current.engine.quizId) current.keys = [draftKey]; // the new-quiz key may start a fresh quiz again
      return;
    }
    this.close();
    if (!settled) return;

    const { deps = {} } = this.latest;
    const tenantId = getDefaultTenantId();
    const scope = quizDraftScope(tenantId, getAuthScope().accountId);
    const store = deps.store ?? (defaultStore ??= createQuizDraftDeviceStore());
    const engine: QuizDraftSyncEngine = new QuizDraftSyncEngine(
      {
        store,
        scope,
        api: deps.api ?? defaultApi(scope),
        writerId: WRITER_ID,
        isOnline: deps.isOnline ?? (() => navigator.onLine),
        now: deps.now ?? (() => new Date()),
        buildCreateInput: (doc) => this.latest.buildCreateInput(doc),
        onQuizCreated: (quizId) => {
          if (this.slot?.engine === engine) this.slot.keys.push(quizId);
          this.publish();
          this.latest.onQuizCreated?.(quizId);
        },
      },
      draftKey,
    );
    const slot: Slot = { engine, store, scope, keys: [draftKey], ready: false, seenDocument: false, backups: [] };
    this.slot = slot;
    this.publish();
    void this.load(slot, tenantId, serverDraft);
  }

  /** Called with every rendered document; forwards real edits to the engine after a 300 ms debounce. */
  change(draftKey: string, document: QuizEditorDraftDocument): void {
    const slot = this.slot;
    if (!slot?.ready || !slot.keys.includes(draftKey)) return;
    // The first document after load is the hydrated one, or with nothing to hydrate whatever the editor still shows
    // (possibly the previous quiz). Neither is an edit of this draft.
    if (!slot.seenDocument) {
      slot.seenDocument = true;
      return;
    }
    this.pending = { engine: slot.engine, document };
    this.clearTimer();
    this.timer = setTimeout(() => this.flushPending(), EDIT_DEBOUNCE_MS);
  }

  /** Writes the debounced edit, then disposes the engine; a disposed engine still stores that edit on the device. */
  close(): void {
    this.flushPending();
    this.slot?.engine.dispose();
    this.slot = null;
    this.publish();
  }

  listen(target: Window): () => void {
    const leave = () => {
      this.flushPending();
      void this.slot?.engine.flushNow();
    };
    // Signing in again usually happens in another tab or page, so retry when this one comes back.
    const resume = () => {
      if (this.slot?.engine.status.kind === "signed-out") void this.slot.engine.flushNow();
    };
    const onVisibility = () => (target.document.visibilityState === "hidden" ? leave() : resume());
    const onOnline = () => this.slot?.engine.notifyOnline();
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!this.pending && !this.slot?.engine.hasUnsyncedChanges) return;
      event.preventDefault();
      event.returnValue = ""; // Safari 15 and older Chrome only ask when returnValue is set
    };
    const events: Array<[string, (event: never) => void]> = [
      ["pagehide", leave], ["visibilitychange", onVisibility], ["focus", resume], ["online", onOnline], ["beforeunload", onBeforeUnload],
    ];
    for (const [name, handler] of events) target.addEventListener(name, handler as EventListener);
    return () => {
      for (const [name, handler] of events) target.removeEventListener(name, handler as EventListener);
    };
  }

  flushNow = async (): Promise<void> => {
    this.flushPending();
    const slot = this.slot;
    if (!slot) return;
    await slot.engine.flushNow();
    this.refresh(slot);
  };

  resolveConflict = async (choice: "mine" | "server"): Promise<void> => {
    const slot = this.slot;
    if (!slot) return;
    this.flushPending();
    const server = await slot.engine.resolveConflict(choice);
    if (this.slot !== slot) return;
    if (server) this.latest.hydrate(server);
    await this.reloadBackups(slot);
  };

  setBaseDocVersion = async (version: number): Promise<void> => {
    const slot = this.slot;
    if (!slot) return;
    await slot.engine.setBaseDocVersion(version);
    this.refresh(slot);
  };

  restoreBackup = (createdAt: string): void => {
    const slot = this.slot;
    const backup = slot?.backups.find((b) => b.createdAt === createdAt);
    if (!slot || !backup) return;
    this.flushPending();
    this.latest.hydrate(backup.document);
    slot.engine.edit(backup.document).then(
      () => this.reloadBackups(slot),
      (error: unknown) => console.error("Cannot restore quiz draft backup", error),
    );
  };

  private async load(slot: Slot, tenantId: string, serverDraft: QuizEditorDraftDocument | undefined): Promise<void> {
    await migrateOnce(slot.store, slot.scope, tenantId);
    if (this.slot !== slot) return;
    let document: QuizEditorDraftDocument | null;
    try {
      document = await slot.engine.start(serverDraft);
    } catch (error) {
      console.error("Cannot open quiz draft", error);
      if (this.slot === slot) this.publishStatus({ kind: "error", message: error instanceof Error ? error.message : String(error) });
      return;
    }
    if (this.slot !== slot) return;
    if (document) this.latest.hydrate(document);
    slot.ready = true;
    let lastKind = slot.engine.status.kind;
    slot.engine.subscribe((status) => {
      if (status.kind === "saved" && status.at !== null && lastKind !== "saved") this.latest.onSynced?.();
      lastKind = status.kind;
      this.refresh(slot);
    });
    this.publish();
    const { now = () => new Date() } = this.latest.deps ?? {};
    await slot.store.prune(slot.scope, now()).catch((error: unknown) => console.error("Cannot prune quiz drafts", error));
    await this.reloadBackups(slot);
  }

  private async reloadBackups(slot: Slot): Promise<void> {
    try {
      const backups = await slot.store.listBackups(slot.scope, slot.keys[slot.keys.length - 1]);
      slot.backups = backups.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    } catch (error) {
      console.error("Cannot list quiz draft backups", error);
    }
    this.refresh(slot);
  }

  private flushPending(): void {
    this.clearTimer();
    const pending = this.pending;
    this.pending = null;
    if (!pending) return;
    pending.engine.edit(pending.document).then(
      () => {
        if (this.slot?.engine === pending.engine) this.publish();
      },
      (error: unknown) => console.error("Cannot store quiz draft edit", error),
    );
  }

  private clearTimer(): void {
    if (this.timer !== null) clearTimeout(this.timer);
    this.timer = null;
  }

  private refresh(slot: Slot): void {
    if (this.slot === slot) this.publish();
  }

  private publishStatus(status: QuizDraftSyncStatus): void {
    this.snapshot = { ...this.snapshot, status };
    for (const listener of this.listeners) listener();
  }

  private publish(): void {
    const slot = this.slot;
    if (!slot) {
      this.snapshot = LOADING_SNAPSHOT;
    } else {
      const { engine } = slot;
      this.snapshot = {
        keys: [...slot.keys],
        ready: slot.ready,
        persistent: slot.store.persistent,
        status: engine.status,
        quizId: engine.quizId,
        docVersion: engine.docVersion,
        hasUnsyncedChanges: engine.hasUnsyncedChanges,
        recovered: engine.recovered,
        backups: slot.backups,
      };
    }
    for (const listener of this.listeners) listener();
  }
}
