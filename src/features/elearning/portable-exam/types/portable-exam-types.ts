import type { QuizPackage } from "@/lib/types";

export const PORTABLE_EXAM_SCHEMA_VERSION = 1 as const;
export const PORTABLE_EXAM_PACKAGE_FORMATS = ["single", "bundle"] as const;
export type PortableExamPackageFormat = (typeof PORTABLE_EXAM_PACKAGE_FORMATS)[number];
export type PortableExamReleaseChannel = "stable" | "beta" | "internal" | (string & {});

export type PortableExamSignatureBlock = {
  algorithm: string;
  contentHash: string;
  signature: string;
  publicKeyId: string;
};

export type PortableExamAsset = {
  contentBase64?: string;
  mimeType?: string;
  sha256?: string;
  sizeBytes?: number;
  url?: string;
};

export type PortableExamManifest = {
  artifactType?: string;
  contentHash: string;
  downloadUrl?: string;
  etag?: string;
  expiresAt?: string;
  generatedAt?: string;
  gradingMode: QuizPackage["gradingMode"];
  manifestVersion?: string;
  minRuntimeVersion?: string;
  offlineGradable?: boolean;
  packageFormat: PortableExamPackageFormat;
  packageId: string;
  portableReady?: boolean;
  publicKeyId: string;
  quizId: string;
  quizVersionId?: string;
  releaseChannel?: PortableExamReleaseChannel;
  revokedAt?: string;
  schemaVersion: number;
  signature: string;
  signatureAlgorithm: string;
  sizeBytes?: number;
  tenantId?: string;
  versionLabel?: string;
  versionNumber?: number;
};

/**
 * The JSON document downloaded by the portable package endpoint. The backend
 * currently emits this flat bundle shape; `readPortableExamPackage` also
 * accepts a future `{ manifest, package, assetsManifest }` envelope and
 * normalizes it into this shape.
 */
export type PortableExamPackageEnvelope = {
  artifactType?: string;
  assetsManifest?: Record<string, PortableExamAsset>;
  bundleFormatVersion?: number;
  downloadUrl?: string;
  etag?: string;
  expiresAt?: string;
  generatedAt?: string;
  gradingMode?: string;
  minRuntimeVersion?: string;
  offlineGradable?: boolean;
  package: Record<string, unknown>;
  packageFormat?: string;
  packageId?: string;
  portableReady?: boolean;
  quizId?: string;
  quizVersionId?: string;
  releaseChannel?: string;
  revokedAt?: string;
  schemaVersion?: number;
  signatureAlgorithm?: string;
  signatureBlock?: Partial<PortableExamSignatureBlock>;
  sizeBytes?: number;
  tenantId?: string;
  versionLabel?: string;
  versionNumber?: number;
  /** Future envelope form; removed when normalized. */
  manifest?: Partial<PortableExamManifest>;
  manifestVersion?: string;
};

export type PortableExamVerificationErrorCode =
  | "ANSWER_MATERIAL"
  | "EXPIRED"
  | "INVALID_CONTENT_HASH"
  | "INVALID_ENVELOPE"
  | "INVALID_SIGNATURE"
  | "INVALID_URL"
  | "KEY_NOT_TRUSTED"
  | "MIN_RUNTIME"
  | "REVOKED"
  | "SIZE_LIMIT"
  | "UNSUPPORTED_ALGORITHM"
  | "UNSUPPORTED_SCHEMA";

export class PortableExamVerificationError extends Error {
  public readonly code: PortableExamVerificationErrorCode;

  constructor(code: PortableExamVerificationErrorCode, message: string) {
    super(message);
    this.name = "PortableExamVerificationError";
    this.code = code;
  }
}

export type PortableExamVerificationOptions = {
  maxAssetBytes?: number;
  maxAssetCount?: number;
  maxPackageBytes?: number;
  nowMs?: number;
  publicKeys?: Readonly<Record<string, string>>;
  runtimeVersion?: string;
};

export type VerifiedPortableExamPackage = {
  canonicalPayload: string;
  contentHash: string;
  envelope: PortableExamPackageEnvelope;
  manifest: PortableExamManifest;
  packagePayload: Record<string, unknown>;
};

export type PortableExamScope = {
  accountId: string;
  tenantId: string;
  workspace: "TEACHER" | "STUDENT";
};

export type StoredPortableExamPackage = {
  capturedAt: string;
  contentHash: string;
  envelope: PortableExamPackageEnvelope;
  manifest: PortableExamManifest;
  packagePayload: Record<string, unknown>;
  schemaVersion: typeof PORTABLE_EXAM_SCHEMA_VERSION;
};
