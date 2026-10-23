import {
  DESKTOP_RELEASE_ARCHITECTURES,
  DESKTOP_RELEASE_CHANNELS,
  DESKTOP_RELEASE_PLATFORMS,
  DESKTOP_RELEASE_SCHEMA_VERSION,
  DesktopReleaseManifestError,
  type DesktopReleaseArchitecture,
  type DesktopReleaseArtifact,
  type DesktopReleaseManifest,
  type DesktopReleasePlatform,
} from "@/features/desktop-release/types/desktop-release-types";

export const DEFAULT_DESKTOP_RELEASE_ORIGINS = [
  "https://downloads.erg.edu.vn",
  "https://releases.erg.edu.vn",
] as const;
export const DEFAULT_DESKTOP_RELEASE_MANIFEST_BYTES = 1 * 1024 * 1024;

export function parseDesktopReleaseManifest(
  input: unknown,
  options: { allowedOrigins?: readonly string[]; maxBytes?: number } = {},
): DesktopReleaseManifest {
  const record = requireRecord(input);
  const maxBytes = options.maxBytes ?? DEFAULT_DESKTOP_RELEASE_MANIFEST_BYTES;
  const serialized = JSON.stringify(record);
  if (!serialized || new TextEncoder().encode(serialized).byteLength > maxBytes) {
    throw new DesktopReleaseManifestError("SIZE_LIMIT", `Desktop release manifest exceeds the ${maxBytes}-byte limit.`);
  }
  const schemaVersion = record.schemaVersion;
  if (schemaVersion !== DESKTOP_RELEASE_SCHEMA_VERSION) {
    throw new DesktopReleaseManifestError("UNSUPPORTED_SCHEMA", `Desktop release manifest schema ${String(schemaVersion)} is unsupported.`);
  }
  if (record.product !== "erg-lms-desktop") {
    throw new DesktopReleaseManifestError("INVALID_MANIFEST", "Desktop release product is invalid.");
  }
  const channel = record.channel;
  if (!isOneOf(channel, DESKTOP_RELEASE_CHANNELS)) {
    throw new DesktopReleaseManifestError("INVALID_MANIFEST", "Desktop release channel is invalid.");
  }
  const generatedAt = requiredDate(record.generatedAt, "generatedAt");
  const artifacts = record.artifacts;
  if (!Array.isArray(artifacts) || artifacts.length === 0 || artifacts.length > 32) {
    throw new DesktopReleaseManifestError("INVALID_MANIFEST", "Desktop release manifest must contain 1–32 artifacts.");
  }
  const allowedOrigins = options.allowedOrigins ?? configuredReleaseOrigins();
  const normalizedArtifacts = artifacts.map((artifact, index) => normalizeArtifact(artifact, index, allowedOrigins));
  const revokedVersions = normalizeRevokedVersions(record.revokedVersions);
  return {
    artifacts: normalizedArtifacts,
    channel,
    generatedAt,
    product: "erg-lms-desktop",
    schemaVersion: DESKTOP_RELEASE_SCHEMA_VERSION,
    ...(typeof record.currentVersion === "string" ? { currentVersion: assertVersion(record.currentVersion, "currentVersion") } : {}),
    ...(revokedVersions.length ? { revokedVersions } : {}),
  };
}

export function selectDesktopReleaseArtifact(
  manifest: DesktopReleaseManifest,
  target: { architecture: DesktopReleaseArchitecture; platform: DesktopReleasePlatform; rolloutBucket?: number },
): DesktopReleaseArtifact | null {
  const rolloutBucket = target.rolloutBucket ?? 100;
  if (!Number.isInteger(rolloutBucket) || rolloutBucket < 0 || rolloutBucket > 100) return null;
  const revoked = new Set(manifest.revokedVersions ?? []);
  return [...manifest.artifacts]
    .filter((artifact) =>
      artifact.platform === target.platform &&
      artifact.architecture === target.architecture &&
      !revoked.has(artifact.version) &&
      (rolloutBucket === 100 ? artifact.rolloutPercent > 0 : rolloutBucket < artifact.rolloutPercent),
    )
    .sort((left, right) => compareVersions(right.version, left.version))[0] ?? null;
}

function normalizeArtifact(value: unknown, index: number, allowedOrigins: readonly string[]): DesktopReleaseArtifact {
  const record = requireRecord(value, `artifacts[${index}]`);
  const platform = record.platform;
  const architecture = record.architecture;
  if (!isOneOf(platform, DESKTOP_RELEASE_PLATFORMS) || !isOneOf(architecture, DESKTOP_RELEASE_ARCHITECTURES)) {
    throw new DesktopReleaseManifestError("INVALID_ARTIFACT", `Artifact ${index} platform or architecture is invalid.`);
  }
  const installer = record.installer;
  if (installer !== "nsis" && installer !== "msi" && installer !== "dmg") {
    throw new DesktopReleaseManifestError("INVALID_ARTIFACT", `Artifact ${index} installer is invalid.`);
  }
  if (platform === "windows" && installer === "dmg") {
    throw new DesktopReleaseManifestError("INVALID_ARTIFACT", `Artifact ${index} has a macOS installer for Windows.`);
  }
  if (platform === "darwin" && installer !== "dmg") {
    throw new DesktopReleaseManifestError("INVALID_ARTIFACT", `Artifact ${index} must use a DMG installer for macOS.`);
  }
  const version = assertVersion(record.version, `artifacts[${index}].version`);
  const downloadUrl = assertReleaseUrl(record.downloadUrl, allowedOrigins);
  const hasUpdaterUrl = Object.prototype.hasOwnProperty.call(record, "updaterDownloadUrl");
  const hasUpdaterSignature = Object.prototype.hasOwnProperty.call(record, "updaterSignature");
  if (hasUpdaterUrl !== hasUpdaterSignature) {
    throw new DesktopReleaseManifestError("INVALID_ARTIFACT", `Artifact ${index} must include both updater URL and updater signature.`);
  }
  const updaterDownloadUrl = typeof record.updaterDownloadUrl === "string"
    ? assertReleaseUrl(record.updaterDownloadUrl, allowedOrigins)
    : undefined;
  const sha256 = requiredString(record.sha256, `artifacts[${index}].sha256`);
  if (!/^(?:sha256:)?[0-9a-f]{64}$/.test(sha256)) {
    throw new DesktopReleaseManifestError("INVALID_ARTIFACT", `Artifact ${index} SHA-256 is invalid.`);
  }
  const signature = requiredString(record.signature, `artifacts[${index}].signature`);
  if (signature.length > 4096) throw new DesktopReleaseManifestError("SIZE_LIMIT", `Artifact ${index} signature is too large.`);
  const updaterSignature = typeof record.updaterSignature === "string" ? record.updaterSignature.trim() : undefined;
  if (hasUpdaterSignature && !updaterSignature) throw new DesktopReleaseManifestError("INVALID_ARTIFACT", `Artifact ${index} updater signature is required.`);
  if (updaterSignature && updaterSignature.length > 4096) throw new DesktopReleaseManifestError("SIZE_LIMIT", `Artifact ${index} updater signature is too large.`);
  const sizeBytes = record.sizeBytes;
  if (typeof sizeBytes !== "number" || !Number.isSafeInteger(sizeBytes) || sizeBytes <= 0 || sizeBytes > 2 * 1024 * 1024 * 1024) {
    throw new DesktopReleaseManifestError("INVALID_ARTIFACT", `Artifact ${index} sizeBytes is invalid.`);
  }
  const rolloutPercent = record.rolloutPercent;
  if (typeof rolloutPercent !== "number" || !Number.isInteger(rolloutPercent) || rolloutPercent < 0 || rolloutPercent > 100) {
    throw new DesktopReleaseManifestError("INVALID_ARTIFACT", `Artifact ${index} rolloutPercent is invalid.`);
  }
  const publishedAt = requiredDate(record.publishedAt, `artifacts[${index}].publishedAt`);
  return {
    architecture,
    downloadUrl,
    installer,
    ...(typeof record.minimumRuntimeVersion === "string" ? { minimumRuntimeVersion: assertVersion(record.minimumRuntimeVersion, `artifacts[${index}].minimumRuntimeVersion`) } : {}),
    ...(typeof record.notes === "string" ? { notes: record.notes.slice(0, 20_000) } : {}),
    platform,
    publishedAt,
    rolloutPercent,
    sha256,
    signature,
    sizeBytes,
    version,
    ...(updaterDownloadUrl ? { updaterDownloadUrl } : {}),
    ...(updaterSignature ? { updaterSignature } : {}),
  };
}

function assertReleaseUrl(value: unknown, allowedOrigins: readonly string[]) {
  const raw = requiredString(value, "downloadUrl");
  try {
    const url = new URL(raw);
    const origin = url.origin.toLowerCase();
    if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash || !allowedOrigins.some((allowed) => allowed.toLowerCase() === origin)) {
      throw new Error("unsafe");
    }
    return url.toString();
  } catch {
    throw new DesktopReleaseManifestError("INVALID_URL", "Desktop release URLs must be HTTPS and use an approved release origin.");
  }
}

function configuredReleaseOrigins(): readonly string[] {
  const raw = import.meta.env?.VITE_DESKTOP_RELEASE_ORIGINS;
  if (!raw) return DEFAULT_DESKTOP_RELEASE_ORIGINS;
  const origins = raw.split(",").map((value: string) => value.trim()).filter(Boolean);
  return origins.length ? origins : DEFAULT_DESKTOP_RELEASE_ORIGINS;
}

function normalizeRevokedVersions(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string").map((item: string) => assertVersion(item, "revokedVersions"));
}

function assertVersion(value: unknown, field: string) {
  const version = requiredString(value, field);
  if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(version)) {
    throw new DesktopReleaseManifestError("INVALID_ARTIFACT", `${field} must be a semantic version.`);
  }
  return version;
}

function compareVersions(left: string, right: string) {
  const parse = (value: string) => value.split(/[+-]/, 1)[0].split(".").map(Number);
  const leftParts = parse(left);
  const rightParts = parse(right);
  for (let index = 0; index < 3; index += 1) {
    if (leftParts[index] !== rightParts[index]) return leftParts[index] - rightParts[index];
  }
  return left.localeCompare(right);
}

function requiredString(value: unknown, field: string) {
  if (typeof value !== "string" || !value.trim()) throw new DesktopReleaseManifestError("INVALID_MANIFEST", `${field} is required.`);
  return value.trim();
}

function requiredDate(value: unknown, field: string) {
  const date = requiredString(value, field);
  if (!Number.isFinite(Date.parse(date))) throw new DesktopReleaseManifestError("INVALID_MANIFEST", `${field} must be an RFC 3339 date.`);
  return date;
}

function requireRecord(value: unknown, label = "manifest"): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new DesktopReleaseManifestError("INVALID_MANIFEST", `${label} must be an object.`);
  return value as Record<string, unknown>;
}

function isOneOf<const T extends readonly string[]>(value: unknown, values: T): value is T[number] {
  return typeof value === "string" && values.includes(value);
}
