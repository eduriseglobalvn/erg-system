import { describe, expect, test } from "vitest";

import {
  parseDesktopReleaseManifest,
  selectDesktopReleaseArtifact,
} from "@/features/desktop-release/api/desktop-release-manifest";

const baseArtifact = {
  platform: "windows",
  architecture: "x86_64",
  installer: "nsis",
  version: "1.2.0",
  downloadUrl: "https://downloads.erg.edu.vn/desktop/1.2.0/windows-x86_64.exe",
  updaterDownloadUrl: "https://downloads.erg.edu.vn/desktop/1.2.0/windows-x86_64.nsis.zip",
  updaterSignature: "updater-signature",
  sha256: "a".repeat(64),
  signature: "base64-signature",
  sizeBytes: 1024,
  rolloutPercent: 100,
  publishedAt: "2026-08-09T00:00:00.000Z",
};

describe("parseDesktopReleaseManifest", () => {
  test("accepts a bounded signed manifest and selects a platform artifact", () => {
    const manifest = parseDesktopReleaseManifest({
      schemaVersion: 1,
      product: "erg-lms-desktop",
      channel: "stable",
      generatedAt: "2026-08-09T00:00:00.000Z",
      currentVersion: "1.2.0",
      artifacts: [baseArtifact],
    });

    expect(selectDesktopReleaseArtifact(manifest, { platform: "windows", architecture: "x86_64" })).toMatchObject({
      version: "1.2.0",
      updaterDownloadUrl: "https://downloads.erg.edu.vn/desktop/1.2.0/windows-x86_64.nsis.zip",
      updaterSignature: "updater-signature",
      installer: "nsis",
    });
  });

  test("rejects unsafe URLs, invalid checksums, rollout values, and malformed versions", () => {
    const invalidCases = [
      { ...baseArtifact, downloadUrl: "http://downloads.erg.edu.vn/file.exe" },
      { ...baseArtifact, downloadUrl: "https://evil.example/file.exe" },
      { ...baseArtifact, downloadUrl: "https://downloads.erg.edu.vn/file.exe?token=secret" },
      { ...baseArtifact, sha256: "not-a-sha" },
      { ...baseArtifact, rolloutPercent: 101 },
      { ...baseArtifact, version: "latest" },
    ];

    for (const artifact of invalidCases) {
      expect(() => parseDesktopReleaseManifest({ schemaVersion: 1, product: "erg-lms-desktop", channel: "stable", generatedAt: "2026-08-09T00:00:00.000Z", artifacts: [artifact] })).toThrow();
    }
  });

  test("filters revoked versions and excludes artifacts outside rollout", () => {
    const manifest = parseDesktopReleaseManifest({
      schemaVersion: 1,
      product: "erg-lms-desktop",
      channel: "stable",
      generatedAt: "2026-08-09T00:00:00.000Z",
      revokedVersions: ["1.2.0"],
      artifacts: [baseArtifact, { ...baseArtifact, platform: "darwin", installer: "dmg", downloadUrl: "https://downloads.erg.edu.vn/desktop/1.2.0/darwin-aarch64.dmg", architecture: "aarch64", rolloutPercent: 0 }],
    });

    expect(selectDesktopReleaseArtifact(manifest, { platform: "windows", architecture: "x86_64" })).toBeNull();
    expect(selectDesktopReleaseArtifact(manifest, { platform: "darwin", architecture: "aarch64" })).toBeNull();
  });

  test("rejects unsupported schema and oversized payloads before rendering", () => {
    expect(() => parseDesktopReleaseManifest({ ...baseArtifact, schemaVersion: 2, product: "erg-lms-desktop", channel: "stable", generatedAt: "2026-08-09T00:00:00.000Z", artifacts: [] })).toThrowError(/schema/i);
    expect(() => parseDesktopReleaseManifest({ schemaVersion: 1, product: "erg-lms-desktop", channel: "stable", generatedAt: "2026-08-09T00:00:00.000Z", artifacts: [{ ...baseArtifact, notes: "x".repeat(1_000_000) }] }, { maxBytes: 1024 })).toThrowError(/limit/i);
  });
});
