export const DESKTOP_RELEASE_SCHEMA_VERSION = 1 as const;
export const DESKTOP_RELEASE_CHANNELS = ["stable", "beta", "internal"] as const;
export const DESKTOP_RELEASE_PLATFORMS = ["windows", "darwin"] as const;
export const DESKTOP_RELEASE_ARCHITECTURES = ["x86_64", "aarch64"] as const;

export type DesktopReleaseChannel = (typeof DESKTOP_RELEASE_CHANNELS)[number];
export type DesktopReleasePlatform = (typeof DESKTOP_RELEASE_PLATFORMS)[number];
export type DesktopReleaseArchitecture = (typeof DESKTOP_RELEASE_ARCHITECTURES)[number];
export type DesktopInstallerKind = "nsis" | "msi" | "dmg";

export type DesktopReleaseArtifact = {
  architecture: DesktopReleaseArchitecture;
  downloadUrl: string;
  installer: DesktopInstallerKind;
  minimumRuntimeVersion?: string;
  notes?: string;
  platform: DesktopReleasePlatform;
  publishedAt: string;
  rolloutPercent: number;
  sha256: string;
  signature: string;
  sizeBytes: number;
  version: string;
  updaterDownloadUrl?: string;
  updaterSignature?: string;
};

export type DesktopReleaseManifest = {
  artifacts: readonly DesktopReleaseArtifact[];
  channel: DesktopReleaseChannel;
  generatedAt: string;
  product: "erg-lms-desktop";
  schemaVersion: typeof DESKTOP_RELEASE_SCHEMA_VERSION;
  revokedVersions?: readonly string[];
  currentVersion?: string;
};

export type DesktopReleaseManifestErrorCode =
  | "INVALID_ARTIFACT"
  | "INVALID_MANIFEST"
  | "INVALID_URL"
  | "SIZE_LIMIT"
  | "UNSUPPORTED_SCHEMA";

export class DesktopReleaseManifestError extends Error {
  public readonly code: DesktopReleaseManifestErrorCode;

  constructor(code: DesktopReleaseManifestErrorCode, message: string) {
    super(message);
    this.name = "DesktopReleaseManifestError";
    this.code = code;
  }
}
