import type {
  QuizEditorCreateInput,
  QuizEditorCreateResult,
  QuizEditorDraftDocument,
  QuizEditorSaveDraftInput,
  QuizEditorSaveDraftResult,
} from "@/features/lcms/quiz/quiz-editor/api/quiz-editor-api";
import { createClientIdempotencyKey } from "@/features/lcms/quiz/quiz-editor/components/quiz-editor-workspace-utils";
import { ApiClientError } from "@/lib/api-client";

import { DeviceStorageFullError, type DeviceDraftRecord, type QuizDraftDeviceStore } from "./quiz-draft-device-store";
import { chooseInitialDocument, NEW_QUIZ_PREFIX } from "./quiz-draft-initial-document";

export const SAVE_DEBOUNCE_MS = 2000;
export const RETRY_DELAYS_MS = [2000, 5000, 15000, 30000] as const;

export type QuizDraftSyncStatus =
  | { kind: "loading" }
  | { kind: "saved"; at: string | null }
  | { kind: "pending" }
  | { kind: "saving" }
  | { kind: "offline"; pendingEdits: number }
  | { kind: "signed-out" }
  | { kind: "conflict" }
  | { kind: "storage-full" }
  | { kind: "error"; message: string };

export type QuizDraftSyncApi = {
  createQuiz: (input: QuizEditorCreateInput) => Promise<QuizEditorCreateResult>;
  saveDraft: (input: QuizEditorSaveDraftInput) => Promise<QuizEditorSaveDraftResult>;
  loadDraft: (quizId: string) => Promise<QuizEditorDraftDocument>;
  uploadImages: (doc: QuizEditorDraftDocument) => Promise<QuizEditorDraftDocument>;
};

export type QuizDraftSyncDeps = {
  store: QuizDraftDeviceStore;
  scope: string;
  api: QuizDraftSyncApi;
  writerId: string;
  isOnline: () => boolean;
  now: () => Date;
  buildCreateInput: (doc: QuizEditorDraftDocument) => Omit<QuizEditorCreateInput, "idempotencyKey">;
  onQuizCreated?: (quizId: string) => void;
  /** False when the signed-in account is not the one that owns these edits: nothing is sent until it is true again. */
  canSend?: () => boolean;
};

export function classifySyncError(error: unknown): "network" | "stale" | "auth" | "other" {
  if (!(error instanceof ApiClientError)) return "other";
  if (error.code === "NETWORK_ERROR" || error.code === "REQUEST_TIMEOUT" || error.status === 0) return "network";
  if (error.status === 409 && error.code === "STALE_DRAFT") return "stale";
  // The first request under this idempotency key is still running on the server: retry it later like a network error.
  const retryable = (error.details as { retryable?: unknown } | undefined)?.retryable === true;
  if (error.status === 409 && (error.code === "SYNC_PENDING" || retryable)) return "network";
  if (error.status === 401) return "auth";
  return "other";
}

const newCreateKey = () => createClientIdempotencyKey("quiz-editor-create");
const quizIdForKey = (key: string) => (key.startsWith(NEW_QUIZ_PREFIX) ? null : key);
const pendingEdits = (record: DeviceDraftRecord) => record.revision - record.syncedRevision;

/**
 * Keeps one quiz draft on the device (every edit, at once) and on the server (2s after the last edit).
 * All record changes run one at a time through `serial`; only one send runs at a time (`again` queues the next).
 */
export class QuizDraftSyncEngine {
  private readonly deps: QuizDraftSyncDeps;
  private key: string;
  private record: DeviceDraftRecord | null = null;
  private recordJson = "";
  private currentStatus: QuizDraftSyncStatus = { kind: "loading" };
  private recoveredEdits: { pendingEdits: number; editedAt: string } | null = null;
  private readonly listeners = new Set<(status: QuizDraftSyncStatus) => void>();
  private timer: ReturnType<typeof setTimeout> | null = null;
  private sending: Promise<void> | null = null;
  private again = false;
  private retryIndex = 0;
  private storageFull = false;
  private disposed = false;
  /** closeAndFlush() runs: the last send may still go out, but nothing is scheduled or reported any more. */
  private closing = false;
  /** `writerId:revision` of the last other-tab record backed up, so the same record is never backed up twice. */
  private lastBackup = "";
  private queue: Promise<unknown> = Promise.resolve();

  constructor(deps: QuizDraftSyncDeps, key: string) {
    this.deps = deps;
    this.key = key;
  }

  get status(): QuizDraftSyncStatus {
    return this.currentStatus;
  }
  get quizId(): string | null {
    return this.record ? this.record.quizId : quizIdForKey(this.key);
  }
  get docVersion(): number {
    return this.record?.baseDocVersion ?? 0;
  }
  get hasUnsyncedChanges(): boolean {
    return this.record?.dirty ?? false;
  }
  get recovered(): { pendingEdits: number; editedAt: string } | null {
    return this.recoveredEdits;
  }

  start(serverDraft: QuizEditorDraftDocument | undefined): Promise<QuizEditorDraftDocument | null> {
    return this.serial(async () => {
      const device = await this.deps.store.get(this.deps.scope, this.key);
      if (this.disposed || this.closing) return null; // closed while starting: write nothing, arm no timer
      const { document, source } = chooseInitialDocument(device, serverDraft);
      this.recoveredEdits = null;
      if (source === "device" && device) {
        this.adopt(device);
        if (device.dirty) {
          this.recoveredEdits = { pendingEdits: pendingEdits(device), editedAt: device.editedAt };
          this.setStatus({ kind: "pending" });
          this.schedule(0);
        } else {
          this.setStatus({ kind: "saved", at: device.syncedAt });
        }
      } else if (source === "server" && serverDraft) {
        const revision = device?.revision ?? 0;
        await this.write({
          key: this.key,
          quizId: serverDraft.quizId,
          createIdempotencyKey: device?.createIdempotencyKey ?? newCreateKey(),
          baseDocVersion: serverDraft.docVersion,
          document: serverDraft,
          dirty: false,
          revision,
          syncedRevision: revision,
          editedAt: device?.editedAt ?? this.nowIso(),
          syncedAt: this.nowIso(),
          writerId: this.deps.writerId,
        });
        this.setStatus(this.storageFull ? { kind: "storage-full" } : { kind: "saved", at: null });
      } else {
        this.setStatus({ kind: "saved", at: null });
      }
      return document;
    });
  }

  edit(document: QuizEditorDraftDocument): Promise<void> {
    if (this.disposed) return Promise.resolve();
    return this.serial(async () => {
      const current = this.record;
      if (current && document === current.document) return;
      const json = JSON.stringify(document);
      if (current && json === this.recordJson) return;

      const { store, scope, writerId } = this.deps;
      const stored = await store.get(scope, this.key);
      const base = current ?? stored;
      const now = this.nowIso();
      const next: DeviceDraftRecord = {
        key: this.key,
        quizId: base ? base.quizId : quizIdForKey(this.key),
        createIdempotencyKey: base?.createIdempotencyKey ?? newCreateKey(),
        baseDocVersion: base?.baseDocVersion ?? document.docVersion,
        document,
        dirty: true,
        revision: (base?.revision ?? 0) + 1,
        syncedRevision: base?.syncedRevision ?? 0,
        editedAt: now,
        syncedAt: base?.syncedAt ?? null,
        writerId,
      };
      // Closed while queued: still keep the edit on the device; closeAndFlush sends it, no timer does.
      const sends = !this.disposed && !this.closing && this.currentStatus.kind !== "conflict";
      if (sends) this.schedule(SAVE_DEBOUNCE_MS);
      await this.write(next, json, this.otherTabBackup(stored, now));
      if (sends && this.currentStatus.kind !== "conflict") this.setStatus(this.idleStatus());
    });
  }

  async flushNow(): Promise<void> {
    if (this.disposed) return;
    await this.serial(async () => undefined); // let queued edits land first
    await this.send();
  }

  notifyOnline(): void {
    if (this.disposed || !this.deps.isOnline()) return;
    if (this.currentStatus.kind === "offline") this.setStatus(this.idleStatus());
    void this.send();
  }

  /** The connection dropped: show it now (and block publish), not only at the next send. */
  notifyOffline(): void {
    const { kind } = this.currentStatus;
    if (this.disposed || (kind !== "saved" && kind !== "pending" && kind !== "saving")) return;
    this.setStatus({ kind: "offline", pendingEdits: this.record ? pendingEdits(this.record) : 0 });
  }

  async resolveConflict(choice: "mine" | "server"): Promise<QuizEditorDraftDocument | null> {
    const quizId = this.record?.quizId;
    if (this.disposed || !quizId) return null;
    const server = await this.deps.api.loadDraft(quizId);
    if (this.disposed) return null;
    const { store, scope } = this.deps;
    const at = this.nowIso();
    await this.serial(async () => {
      const current = this.record;
      if (!current) return;
      // The backup goes first; if it fails nothing is overwritten and the conflict stays.
      if (choice === "mine") {
        await store.addBackup(scope, { key: this.key, reason: "conflict-mine", document: server, createdAt: at });
        await this.write({ ...current, baseDocVersion: server.docVersion });
      } else {
        await store.addBackup(scope, { key: this.key, reason: "conflict-server", document: current.document, createdAt: at });
        await this.write({ ...current, document: server, baseDocVersion: server.docVersion, dirty: false, syncedRevision: current.revision, syncedAt: at });
      }
    });
    if (this.disposed) return null;
    this.retryIndex = 0;
    if (choice === "server") {
      this.setStatus(this.storageFull ? { kind: "storage-full" } : { kind: "saved", at });
      return server;
    }
    this.setStatus({ kind: "pending" });
    await this.send();
    return null;
  }

  subscribe(listener: (status: QuizDraftSyncStatus) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  dispose(): void {
    this.disposed = true;
    this.clearTimer();
    this.listeners.clear();
  }

  /**
   * Sends the last pending state once (after any send in flight and queued edits), then disposes. Offline, signed
   * out or on a failure the edits stay dirty on the device: nothing retries and no listener hears about it.
   */
  async closeAndFlush(): Promise<void> {
    if (this.disposed || this.closing) return;
    this.closing = true;
    this.clearTimer();
    this.listeners.clear();
    try {
      await this.serial(async () => undefined); // let queued edits land first
      await this.send(); // joins a send in flight (`again`), so two never run at once
    } finally {
      this.dispose();
    }
  }

  private send(): Promise<void> {
    if (this.sending) {
      this.again = true;
      return this.sending;
    }
    this.sending = this.drain();
    return this.sending;
  }

  private async drain(): Promise<void> {
    try {
      let ok: boolean;
      do {
        this.again = false;
        ok = await this.sendOnce();
      } while (ok && this.again && !this.disposed);
    } finally {
      // Runs right after the loop check, so a send() asking for `again` can never fall in between.
      this.sending = null;
    }
  }

  /** Returns true when the send succeeded (or there was nothing to send), so a queued `again` may follow. */
  private async sendOnce(): Promise<boolean> {
    this.clearTimer();
    const record = this.record;
    if (this.disposed || this.currentStatus.kind === "conflict") return false;
    if (!record?.dirty) return true;
    if (this.deps.canSend && !this.deps.canSend()) {
      this.setStatus({ kind: "signed-out" }); // no retry timer: the next flush after the right sign-in sends
      return false;
    }
    if (!this.deps.isOnline()) {
      this.setStatus({ kind: "offline", pendingEdits: pendingEdits(record) });
      return false;
    }
    const { api } = this.deps;
    try {
      this.setStatus({ kind: "saving" });
      let { quizId, baseDocVersion } = record;
      if (quizId === null) {
        const created = await api.createQuiz({ ...this.deps.buildCreateInput(record.document), idempotencyKey: record.createIdempotencyKey });
        if (this.disposed) return false;
        try {
          await this.serial(() => this.rekey(created));
        } finally {
          // The quiz exists on the server even if the device write failed. A closed editor is not told.
          if (!this.disposed && !this.closing) this.deps.onQuizCreated?.(created.quizId);
        }
        if (this.disposed) return false;
        quizId = created.quizId;
        baseDocVersion = created.docVersion;
      }
      const sent = await api.uploadImages(record.document);
      if (this.disposed) return false;
      const result = await api.saveDraft({
        quizId,
        docVersion: baseDocVersion,
        settings: sent.settings,
        playerTemplate: sent.playerTemplate,
        tree: sent.tree,
        idempotencyKey: `quiz-editor-save:${quizId}:${baseDocVersion}:${record.revision}`,
      });
      if (!this.disposed) this.retryIndex = 0;
      // Runs after dispose too (compare-and-set), so the next engine does not resend a stale docVersion.
      await this.serial(() => this.markSynced(record.revision, result.docVersion, sent));
      if (this.disposed) return false;
      this.setStatus(this.idleStatus());
      return true;
    } catch (error) {
      if (!this.disposed) this.fail(error);
      return false;
    }
  }

  private fail(error: unknown): void {
    switch (classifySyncError(error)) {
      case "network": {
        this.setStatus({ kind: "offline", pendingEdits: this.record ? pendingEdits(this.record) : 0 });
        this.schedule(RETRY_DELAYS_MS[Math.min(this.retryIndex, RETRY_DELAYS_MS.length - 1)]);
        this.retryIndex += 1;
        return;
      }
      case "auth":
        this.setStatus({ kind: "signed-out" });
        return;
      case "stale":
        this.clearTimer();
        this.setStatus({ kind: "conflict" });
        return;
      default:
        this.setStatus({ kind: "error", message: error instanceof Error ? error.message : String(error) });
    }
  }

  private async rekey(created: QuizEditorCreateResult): Promise<void> {
    if (this.disposed || !this.record) return;
    const oldKey = this.key;
    this.key = created.quizId;
    const stored = await this.write({ ...this.record, key: created.quizId, quizId: created.quizId, baseDocVersion: created.docVersion });
    // Kept when the new copy could not be written: a retry re-creates with the same idempotency key.
    if (stored) await this.deps.store.remove(this.deps.scope, oldKey);
  }

  private async markSynced(revision: number, docVersion: number, sent: QuizEditorDraftDocument): Promise<void> {
    const synced = { baseDocVersion: docVersion, syncedRevision: revision, syncedAt: this.nowIso() };
    if (this.disposed) {
      // Compare-and-set on this tab's record: newer edits stay dirty, but must rebase on the version just saved.
      const { store, scope, writerId } = this.deps;
      const stored = await store.get(scope, this.key);
      if (stored?.writerId !== writerId || stored.syncedRevision >= revision || revision > stored.revision) return;
      const caughtUp = stored.revision === revision;
      await store.put(scope, { ...stored, ...synced, ...(caughtUp ? { dirty: false, document: sent } : {}) });
      return;
    }
    const current = this.record;
    if (!current) return;
    const stored = await this.deps.store.get(this.deps.scope, this.key);
    const caughtUp = current.revision === revision;
    // Server image URLs replace data URLs locally too, unless a newer edit arrived meanwhile. recordJson keeps the
    // pre-upload JSON, because the UI still holds the data URLs and would otherwise never match again.
    const next = { ...current, ...synced, dirty: !caughtUp, document: caughtUp ? sent : current.document };
    await this.write(next, this.recordJson, this.otherTabBackup(stored, synced.syncedAt));
  }

  /** Another tab's unsent edits that this engine never saw: a copy to keep before overwriting them, once per record. */
  private otherTabBackup(stored: DeviceDraftRecord | null, createdAt: string): (() => Promise<void>) | null {
    if (!stored?.dirty || stored.writerId === this.deps.writerId) return null;
    const id = `${stored.writerId}:${stored.revision}`;
    if (id === this.lastBackup || JSON.stringify(stored.document) === this.recordJson) return null;
    return async () => {
      await this.deps.store.addBackup(this.deps.scope, { key: this.key, reason: "other-tab", document: stored.document, createdAt });
      this.lastBackup = id;
    };
  }

  /** Keeps the record in memory, then stores it. Returns false when the device is full (the edit stays in memory). */
  private async write(record: DeviceDraftRecord, json?: string, backupFirst?: (() => Promise<void>) | null): Promise<boolean> {
    this.record = record;
    this.recordJson = json ?? JSON.stringify(record.document);
    try {
      await backupFirst?.();
      await this.deps.store.put(this.deps.scope, record);
      this.storageFull = false;
      return true;
    } catch (error) {
      if (!(error instanceof DeviceStorageFullError)) throw error;
      this.storageFull = true;
      return false;
    }
  }

  private adopt(record: DeviceDraftRecord): void {
    this.record = record;
    this.recordJson = JSON.stringify(record.document);
  }

  private idleStatus(): QuizDraftSyncStatus {
    const record = this.record;
    if (this.storageFull) return { kind: "storage-full" };
    if (!record?.dirty) return { kind: "saved", at: record?.syncedAt ?? null };
    if (!this.deps.isOnline()) return { kind: "offline", pendingEdits: pendingEdits(record) };
    return { kind: "pending" };
  }

  private serial<T>(fn: () => Promise<T>): Promise<T> {
    const run = this.queue.then(fn);
    this.queue = run.catch(() => undefined);
    return run;
  }

  private schedule(ms: number): void {
    this.clearTimer();
    if (this.disposed || this.closing) return; // no retry after close
    this.timer = setTimeout(() => {
      this.timer = null;
      void this.send();
    }, ms);
  }

  private clearTimer(): void {
    if (this.timer !== null) clearTimeout(this.timer);
    this.timer = null;
  }

  private setStatus(status: QuizDraftSyncStatus): void {
    if (this.disposed || this.closing) return;
    if (status.kind === "saved" && status.at !== null) this.recoveredEdits = null; // they reached the server
    this.currentStatus = status;
    for (const listener of this.listeners) listener(status);
  }

  private nowIso(): string {
    return this.deps.now().toISOString();
  }
}
