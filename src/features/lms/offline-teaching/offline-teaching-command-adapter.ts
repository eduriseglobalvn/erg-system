import type {
  JsonValue,
  OfflineMutation,
  OfflineOutboxScope,
  OfflineReplaySummary,
  OfflineSend,
} from "@/platform/offline";
import {
  createOfflineOutboxStore,
  OfflineOutbox,
} from "@/platform/offline";
import {
  resolveOfflineTeachingCapability,
  type BackendOfflineTeachingPolicySnapshot,
  type OfflineTeachingCapabilityResult,
  type OfflineTeachingOperation,
} from "./offline-teaching-policy";

export type OfflineTeachingCommandEnvelope<TPayload> = {
  payload: TPayload;
  operationId: string;
  idempotencyKey: string;
  expectedVersion?: number;
};

export type OfflineTeachingCommandInput<TPayload extends JsonValue> = {
  operation: OfflineTeachingOperation;
  entityType: string;
  entityId: string;
  payload: TPayload;
  operationId?: string;
  idempotencyKey?: string;
  expectedVersion?: number;
  send: (envelope: OfflineTeachingCommandEnvelope<TPayload>) => Promise<unknown>;
};

export type OfflineTeachingCommandResult<TValue> =
  | {
      status: "confirmed";
      value: TValue;
      operationId: string;
      idempotencyKey: string;
    }
  | {
      status: "pending";
      mutation: OfflineMutation;
      operationId: string;
      idempotencyKey: string;
    };

export type OfflineTeachingCommandAdapterOptions = {
  scope: OfflineOutboxScope;
  capability?: BackendOfflineTeachingPolicySnapshot | null;
  store?: ReturnType<typeof createOfflineOutboxStore>;
  isOnline?: () => boolean;
  now?: () => number;
  idFactory?: () => string;
};

export type OfflineTeachingCommandErrorCode =
  | "OFFLINE_CAPABILITY_UNAVAILABLE"
  | "INVALID_OPERATION"
  | "INVALID_SCOPE";

export class OfflineTeachingCommandError extends Error {
  public readonly code: OfflineTeachingCommandErrorCode;
  public readonly capability?: OfflineTeachingCapabilityResult;

  constructor(
    code: OfflineTeachingCommandErrorCode,
    message: string,
    capability?: OfflineTeachingCapabilityResult,
  ) {
    super(message);
    this.name = "OfflineTeachingCommandError";
    this.code = code;
    this.capability = capability;
  }
}

export function createOfflineTeachingCommandAdapter(options: OfflineTeachingCommandAdapterOptions) {
  const now = options.now ?? (() => Date.now());
  const idFactory = options.idFactory ?? defaultIdFactory;
  const outbox = new OfflineOutbox({
    idFactory,
    now,
    scope: options.scope,
    store: options.store ?? createOfflineOutboxStore(),
  });
  const isOnline = options.isOnline ?? defaultIsOnline;

  async function execute<TPayload extends JsonValue, TValue>(
    input: OfflineTeachingCommandInput<TPayload>,
  ): Promise<OfflineTeachingCommandResult<TValue>> {
    const operation = input.operation.trim();
    if (!operation) throw new OfflineTeachingCommandError("INVALID_OPERATION", "Offline operation is required.");
    if (!input.entityType.trim() || !input.entityId.trim()) {
      throw new OfflineTeachingCommandError("INVALID_SCOPE", "Offline entity type and id are required.");
    }

    const operationId = input.operationId?.trim() || `${operation}:${idFactory()}`;
    const idempotencyKey = input.idempotencyKey?.trim() || operationId;
    const capability = resolveOfflineTeachingCapability({
      operation,
      policy: options.capability,
      scope: options.scope,
      nowMs: now(),
    });

    if (!isOnline()) {
      return queueOrThrow(input, operationId, idempotencyKey, capability);
    }

    try {
      const value = await input.send({
        expectedVersion: input.expectedVersion,
        idempotencyKey,
        operationId,
        payload: input.payload,
      }) as TValue;
      return { idempotencyKey, operationId, status: "confirmed", value };
    } catch (error) {
      if (!isTransientNetworkError(error) || capability.status !== "ready") throw error;
      return queueOrThrow(input, operationId, idempotencyKey, capability);
    }
  }

  async function queueOrThrow<TPayload extends JsonValue, TValue>(
    input: OfflineTeachingCommandInput<TPayload>,
    operationId: string,
    idempotencyKey: string,
    capability: OfflineTeachingCapabilityResult,
  ): Promise<OfflineTeachingCommandResult<TValue>> {
    if (capability.status !== "ready") {
      throw new OfflineTeachingCommandError(
        "OFFLINE_CAPABILITY_UNAVAILABLE",
        "Offline teaching is unavailable until the server grants this operation.",
        capability,
      );
    }

    const mutation = await outbox.enqueue({
      entityId: input.entityId,
      entityType: input.entityType,
      expectedVersion: input.expectedVersion,
      idempotencyKey,
      operationId,
      payload: input.payload,
    });
    return { idempotencyKey, mutation, operationId, status: "pending" };
  }

  return {
    execute,
    list: () => outbox.list(),
    replay: (send: OfflineSend, replayOptions?: { isOnline?: () => boolean }): Promise<OfflineReplaySummary> =>
      outbox.replay(send, replayOptions),
    retry: (id: string) => outbox.retry(id),
    discard: (id: string) => outbox.discard(id),
    clear: () => outbox.clear(),
    scopeKey: outbox.scopeKey,
    resolveCapability: (operation: string, nowMs = now()) => resolveOfflineTeachingCapability({
      operation,
      policy: options.capability,
      scope: options.scope,
      nowMs,
    }),
  };
}

function isTransientNetworkError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { code?: string; status?: number; name?: string };
  return candidate.code === "NETWORK_ERROR" || candidate.code === "REQUEST_TIMEOUT" ||
    candidate.status === 0 || candidate.name === "TypeError";
}

function defaultIsOnline() {
  return typeof navigator === "undefined" || navigator.onLine;
}

function defaultIdFactory() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
