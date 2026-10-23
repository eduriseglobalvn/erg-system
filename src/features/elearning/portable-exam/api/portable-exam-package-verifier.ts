import {
  PORTABLE_EXAM_PACKAGE_FORMATS,
  PORTABLE_EXAM_SCHEMA_VERSION,
  PortableExamVerificationError,
  type PortableExamManifest,
  type PortableExamPackageEnvelope,
  type PortableExamVerificationOptions,
  type VerifiedPortableExamPackage,
} from "@/features/elearning/portable-exam/types/portable-exam-types";
import { portableAssetsById } from "@/features/elearning/portable-exam/api/portable-exam-assets";

export const DEFAULT_PORTABLE_EXAM_PACKAGE_BYTES = 16 * 1024 * 1024;
export const DEFAULT_PORTABLE_EXAM_ASSET_BYTES = 10 * 1024 * 1024;
export const DEFAULT_PORTABLE_EXAM_ASSET_COUNT = 500;

const SHA256_PATTERN = /^sha256:[0-9a-f]{64}$/;
const SECRET_KEY_PATTERN = /(access[_-]?token|refresh[_-]?token|id[_-]?token|authorization|cookie|password|secret|credential|private[_-]?key)/i;
const ANSWER_KEY_PATTERN = /^(answerkey|correctanswer|correctanswers|correctchoiceids|correctmatchingorder|correctsequenceorder|correctinlineselections|correcttextresponses|correctnumericvalue|correctdragwordplacements|correctdragdropplacements|solution)$/;

export async function verifyPortableExamPackage(
  input: unknown,
  options: PortableExamVerificationOptions = {},
): Promise<VerifiedPortableExamPackage> {
  const raw = requireRecord(input);
  const maxPackageBytes = options.maxPackageBytes ?? DEFAULT_PORTABLE_EXAM_PACKAGE_BYTES;
  const serialized = JSON.stringify(raw);
  if (!serialized || new TextEncoder().encode(serialized).byteLength > maxPackageBytes) {
    throw new PortableExamVerificationError("SIZE_LIMIT", `Portable package exceeds the ${maxPackageBytes}-byte limit.`);
  }

  const envelope = normalizeEnvelope(raw);
  const packagePayload = envelope.package;
  bindSignedAssetsManifest(envelope, packagePayload);
  const manifest = normalizeManifest(envelope);
  assertAssetBounds(envelope.assetsManifest, options);
  await verifyAssetDigests(envelope.assetsManifest);
  rejectUnsafePayload(packagePayload);
  if (manifest.gradingMode === "server-authoritative" && containsPortableAnswerMaterial(packagePayload)) {
    throw new PortableExamVerificationError("ANSWER_MATERIAL", "Server-authoritative packages cannot contain answer material.");
  }

  const nowMs = options.nowMs ?? Date.now();
  if (manifest.revokedAt) {
    throw new PortableExamVerificationError("REVOKED", "This portable package has been revoked.");
  }
  if (manifest.expiresAt) {
    const expiresAt = Date.parse(manifest.expiresAt);
    if (!Number.isFinite(expiresAt) || expiresAt <= nowMs) {
      throw new PortableExamVerificationError("EXPIRED", "This portable package has expired.");
    }
  }
  assertRuntimeCompatibility(manifest.minRuntimeVersion, options.runtimeVersion);
  if (manifest.downloadUrl) assertHttpsUrl(manifest.downloadUrl);

  const canonicalPayload = canonicalizePortablePackagePayload(packagePayload);
  const calculatedContentHash = await createPortableContentHash(canonicalPayload);
  if (calculatedContentHash !== manifest.contentHash) {
    throw new PortableExamVerificationError(
      "INVALID_CONTENT_HASH",
      "Portable package contentHash does not match its canonical payload.",
    );
  }
  const publicKeys = options.publicKeys ?? configuredPortablePublicKeys();
  const keyValue = publicKeys[manifest.publicKeyId];
  if (!keyValue) {
    throw new PortableExamVerificationError("KEY_NOT_TRUSTED", `No trusted public key is configured for ${manifest.publicKeyId}.`);
  }

  if (manifest.signatureAlgorithm.toLowerCase() !== "ed25519") {
    throw new PortableExamVerificationError("UNSUPPORTED_ALGORITHM", "Only Ed25519 portable package signatures are accepted.");
  }

  const verified = await verifyEd25519Signature({
    publicKey: keyValue,
    signature: manifest.signature,
    payload: canonicalPayload,
  });
  if (!verified) {
    throw new PortableExamVerificationError("INVALID_SIGNATURE", "Portable package signature verification failed.");
  }

  return {
    canonicalPayload,
    contentHash: manifest.contentHash,
    envelope,
    manifest,
    packagePayload,
  };
}

export function canonicalizePortablePackagePayload(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "string" || typeof value === "boolean") return JSON.stringify(value);
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new TypeError("Portable payload numbers must be finite.");
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map(canonicalizePortablePackagePayload).join(",")}]`;
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalizePortablePackagePayload(record[key])}`)
      .join(",")}}`;
  }
  throw new TypeError("Portable payload contains a non-JSON value.");
}

export async function createPortableContentHash(canonicalPayload: string): Promise<string> {
  const digest = await getCrypto().subtle.digest("SHA-256", new TextEncoder().encode(canonicalPayload));
  return `sha256:${Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

function normalizeEnvelope(raw: Record<string, unknown>): PortableExamPackageEnvelope {
  const nestedManifest = isRecord(raw.manifest) ? raw.manifest : {};
  const merged = { ...raw, ...nestedManifest };
  const packagePayload = merged.package;
  if (!isRecord(packagePayload)) {
    throw new PortableExamVerificationError("INVALID_ENVELOPE", "Portable package must contain an object payload.");
  }

  const rawSignatureBlock = isRecord(raw.signatureBlock) ? raw.signatureBlock : {};
  const nestedSignatureBlock = isRecord(nestedManifest.signatureBlock) ? nestedManifest.signatureBlock : {};
  const signatureBlock = {
    algorithm: stringValue(rawSignatureBlock.algorithm ?? nestedSignatureBlock.algorithm ?? merged.signatureAlgorithm, ""),
    contentHash: stringValue(rawSignatureBlock.contentHash ?? nestedSignatureBlock.contentHash ?? merged.contentHash, ""),
    signature: stringValue(rawSignatureBlock.signature ?? nestedSignatureBlock.signature ?? merged.signature, ""),
    publicKeyId: stringValue(rawSignatureBlock.publicKeyId ?? nestedSignatureBlock.publicKeyId ?? merged.publicKeyId, ""),
  };

  return {
    ...merged,
    package: packagePayload,
    signatureBlock,
  } as PortableExamPackageEnvelope;
}

function normalizeManifest(envelope: PortableExamPackageEnvelope): PortableExamManifest {
  const signatureBlock = envelope.signatureBlock ?? {};
  const schemaVersion = numberValue(envelope.schemaVersion, PORTABLE_EXAM_SCHEMA_VERSION);
  if (schemaVersion !== PORTABLE_EXAM_SCHEMA_VERSION) {
    throw new PortableExamVerificationError("UNSUPPORTED_SCHEMA", `Portable package schema ${schemaVersion} is not supported.`);
  }
  if (envelope.portableReady === false) {
    throw new PortableExamVerificationError("INVALID_ENVELOPE", "The backend has not marked this package as portable-ready.");
  }

  const packageFormat = stringValue(envelope.packageFormat, "");
  if (!PORTABLE_EXAM_PACKAGE_FORMATS.includes(packageFormat as (typeof PORTABLE_EXAM_PACKAGE_FORMATS)[number])) {
    throw new PortableExamVerificationError("INVALID_ENVELOPE", "Portable package format is invalid.");
  }
  const gradingMode = stringValue(envelope.gradingMode, "");
  if (gradingMode !== "client-first" && gradingMode !== "server-authoritative") {
    throw new PortableExamVerificationError("INVALID_ENVELOPE", "Portable grading mode is invalid.");
  }

  const contentHash = stringValue(signatureBlock.contentHash, "");
  if (!SHA256_PATTERN.test(contentHash)) {
    throw new PortableExamVerificationError("INVALID_CONTENT_HASH", "Portable package contentHash must be a SHA-256 value.");
  }
  const packageId = stringValue(envelope.packageId, "");
  const quizId = stringValue(envelope.quizId, "");
  const signature = stringValue(signatureBlock.signature, "");
  const publicKeyId = stringValue(signatureBlock.publicKeyId, "");
  const signatureAlgorithm = stringValue(signatureBlock.algorithm ?? envelope.signatureAlgorithm, "");
  if (!packageId || !quizId || !signature || !publicKeyId || !signatureAlgorithm) {
    throw new PortableExamVerificationError("INVALID_ENVELOPE", "Portable package identity and signature metadata are required.");
  }

  return {
    ...(envelope.artifactType ? { artifactType: envelope.artifactType } : {}),
    contentHash,
    ...(envelope.downloadUrl ? { downloadUrl: envelope.downloadUrl } : {}),
    ...(envelope.etag ? { etag: envelope.etag } : {}),
    ...(envelope.expiresAt ? { expiresAt: envelope.expiresAt } : {}),
    ...(envelope.generatedAt ? { generatedAt: envelope.generatedAt } : {}),
    gradingMode,
    ...(envelope.manifestVersion ? { manifestVersion: envelope.manifestVersion } : {}),
    ...(envelope.minRuntimeVersion ? { minRuntimeVersion: envelope.minRuntimeVersion } : {}),
    ...(typeof envelope.offlineGradable === "boolean" ? { offlineGradable: envelope.offlineGradable } : {}),
    packageFormat: packageFormat as PortableExamManifest["packageFormat"],
    packageId,
    ...(typeof envelope.portableReady === "boolean" ? { portableReady: envelope.portableReady } : {}),
    publicKeyId,
    quizId,
    ...(envelope.quizVersionId ? { quizVersionId: envelope.quizVersionId } : {}),
    ...(envelope.releaseChannel ? { releaseChannel: envelope.releaseChannel } : {}),
    ...(envelope.revokedAt ? { revokedAt: envelope.revokedAt } : {}),
    schemaVersion,
    signature,
    signatureAlgorithm,
    ...(typeof envelope.sizeBytes === "number" ? { sizeBytes: envelope.sizeBytes } : {}),
    ...(envelope.tenantId ? { tenantId: envelope.tenantId } : {}),
    ...(envelope.versionLabel ? { versionLabel: envelope.versionLabel } : {}),
    ...(typeof envelope.versionNumber === "number" ? { versionNumber: envelope.versionNumber } : {}),
  };
}

async function verifyEd25519Signature(input: { payload: string; publicKey: string; signature: string }) {
  try {
    const crypto = getCrypto();
    const key = await crypto.subtle.importKey(
      "spki",
      fromBase64(input.publicKey),
      { name: "Ed25519" },
      false,
      ["verify"],
    );
    return await crypto.subtle.verify(
      { name: "Ed25519" },
      key,
      fromBase64(input.signature),
      new TextEncoder().encode(input.payload),
    );
  } catch {
    return false;
  }
}

function assertAssetBounds(
  assets: unknown,
  options: PortableExamVerificationOptions,
) {
  if (!assets) return;
  const maxCount = options.maxAssetCount ?? DEFAULT_PORTABLE_EXAM_ASSET_COUNT;
  const maxBytes = options.maxAssetBytes ?? DEFAULT_PORTABLE_EXAM_ASSET_BYTES;
  const entries = [...portableAssetsById(assets).entries()];
  if (entries.length > maxCount) {
    throw new PortableExamVerificationError("SIZE_LIMIT", `Portable package contains more than ${maxCount} assets.`);
  }
  for (const [assetId, asset] of entries) {
    if (!isRecord(asset)) {
      throw new PortableExamVerificationError("INVALID_ENVELOPE", `Asset ${assetId} is invalid.`);
    }
    if (typeof asset.sizeBytes === "number" && (!Number.isSafeInteger(asset.sizeBytes) || asset.sizeBytes < 0 || asset.sizeBytes > maxBytes)) {
      throw new PortableExamVerificationError("SIZE_LIMIT", `Asset ${assetId} exceeds the ${maxBytes}-byte limit.`);
    }
    if (typeof asset.contentBase64 === "string") {
      try {
        if (fromBase64(asset.contentBase64).byteLength > maxBytes) {
          throw new PortableExamVerificationError("SIZE_LIMIT", `Asset ${assetId} exceeds the ${maxBytes}-byte limit.`);
        }
      } catch (error) {
        if (error instanceof PortableExamVerificationError) throw error;
        throw new PortableExamVerificationError("INVALID_ENVELOPE", `Asset ${assetId} is not valid base64.`);
      }
    }
    if (asset.url) assertHttpsUrl(asset.url);
  }
}

async function verifyAssetDigests(assets: unknown) {
  for (const [assetId, asset] of portableAssetsById(assets)) {
    if (!asset.contentBase64 || !asset.sha256) continue;
    if (!SHA256_PATTERN.test(asset.sha256)) {
      throw new PortableExamVerificationError("INVALID_CONTENT_HASH", `Asset ${assetId} has an invalid SHA-256 value.`);
    }
    const bytes = fromBase64(asset.contentBase64);
    const digest = await getCrypto().subtle.digest("SHA-256", bytes);
    const actual = `sha256:${Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
    if (actual !== asset.sha256) {
      throw new PortableExamVerificationError("INVALID_CONTENT_HASH", `Asset ${assetId} does not match its SHA-256 value.`);
    }
  }
}

function bindSignedAssetsManifest(
  envelope: PortableExamPackageEnvelope,
  packagePayload: Record<string, unknown>,
) {
  const signedAssets = isRecord(packagePayload.assetsManifest) ? packagePayload.assetsManifest : undefined;
  const exportedAssets = envelope.assetsManifest;
  if (exportedAssets && !signedAssets) {
    throw new PortableExamVerificationError("INVALID_ENVELOPE", "Portable assets must be included in the signed package payload.");
  }
  if (exportedAssets && signedAssets && canonicalizePortablePackagePayload(exportedAssets) !== canonicalizePortablePackagePayload(signedAssets)) {
    throw new PortableExamVerificationError("INVALID_CONTENT_HASH", "Portable assets do not match the signed package payload.");
  }
  if (signedAssets) envelope.assetsManifest = signedAssets as PortableExamPackageEnvelope["assetsManifest"];
}

function rejectUnsafePayload(value: unknown, parentKey = "", depth = 0): void {
  if (depth > 40) throw new PortableExamVerificationError("SIZE_LIMIT", "Portable package nesting is too deep.");
  if (typeof value === "string") {
    if (/^(?:javascript|data|file|blob):/i.test(value.trim())) {
      throw new PortableExamVerificationError("INVALID_URL", `${parentKey || "payload"} contains an unsafe URL.`);
    }
    return;
  }
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach((item) => rejectUnsafePayload(item, parentKey, depth + 1));
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    if (SECRET_KEY_PATTERN.test(key)) {
      throw new PortableExamVerificationError("INVALID_ENVELOPE", `${parentKey || "payload"}.${key} cannot be included in a portable package.`);
    }
    rejectUnsafePayload(child, key, depth + 1);
  }
}

export function containsPortableAnswerMaterial(value: unknown, parentKey = ""): boolean {
  if (Array.isArray(value)) return value.some((item) => containsPortableAnswerMaterial(item, parentKey));
  if (!value || typeof value !== "object") return false;
  return Object.entries(value).some(([key, child]) => {
    const normalizedKey = key.replace(/[_-]/g, "").toLowerCase();
    if (ANSWER_KEY_PATTERN.test(normalizedKey)) return true;
    if (normalizedKey === "correct" && child === true) return true;
    if (normalizedKey === "correctvalue" && parentKey !== "numericanswer") return true;
    return containsPortableAnswerMaterial(child, normalizedKey);
  });
}

function assertRuntimeCompatibility(required: string | undefined, actual: string | undefined) {
  if (!required) return;
  const requiredParts = parseVersion(required);
  const actualParts = parseVersion(actual ?? "");
  if (!requiredParts || !actualParts || compareVersions(actualParts, requiredParts) < 0) {
    throw new PortableExamVerificationError("MIN_RUNTIME", `Portable package requires runtime ${required}.`);
  }
}

function assertHttpsUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || !url.hostname) throw new Error("unsafe");
  } catch {
    throw new PortableExamVerificationError("INVALID_URL", "Portable package URLs must be absolute HTTPS URLs without credentials.");
  }
}

function parseVersion(value: string) {
  const normalized = value.trim().replace(/^[vV]/, "");
  const parts = normalized.split(".");
  if (!parts.length || parts.length > 3 || parts.some((part) => !/^\d+$/.test(part))) return null;
  return parts.map(Number).concat([0, 0, 0]).slice(0, 3);
}

function compareVersions(left: number[], right: number[]) {
  for (let index = 0; index < 3; index += 1) {
    if (left[index] !== right[index]) return left[index] - right[index];
  }
  return 0;
}

function configuredPortablePublicKeys(): Readonly<Record<string, string>> {
  const raw = import.meta.env?.VITE_PORTABLE_PACKAGE_PUBLIC_KEYS;
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    return isRecord(parsed)
      ? Object.fromEntries(Object.entries(parsed).filter((entry): entry is [string, string] => typeof entry[1] === "string"))
      : {};
  } catch {
    return {};
  }
}

function requireRecord(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) throw new PortableExamVerificationError("INVALID_ENVELOPE", "Portable package root must be an object.");
  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function stringValue(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function numberValue(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isSafeInteger(value) ? value : fallback;
}

function fromBase64(value: string) {
  try {
    const binary = atob(value);
    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
  } catch {
    throw new Error("invalid base64");
  }
}

function getCrypto(): Crypto {
  if (!globalThis.crypto?.subtle) throw new Error("Web Crypto is unavailable.");
  return globalThis.crypto;
}
