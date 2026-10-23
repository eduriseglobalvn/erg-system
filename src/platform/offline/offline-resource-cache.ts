import {
  assertOfflineSafeJson,
  MemoryScopedJsonStore,
  type OfflineScopedJsonStore,
} from "@/platform/offline/offline-scoped-json-store";
import { offlineScopeKey, type OfflineOutboxScope } from "@/platform/offline/offline-outbox";

export type OfflineResourceScope = OfflineOutboxScope;

export type OfflineResourceCachePolicy = {
  allowedResourceIds: string[];
  maxBytes: number;
  maxItems: number;
  expiresAt: string;
};

export type OfflineResourceCacheInput = {
  scope: OfflineResourceScope;
  resourceId: string;
  fileType: string;
  launchMode: string;
  accessState: string;
  isDownloadable: boolean;
  bytes: Uint8Array;
  mimeType: string;
  policy: OfflineResourceCachePolicy;
  metadata?: Record<string, unknown>;
};

export type OfflineResourceCacheEntry = {
  resourceId: string;
  mimeType: string;
  byteLength: number;
  createdAt: number;
  expiresAt: string;
};

export class OfflineResourceCacheError extends Error {
  public readonly code: "RESOURCE_NOT_ALLOWED" | "QUOTA_EXCEEDED" | "CREDENTIAL_PAYLOAD" | "INVALID_RESOURCE";

  constructor(code: OfflineResourceCacheError["code"], message: string) {
    super(message);
    this.code = code;
    this.name = "OfflineResourceCacheError";
  }
}

type StoredResource = OfflineResourceCacheEntry & { bytesBase64: string };

export class OfflineResourceCache {
  private readonly store: OfflineScopedJsonStore;
  private readonly now: () => number;

  constructor(
    store: OfflineScopedJsonStore,
    now: () => number = () => Date.now(),
  ) {
    this.store = store;
    this.now = now;
  }

  async put(input: OfflineResourceCacheInput) {
    validateResourceInput(input, this.now());
    const scopeKey = offlineScopeKey(input.scope);
    const records = await this.store.list<StoredResource>(scopeKey);
    const current = records
      .map(({ recordKey, value }) => ({ recordKey, value }))
      .filter(({ value }) => value.expiresAt && Date.parse(value.expiresAt) > this.now() && value.byteLength >= 0);

    const key = resourceRecordKey(input.resourceId);
    const withoutCurrent = current.filter(({ recordKey }) => recordKey !== key);
    const next: StoredResource = {
      resourceId: input.resourceId,
      mimeType: input.mimeType,
      byteLength: input.bytes.byteLength,
      createdAt: this.now(),
      expiresAt: input.policy.expiresAt,
      bytesBase64: toBase64(input.bytes),
    };
    withoutCurrent.push({ recordKey: key, value: next });

    const evictedIds: string[] = [];
    while (
      withoutCurrent.length > input.policy.maxItems ||
      withoutCurrent.reduce((sum, item) => sum + item.value.byteLength, 0) > input.policy.maxBytes
    ) {
      const oldest = withoutCurrent.shift();
      if (!oldest) break;
      evictedIds.push(oldest.value.resourceId);
    }

    if (!withoutCurrent.some(({ recordKey }) => recordKey === key)) {
      throw new OfflineResourceCacheError("QUOTA_EXCEEDED", "The resource does not fit the offline cache quota.");
    }

    await this.store.clear(scopeKey);
    await Promise.all(withoutCurrent.map(({ recordKey, value }) => this.store.set(scopeKey, recordKey, value)));
    return { status: "stored" as const, evictedIds };
  }

  async get(input: { scope: OfflineResourceScope; resourceId: string; nowMs?: number }) {
    const scopeKey = offlineScopeKey(input.scope);
    const stored = await this.store.get<StoredResource>(scopeKey, resourceRecordKey(input.resourceId));
    if (!stored) return null;
    const nowMs = input.nowMs ?? this.now();
    if (!Number.isFinite(Date.parse(stored.expiresAt)) || Date.parse(stored.expiresAt) <= nowMs) {
      await this.store.remove(scopeKey, resourceRecordKey(input.resourceId));
      return null;
    }
    return {
      ...stored,
      bytes: fromBase64(stored.bytesBase64),
    };
  }

  async list(scope: OfflineResourceScope, nowMs = this.now()): Promise<OfflineResourceCacheEntry[]> {
    const scopeKey = offlineScopeKey(scope);
    const records = await this.store.list<StoredResource>(scopeKey);
    const fresh = records.filter(({ value }) => Date.parse(value.expiresAt) > nowMs);
    const expired = records.filter(({ value }) => Date.parse(value.expiresAt) <= nowMs);
    await Promise.all(expired.map(({ recordKey }) => this.store.remove(scopeKey, recordKey)));
    return fresh.map(({ value }) => ({
      resourceId: value.resourceId,
      mimeType: value.mimeType,
      byteLength: value.byteLength,
      createdAt: value.createdAt,
      expiresAt: value.expiresAt,
    }));
  }

  async clear(scope: OfflineResourceScope) {
    await this.store.clear(offlineScopeKey(scope));
  }
}

export { MemoryScopedJsonStore };

function validateResourceInput(input: OfflineResourceCacheInput, nowMs: number) {
  try {
    assertOfflineSafeJson(input.metadata ?? {});
  } catch (error) {
    if (error instanceof Error && "code" in error && (error as { code?: string }).code === "CREDENTIAL_PAYLOAD") {
      throw new OfflineResourceCacheError("CREDENTIAL_PAYLOAD", error.message);
    }
    throw error;
  }
  if (
    !input.resourceId.trim() ||
    !input.mimeType.trim() ||
    !input.bytes.byteLength ||
    !input.isDownloadable ||
    input.accessState !== "open" ||
    input.launchMode === "external" ||
    input.fileType === "LINK" ||
    !input.policy.allowedResourceIds.includes(input.resourceId)
  ) {
    throw new OfflineResourceCacheError("RESOURCE_NOT_ALLOWED", "This resource is not approved for offline use.");
  }
  if (!Number.isInteger(input.policy.maxBytes) || input.policy.maxBytes <= 0 || !Number.isInteger(input.policy.maxItems) || input.policy.maxItems <= 0) {
    throw new OfflineResourceCacheError("INVALID_RESOURCE", "The offline resource quota is invalid.");
  }
  const expiresAtMs = Date.parse(input.policy.expiresAt);
  if (!Number.isFinite(expiresAtMs) || expiresAtMs <= nowMs) {
    throw new OfflineResourceCacheError("RESOURCE_NOT_ALLOWED", "The offline resource approval has expired.");
  }
  if (input.bytes.byteLength > input.policy.maxBytes) {
    throw new OfflineResourceCacheError("QUOTA_EXCEEDED", "The resource is larger than the offline cache quota.");
  }
}

function resourceRecordKey(resourceId: string) {
  return `resource:${resourceId}`;
}

function toBase64(value: Uint8Array) {
  let binary = "";
  for (let index = 0; index < value.length; index += 0x8000) {
    binary += String.fromCharCode(...value.subarray(index, index + 0x8000));
  }
  return btoa(binary);
}

function fromBase64(value: string) {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}
