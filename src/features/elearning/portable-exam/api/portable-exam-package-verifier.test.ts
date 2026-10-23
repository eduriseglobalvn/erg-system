import { webcrypto } from "node:crypto";
import { afterAll, beforeAll, describe, expect, test, vi } from "vitest";

import {
  canonicalizePortablePackagePayload,
  createPortableContentHash,
  verifyPortableExamPackage,
} from "@/features/elearning/portable-exam/api/portable-exam-package-verifier";

const future = "2030-01-01T00:00:00.000Z";
let privateKey: CryptoKey;
let publicKey: CryptoKey;
let publicKeyValue = "";

beforeAll(async () => {
  vi.stubGlobal("crypto", webcrypto);
  const pair = await webcrypto.subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"]);
  privateKey = pair.privateKey;
  publicKey = pair.publicKey;
  publicKeyValue = toBase64(new Uint8Array(await webcrypto.subtle.exportKey("spki", publicKey)));
});

afterAll(() => vi.unstubAllGlobals());

describe("verifyPortableExamPackage", () => {
  test("verifies the backend bundle shape and returns a canonical payload", async () => {
    const envelope = await signedEnvelope();

    const verified = await verifyPortableExamPackage(envelope, {
      nowMs: Date.parse("2026-08-09T00:00:00.000Z"),
      publicKeys: { "release-key-1": publicKeyValue },
      runtimeVersion: "1.2.0",
    });

    expect(verified.manifest).toMatchObject({ packageId: "pkg-1", quizId: "quiz-1", gradingMode: "server-authoritative" });
    expect(verified.contentHash).toMatch(/^sha256:[0-9a-f]{64}$/);
    expect(verified.canonicalPayload).toBe(canonicalizePortablePackagePayload(verified.packagePayload));
  });

  test("accepts a nested manifest envelope and canonicalizes object key order", async () => {
    const flat = await signedEnvelope({ packagePayload: { z: 1, a: { d: true, c: "x" } } });
    const nested = {
      manifest: {
        schemaVersion: 1,
        packageId: flat.packageId,
        quizId: flat.quizId,
        packageFormat: flat.packageFormat,
        gradingMode: flat.gradingMode,
        contentHash: flat.signatureBlock?.contentHash,
        signature: flat.signatureBlock?.signature,
        publicKeyId: flat.signatureBlock?.publicKeyId,
        signatureAlgorithm: "Ed25519",
        expiresAt: future,
      },
      package: flat.package,
    };

    const verified = await verifyPortableExamPackage(nested, {
      nowMs: Date.parse("2026-08-09T00:00:00.000Z"),
      publicKeys: { "release-key-1": publicKeyValue },
    });

    expect(verified.canonicalPayload).toBe('{"a":{"c":"x","d":true},"z":1}');
  });

  test("rejects tampered payloads and unknown public keys", async () => {
    const envelope = await signedEnvelope();
    const tampered = { ...envelope, package: { ...envelope.package, quiz: { id: "tampered" } } };

    await expect(verifyPortableExamPackage(tampered, { publicKeys: { "release-key-1": publicKeyValue } })).rejects.toMatchObject({
      code: "INVALID_CONTENT_HASH",
    });
    await expect(verifyPortableExamPackage(envelope, { publicKeys: { other: publicKeyValue } })).rejects.toMatchObject({
      code: "KEY_NOT_TRUSTED",
    });
  });

  test("rejects a declared content hash that does not match the signed package payload", async () => {
    const mismatchedHash = await signedEnvelope({ contentHash: `sha256:${"f".repeat(64)}` });

    await expect(
      verifyPortableExamPackage(mismatchedHash, { publicKeys: { "release-key-1": publicKeyValue } }),
    ).rejects.toMatchObject({ code: "INVALID_CONTENT_HASH" });
  });

  test("fails closed for expiry, revocation, unsupported algorithms, and minimum runtime", async () => {
    const expired = await signedEnvelope({ expiresAt: "2020-01-01T00:00:00.000Z" });
    await expect(verifyPortableExamPackage(expired, { nowMs: Date.parse("2026-08-09T00:00:00.000Z"), publicKeys: { "release-key-1": publicKeyValue } })).rejects.toMatchObject({ code: "EXPIRED" });

    const revoked = await signedEnvelope({ revokedAt: "2026-08-01T00:00:00.000Z" });
    await expect(verifyPortableExamPackage(revoked, { publicKeys: { "release-key-1": publicKeyValue } })).rejects.toMatchObject({ code: "REVOKED" });

    const unsupported = await signedEnvelope({ signatureAlgorithm: "HMAC-SHA256" });
    await expect(verifyPortableExamPackage(unsupported, { publicKeys: { "release-key-1": publicKeyValue } })).rejects.toMatchObject({ code: "UNSUPPORTED_ALGORITHM" });

    const tooOld = await signedEnvelope({ minRuntimeVersion: "2.0.0" });
    await expect(verifyPortableExamPackage(tooOld, { runtimeVersion: "1.9.9", publicKeys: { "release-key-1": publicKeyValue } })).rejects.toMatchObject({ code: "MIN_RUNTIME" });
  });

  test("rejects answer material in server-authoritative packages and unsafe URLs", async () => {
    const withAnswer = await signedEnvelope({ packagePayload: { quiz: { id: "quiz-1" }, answerKey: { q1: { correct: true } } } });
    await expect(verifyPortableExamPackage(withAnswer, { publicKeys: { "release-key-1": publicKeyValue } })).rejects.toMatchObject({ code: "ANSWER_MATERIAL" });

    const withUnsafeUrl = await signedEnvelope({ downloadUrl: "javascript:alert(1)" });
    await expect(verifyPortableExamPackage(withUnsafeUrl, { publicKeys: { "release-key-1": publicKeyValue } })).rejects.toMatchObject({ code: "INVALID_URL" });
  });

  test("enforces package and asset bounds and validates the content hash format", async () => {
    const envelope = await signedEnvelope({ packagePayload: { quiz: { id: "quiz-1" }, payload: "1234567890" } });
    await expect(verifyPortableExamPackage(envelope, { maxPackageBytes: 20, publicKeys: { "release-key-1": publicKeyValue } })).rejects.toMatchObject({ code: "SIZE_LIMIT" });

    const largeAsset = await signedEnvelope({ assetsManifest: { image: { sizeBytes: 99, url: "https://cdn.erg.edu.vn/image.png" } } });
    await expect(verifyPortableExamPackage(largeAsset, { maxAssetBytes: 10, publicKeys: { "release-key-1": publicKeyValue } })).rejects.toMatchObject({ code: "SIZE_LIMIT" });

    const invalidHash = await signedEnvelope({ contentHash: "sha256:not-a-hash" });
    await expect(verifyPortableExamPackage(invalidHash, { publicKeys: { "release-key-1": publicKeyValue } })).rejects.toMatchObject({ code: "INVALID_CONTENT_HASH" });
  });
});

async function signedEnvelope(options: {
  assetsManifest?: Record<string, { sizeBytes?: number; url?: string }>;
  contentHash?: string;
  downloadUrl?: string;
  expiresAt?: string;
  gradingMode?: string;
  minRuntimeVersion?: string;
  packagePayload?: Record<string, unknown>;
  portableReady?: boolean;
  revokedAt?: string;
  signatureAlgorithm?: string;
} = {}) {
  const packagePayload = {
    ...(options.packagePayload ?? { quiz: { id: "quiz-1", title: "IC3" } }),
    ...(options.assetsManifest ? { assetsManifest: options.assetsManifest } : {}),
  };
  const canonical = canonicalizePortablePackagePayload(packagePayload);
  const contentHash = options.contentHash ?? await createPortableContentHash(canonical);
  const signature = toBase64(new Uint8Array(await webcrypto.subtle.sign("Ed25519", privateKey, new TextEncoder().encode(canonical))));
  return {
    schemaVersion: 1,
    bundleFormatVersion: 1,
    packageId: "pkg-1",
    quizId: "quiz-1",
    packageFormat: "single",
    gradingMode: options.gradingMode ?? "server-authoritative",
    package: packagePayload,
    ...(options.assetsManifest ? { assetsManifest: options.assetsManifest } : {}),
    ...(options.downloadUrl ? { downloadUrl: options.downloadUrl } : { downloadUrl: "https://cdn.erg.edu.vn/pkg-1.ergquiz" }),
    ...(options.expiresAt ? { expiresAt: options.expiresAt } : { expiresAt: future }),
    ...(options.minRuntimeVersion ? { minRuntimeVersion: options.minRuntimeVersion } : {}),
    ...(options.revokedAt ? { revokedAt: options.revokedAt } : {}),
    ...(options.portableReady === false ? { portableReady: false } : { portableReady: true }),
    signatureAlgorithm: options.signatureAlgorithm ?? "Ed25519",
    signatureBlock: {
      algorithm: options.signatureAlgorithm ?? "Ed25519",
      contentHash,
      signature,
      publicKeyId: "release-key-1",
    },
  };
}

function toBase64(value: Uint8Array) {
  let binary = "";
  for (let index = 0; index < value.length; index += 0x8000) {
    binary += String.fromCharCode(...value.subarray(index, index + 0x8000));
  }
  return btoa(binary);
}
