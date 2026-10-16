import {
  assertOfflineSafeJson,
  createOfflineScopedJsonStore,
  MemoryScopedJsonStore,
  type OfflineScopedJsonStore,
} from "@/platform/offline/offline-scoped-json-store";
import { offlineScopeKey } from "@/platform/offline/offline-outbox";
import {
  containsPortableAnswerMaterial,
} from "@/features/elearning/portable-exam/api/portable-exam-package-verifier";
import {
  PortableExamVerificationError,
  PORTABLE_EXAM_SCHEMA_VERSION,
  type PortableExamScope,
  type StoredPortableExamPackage,
  type VerifiedPortableExamPackage,
} from "@/features/elearning/portable-exam/types/portable-exam-types";

const PORTABLE_RECORD_PREFIX = "portable-exam:";

export { MemoryScopedJsonStore };

export class PortableExamPackageStore {
  private readonly store: OfflineScopedJsonStore;

  constructor(store: OfflineScopedJsonStore) {
    this.store = store;
  }

  async save(input: { scope: PortableExamScope; verified: VerifiedPortableExamPackage; nowMs?: number }) {
    assertPortableScope(input.scope);
    const { verified } = input;
    const nowMs = input.nowMs ?? Date.now();
    if (verified.manifest.revokedAt) {
      throw new PortableExamVerificationError("REVOKED", "Revoked portable packages cannot be stored.");
    }
    if (verified.manifest.expiresAt) {
      const expiresAt = Date.parse(verified.manifest.expiresAt);
      if (!Number.isFinite(expiresAt) || expiresAt <= nowMs) {
        throw new PortableExamVerificationError("EXPIRED", "Expired portable packages cannot be stored.");
      }
    }
    if (
      verified.manifest.gradingMode === "server-authoritative" &&
      containsPortableAnswerMaterial(verified.packagePayload)
    ) {
      throw new PortableExamVerificationError("ANSWER_MATERIAL", "Server-authoritative packages cannot be stored with answer material.");
    }
    if (verified.manifest.tenantId && verified.manifest.tenantId !== input.scope.tenantId) {
      throw new PortableExamVerificationError("INVALID_ENVELOPE", "Portable package tenant does not match the current account scope.");
    }

    const record: StoredPortableExamPackage = {
      capturedAt: new Date(nowMs).toISOString(),
      contentHash: verified.contentHash,
      envelope: verified.envelope,
      manifest: verified.manifest,
      packagePayload: verified.packagePayload,
      schemaVersion: PORTABLE_EXAM_SCHEMA_VERSION,
    };
    assertOfflineSafeJson(record);
    await this.store.set(offlineScopeKey(input.scope), recordKey(verified.manifest.packageId), record);
    return record;
  }

  async get(input: { scope: PortableExamScope; packageId: string; nowMs?: number }): Promise<StoredPortableExamPackage | null> {
    assertPortableScope(input.scope);
    const scopeKey = offlineScopeKey(input.scope);
    const key = recordKey(input.packageId);
    const record = await this.store.get<StoredPortableExamPackage>(scopeKey, key);
    if (!record) return null;
    const nowMs = input.nowMs ?? Date.now();
    if (
      record.schemaVersion !== PORTABLE_EXAM_SCHEMA_VERSION ||
      record.manifest.packageId !== input.packageId ||
      (record.manifest.tenantId && record.manifest.tenantId !== input.scope.tenantId) ||
      Boolean(record.manifest.revokedAt) ||
      isExpired(record.manifest.expiresAt, nowMs)
    ) {
      await this.store.remove(scopeKey, key);
      return null;
    }
    return record;
  }

  async list(scope: PortableExamScope) {
    assertPortableScope(scope);
    return this.store.list<StoredPortableExamPackage>(offlineScopeKey(scope));
  }

  async remove(input: { scope: PortableExamScope; packageId: string }) {
    assertPortableScope(input.scope);
    await this.store.remove(offlineScopeKey(input.scope), recordKey(input.packageId));
  }
}

export const portableExamPackageStore = new PortableExamPackageStore(
  createOfflineScopedJsonStore("portable-exam-packages-v1"),
);

function assertPortableScope(scope: PortableExamScope) {
  if (!scope.tenantId.trim() || !scope.accountId.trim() || !["TEACHER", "STUDENT"].includes(scope.workspace)) {
    throw new PortableExamVerificationError("INVALID_ENVELOPE", "Portable package scope must identify a Teacher or Student account.");
  }
}

function recordKey(packageId: string) {
  const normalized = packageId.trim();
  if (!normalized) throw new PortableExamVerificationError("INVALID_ENVELOPE", "Portable package id is required.");
  return `${PORTABLE_RECORD_PREFIX}${encodeURIComponent(normalized)}`;
}

function isExpired(value: string | undefined, nowMs: number) {
  if (!value) return false;
  const expiresAt = Date.parse(value);
  return !Number.isFinite(expiresAt) || expiresAt <= nowMs;
}
