export const OFFLINE_OUTBOX_SCHEMA_VERSION = 2 as const;
export const OFFLINE_OUTBOX_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;
export const OFFLINE_OUTBOX_MAX_ENTRIES = 500;
export const OFFLINE_OUTBOX_MAX_ATTEMPTS = 8;

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export type OfflineOutboxScope = {
  tenantId: string;
  accountId: string;
  workspace: string;
};

export type OfflineMutationStatus = "pending" | "sending" | "retrying" | "conflict" | "failed" | "synced";

export type OfflineConflict = {
  code: string;
  operationId: string;
  idempotencyKey: string;
  entityType: string;
  entityId: string;
  expectedVersion?: number;
  actualVersion?: number;
  serverTime?: string;
  retryable?: boolean;
  message?: string;
};

export type OfflineMutation = {
  schemaVersion: typeof OFFLINE_OUTBOX_SCHEMA_VERSION;
  id: string;
  operationId: string;
  idempotencyKey: string;
  entityType: string;
  entityId: string;
  payload: JsonValue;
  payloadFingerprint: string;
  expectedVersion?: number;
  createdAt: number;
  updatedAt: number;
  attempts: number;
  nextAttemptAt: number;
  status: OfflineMutationStatus;
  lastError?: string;
  conflict?: OfflineConflict;
  serverVersion?: number;
};

export type OfflineMutationInput = {
  operationId?: string;
  idempotencyKey?: string;
  entityType: string;
  entityId: string;
  payload: JsonValue;
  expectedVersion?: number;
};

export type OfflineSendOutcome =
  | { kind: "succeeded"; serverVersion?: number }
  | { kind: "conflict"; conflict: OfflineConflict }
  | { kind: "retry"; reason?: string; retryAt?: number }
  | { kind: "failed"; reason?: string };

export type OfflineSend = (mutation: OfflineMutation) => Promise<OfflineSendOutcome>;

export type OfflineOutboxStore = {
  load: (scopeKey: string) => Promise<OfflineMutation[]>;
  save: (scopeKey: string, entries: OfflineMutation[]) => Promise<void>;
  clear: (scopeKey: string) => Promise<void>;
};

export type OfflineReplaySummary = {
  processed: number;
  succeeded: number;
  retried: number;
  conflicts: number;
  failed: number;
  skipped: number;
};

export type OfflineOutboxOptions = {
  scope: OfflineOutboxScope;
  store: OfflineOutboxStore;
  now?: () => number;
  idFactory?: () => string;
  retryBaseDelayMs?: number;
  maxAttempts?: number;
};

export class OfflineOutboxError extends Error {
  public readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = "OfflineOutboxError";
  }
}

export class OfflineOutbox {
  private readonly scopeKeyValue: string;
  private readonly now: () => number;
  private readonly idFactory: () => string;
  private readonly retryBaseDelayMs: number;
  private readonly maxAttempts: number;
  private entries: OfflineMutation[] | null = null;
  private replayPromise: Promise<OfflineReplaySummary> | null = null;
  private readonly options: OfflineOutboxOptions;

  constructor(options: OfflineOutboxOptions) {
    this.options = options;
    this.scopeKeyValue = offlineScopeKey(options.scope);
    this.now = options.now ?? (() => Date.now());
    this.idFactory = options.idFactory ?? defaultIdFactory;
    this.retryBaseDelayMs = options.retryBaseDelayMs ?? 1_000;
    this.maxAttempts = options.maxAttempts ?? OFFLINE_OUTBOX_MAX_ATTEMPTS;
  }

  get scopeKey() {
    return this.scopeKeyValue;
  }

  async list() {
    await this.ensureLoaded();
    return this.entries!.map(cloneMutation);
  }

  async enqueue(input: OfflineMutationInput) {
    await this.ensureLoaded();
    validateMutationInput(input);
    const fingerprint = fingerprintPayload(input.payload);
    const existing = this.entries!.find((entry) =>
      entry.operationId === input.operationId || entry.idempotencyKey === input.idempotencyKey,
    );
    if (existing) {
      if (existing.payloadFingerprint !== fingerprint ||
          (input.operationId && existing.operationId !== input.operationId) ||
          (input.idempotencyKey && existing.idempotencyKey !== input.idempotencyKey)) {
        throw new OfflineOutboxError("IDEMPOTENCY_CONFLICT", "The operation identifier was reused with a different payload.");
      }
      return cloneMutation(existing);
    }

    this.pruneExpired();
    if (this.entries!.length >= OFFLINE_OUTBOX_MAX_ENTRIES) {
      throw new OfflineOutboxError("OUTBOX_FULL", `Offline queue is limited to ${OFFLINE_OUTBOX_MAX_ENTRIES} operations.`);
    }

    const timestamp = this.now();
    const operationId = input.operationId?.trim() || `op-${this.idFactory()}`;
    const idempotencyKey = input.idempotencyKey?.trim() || operationId;
    const mutation: OfflineMutation = {
      schemaVersion: OFFLINE_OUTBOX_SCHEMA_VERSION,
      id: `outbox-${this.idFactory()}`,
      operationId,
      idempotencyKey,
      entityType: input.entityType.trim(),
      entityId: input.entityId.trim(),
      payload: cloneJson(input.payload),
      payloadFingerprint: fingerprint,
      expectedVersion: input.expectedVersion,
      createdAt: timestamp,
      updatedAt: timestamp,
      attempts: 0,
      nextAttemptAt: timestamp,
      status: "pending",
    };
    this.entries!.push(mutation);
    await this.persist();
    return cloneMutation(mutation);
  }

  async replay(send: OfflineSend, options?: { isOnline?: () => boolean }) {
    if (this.replayPromise) return this.replayPromise;
    this.replayPromise = this.runReplay(send, options).finally(() => {
      this.replayPromise = null;
    });
    return this.replayPromise;
  }

  async retry(id: string) {
    await this.ensureLoaded();
    const entry = this.entries!.find((candidate) => candidate.id === id);
    if (!entry) return false;
    if (entry.status !== "conflict" && entry.status !== "failed") return false;
    entry.status = "pending";
    entry.conflict = undefined;
    entry.lastError = undefined;
    entry.nextAttemptAt = this.now();
    entry.updatedAt = this.now();
    await this.persist();
    return true;
  }

  async discard(id: string) {
    await this.ensureLoaded();
    const before = this.entries!.length;
    this.entries = this.entries!.filter((entry) => entry.id !== id);
    if (this.entries!.length !== before) await this.persist();
    return this.entries!.length !== before;
  }

  async clear() {
    this.entries = [];
    await this.options.store.clear(this.scopeKeyValue);
  }

  private async runReplay(send: OfflineSend, options?: { isOnline?: () => boolean }): Promise<OfflineReplaySummary> {
    await this.ensureLoaded();
    this.pruneExpired();
    const summary: OfflineReplaySummary = { processed: 0, succeeded: 0, retried: 0, conflicts: 0, failed: 0, skipped: 0 };
    if (options?.isOnline && !options.isOnline()) {
      summary.skipped = this.entries!.filter((entry) => isReplayable(entry)).length;
      return summary;
    }

    const ordered = this.entries!
      .filter((entry) => isReplayable(entry) && entry.nextAttemptAt <= this.now())
      .sort((left, right) => left.createdAt - right.createdAt || left.id.localeCompare(right.id));
    summary.skipped = this.entries!.filter((entry) => isReplayable(entry) && !ordered.includes(entry)).length;

    for (const entry of ordered) {
      entry.status = "sending";
      entry.updatedAt = this.now();
      await this.persist();
      summary.processed += 1;
      try {
        const outcome = await send(cloneMutation(entry));
        if (outcome.kind === "succeeded") {
          entry.status = "synced";
          entry.serverVersion = outcome.serverVersion;
          entry.updatedAt = this.now();
          summary.succeeded += 1;
          await this.persist();
          continue;
        }
        if (outcome.kind === "conflict") {
          entry.status = "conflict";
          entry.conflict = cloneJson(outcome.conflict);
          entry.lastError = outcome.conflict.code;
          entry.updatedAt = this.now();
          summary.conflicts += 1;
          await this.persist();
          break;
        }
        if (outcome.kind === "failed") {
          markFailed(entry, outcome.reason ?? "Operation failed", this.now());
          summary.failed += 1;
          await this.persist();
          break;
        }
        const exhausted = markRetry(entry, outcome.reason ?? "Retryable offline operation", outcome.retryAt, this.now(), this.retryBaseDelayMs, this.maxAttempts);
        if (exhausted) summary.failed += 1;
        else summary.retried += 1;
        await this.persist();
        break;
      } catch (error) {
        const exhausted = markRetry(entry, error instanceof Error ? error.message : "Retryable offline operation", undefined, this.now(), this.retryBaseDelayMs, this.maxAttempts);
        if (exhausted) summary.failed += 1;
        else summary.retried += 1;
        await this.persist();
        break;
      }
    }
    return summary;
  }

  private async ensureLoaded() {
    if (this.entries) return;
    this.entries = migrateEntries(await this.options.store.load(this.scopeKeyValue), this.now);
    this.pruneExpired();
    await this.persist();
  }

  private pruneExpired() {
    if (!this.entries) return;
    const cutoff = this.now() - OFFLINE_OUTBOX_RETENTION_MS;
    this.entries = this.entries
      .filter((entry) => entry.createdAt >= cutoff)
      .sort((left, right) => left.createdAt - right.createdAt || left.id.localeCompare(right.id))
      .slice(-OFFLINE_OUTBOX_MAX_ENTRIES);
  }

  private async persist() {
    await this.options.store.save(this.scopeKeyValue, this.entries!.map(cloneMutation));
  }
}

export function offlineScopeKey(scope: OfflineOutboxScope) {
  const tenant = requiredScopePart(scope.tenantId, "tenantId");
  const account = requiredScopePart(scope.accountId, "accountId");
  const workspace = requiredScopePart(scope.workspace, "workspace");
  return `erg-offline:${encodeURIComponent(tenant)}:${encodeURIComponent(account)}:${encodeURIComponent(workspace)}`;
}

export function migrateEntries(entries: OfflineMutation[], now = Date.now): OfflineMutation[] {
  return entries.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    try {
      const payload = cloneJson(entry.payload);
      assertSafePayload(payload);
      return [{
        ...entry,
        schemaVersion: OFFLINE_OUTBOX_SCHEMA_VERSION,
        payload,
        payloadFingerprint: entry.payloadFingerprint || fingerprintPayload(payload),
        status: normalizeStatus(entry.status),
        attempts: Number.isFinite(entry.attempts) ? Math.max(0, entry.attempts) : 0,
        nextAttemptAt: Number.isFinite(entry.nextAttemptAt) ? entry.nextAttemptAt : now(),
        createdAt: Number.isFinite(entry.createdAt) ? entry.createdAt : now(),
        updatedAt: Number.isFinite(entry.updatedAt) ? entry.updatedAt : now(),
      } satisfies OfflineMutation];
    } catch {
      return [];
    }
  });
}

function validateMutationInput(input: OfflineMutationInput) {
  if (!input.entityType?.trim() || !input.entityId?.trim()) {
    throw new OfflineOutboxError("INVALID_MUTATION", "entityType and entityId are required.");
  }
  if (input.expectedVersion !== undefined && (!Number.isInteger(input.expectedVersion) || input.expectedVersion < 0)) {
    throw new OfflineOutboxError("INVALID_VERSION", "expectedVersion must be a non-negative integer.");
  }
  assertSafePayload(input.payload);
}

function assertSafePayload(value: JsonValue, path = "payload") {
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertSafePayload(item, `${path}[${index}]`));
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, item] of Object.entries(value)) {
    if (/(access[_-]?token|refresh[_-]?token|id[_-]?token|authorization|cookie|password|secret|credential|private[_-]?key)/i.test(key)) {
      throw new OfflineOutboxError("CREDENTIAL_PAYLOAD", `${path}.${key} cannot be stored offline.`);
    }
    assertSafePayload(item, `${path}.${key}`);
  }
}

function markRetry(entry: OfflineMutation, reason: string, retryAt: number | undefined, now: number, baseDelay: number, maxAttempts: number) {
  entry.attempts += 1;
  entry.lastError = reason;
  entry.updatedAt = now;
  if (entry.attempts >= maxAttempts) {
    markFailed(entry, reason, now);
    return true;
  }
  entry.status = "retrying";
  entry.nextAttemptAt = retryAt ?? now + baseDelay * 2 ** Math.max(0, entry.attempts - 1);
  return false;
}

function markFailed(entry: OfflineMutation, reason: string, now: number) {
  entry.status = "failed";
  entry.lastError = reason;
  entry.updatedAt = now;
  entry.nextAttemptAt = Number.POSITIVE_INFINITY;
}

function isReplayable(entry: OfflineMutation) {
  return entry.status === "pending" || entry.status === "retrying";
}

function normalizeStatus(status: OfflineMutationStatus | string): OfflineMutationStatus {
  if (status === "sending") return "pending";
  return ["pending", "retrying", "conflict", "failed", "synced"].includes(status) ? status as OfflineMutationStatus : "pending";
}

function requiredScopePart(value: string, field: string) {
  const normalized = value.trim();
  if (!normalized || normalized.length > 160) throw new OfflineOutboxError("INVALID_SCOPE", `${field} is required and must be short.`);
  return normalized;
}

function fingerprintPayload(payload: JsonValue) {
  return stableSerialize(payload);
}

function stableSerialize(value: JsonValue): string {
  if (Array.isArray(value)) return `[${value.map(stableSerialize).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableSerialize(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function cloneJson<T extends JsonValue>(value: T): T {
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value)) as T;
}

function cloneMutation(entry: OfflineMutation): OfflineMutation {
  return cloneJson(entry) as OfflineMutation;
}

function defaultIdFactory() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
