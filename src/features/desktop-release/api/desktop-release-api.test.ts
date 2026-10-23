import { describe, expect, test, vi } from "vitest";

import {
  getDesktopReleaseManifestUrl,
  loadDesktopReleaseManifest,
} from "@/features/desktop-release/api/desktop-release-api";

const manifest = {
  schemaVersion: 1,
  product: "erg-lms-desktop",
  channel: "stable",
  generatedAt: "2026-08-09T00:00:00.000Z",
  artifacts: [
    {
      platform: "windows",
      architecture: "x86_64",
      installer: "nsis",
      version: "1.2.0",
      downloadUrl: "https://downloads.erg.edu.vn/desktop/1.2.0/windows.exe",
      sha256: "a".repeat(64),
      signature: "signed",
      sizeBytes: 1024,
      rolloutPercent: 100,
      publishedAt: "2026-08-09T00:00:00.000Z",
    },
  ],
};

describe("desktop release API", () => {
  test("uses the approved HTTPS release URL", () => {
    expect(getDesktopReleaseManifestUrl()).toBe("https://releases.erg.edu.vn/desktop/stable/latest.json");
  });

  test("loads without credentials and validates the manifest before returning it", async () => {
    const fetchImpl = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) =>
      new Response(JSON.stringify(manifest), { status: 200, headers: { "content-type": "application/json" } }),
    );
    await expect(loadDesktopReleaseManifest(fetchImpl)).resolves.toMatchObject({ product: "erg-lms-desktop" });
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://releases.erg.edu.vn/desktop/stable/latest.json",
      expect.objectContaining({ credentials: "omit", redirect: "error" }),
    );
  });

  test("rejects non-success responses before parsing", async () => {
    const fetchImpl = vi.fn(async () => new Response("nope", { status: 503 }));
    await expect(loadDesktopReleaseManifest(fetchImpl)).rejects.toThrow(/503/);
  });
});
