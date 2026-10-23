import { describe, expect, test } from "vitest";

import {
  MemoryScopedJsonStore,
  PortableExamPackageStore,
} from "@/features/elearning/portable-exam/api/portable-exam-package-store";
import type { PortableExamScope, VerifiedPortableExamPackage } from "@/features/elearning/portable-exam/types/portable-exam-types";

const scopeA: PortableExamScope = { tenantId: "tenant-a", accountId: "student-a", workspace: "STUDENT" };
const scopeB: PortableExamScope = { tenantId: "tenant-a", accountId: "student-b", workspace: "STUDENT" };

describe("PortableExamPackageStore", () => {
  test("isolates records by tenant, account, and workspace", async () => {
    const store = new PortableExamPackageStore(new MemoryScopedJsonStore());
    await store.save({ scope: scopeA, verified: verifiedPackage() });

    await expect(store.get({ scope: scopeA, packageId: "pkg-1" })).resolves.toMatchObject({ manifest: { packageId: "pkg-1" } });
    await expect(store.get({ scope: scopeB, packageId: "pkg-1" })).resolves.toBeNull();
  });

  test("removes expired and revoked records instead of returning stale content", async () => {
    const backing = new MemoryScopedJsonStore();
    const store = new PortableExamPackageStore(backing);
    await store.save({ scope: scopeA, verified: verifiedPackage(), nowMs: Date.parse("2026-08-09T00:00:00.000Z") });
    await expect(store.get({ scope: scopeA, packageId: "pkg-1", nowMs: Date.parse("2031-01-01T00:00:00.000Z") })).resolves.toBeNull();
    await expect(store.save({ scope: scopeA, verified: verifiedPackage({ expiresAt: "2020-01-01T00:00:00.000Z" }) })).rejects.toMatchObject({ code: "EXPIRED" });

    await expect(store.save({ scope: scopeA, verified: verifiedPackage({ revokedAt: "2026-08-01T00:00:00.000Z" }) })).rejects.toMatchObject({ code: "REVOKED" });
  });

  test("does not persist credentials or answer material for server-authoritative packages", async () => {
    const store = new PortableExamPackageStore(new MemoryScopedJsonStore());
    await expect(store.save({ scope: scopeA, verified: verifiedPackage({ packagePayload: { quiz: { id: "quiz-1" }, accessToken: "secret" } }) })).rejects.toMatchObject({ code: "CREDENTIAL_PAYLOAD" });
    await expect(store.save({ scope: scopeA, verified: verifiedPackage({ packagePayload: { quiz: { id: "quiz-1" }, answerKey: { q1: { correct: true } } } }) })).rejects.toMatchObject({ code: "ANSWER_MATERIAL" });
  });
});

function verifiedPackage(overrides: {
  expiresAt?: string;
  packagePayload?: Record<string, unknown>;
  revokedAt?: string;
} = {}): VerifiedPortableExamPackage {
  const envelope = {
    schemaVersion: 1,
    packageId: "pkg-1",
    quizId: "quiz-1",
    packageFormat: "single",
    gradingMode: "server-authoritative",
    package: overrides.packagePayload ?? { quiz: { id: "quiz-1" } },
    expiresAt: overrides.expiresAt ?? "2030-01-01T00:00:00.000Z",
    ...(overrides.revokedAt ? { revokedAt: overrides.revokedAt } : {}),
    signatureBlock: {
      algorithm: "Ed25519",
      contentHash: "sha256:" + "a".repeat(64),
      signature: "signature",
      publicKeyId: "key-1",
    },
  } as const;

  return {
    canonicalPayload: JSON.stringify(envelope.package),
    contentHash: envelope.signatureBlock.contentHash,
    envelope,
    manifest: {
      schemaVersion: 1,
      packageId: "pkg-1",
      quizId: "quiz-1",
      packageFormat: "single",
      gradingMode: "server-authoritative",
      contentHash: envelope.signatureBlock.contentHash,
      signature: envelope.signatureBlock.signature,
      publicKeyId: envelope.signatureBlock.publicKeyId,
      signatureAlgorithm: envelope.signatureBlock.algorithm,
      expiresAt: envelope.expiresAt,
      ...(overrides.revokedAt ? { revokedAt: overrides.revokedAt } : {}),
    },
    packagePayload: envelope.package,
  };
}
