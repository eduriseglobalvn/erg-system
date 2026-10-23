import assert from "node:assert/strict";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import test from "node:test";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const SCRIPT = resolve(ROOT, "scripts/desktop-release.mjs");
const GENERATED = resolve(ROOT, "src-tauri/tauri.release.generated.json");
const FIXTURE_DIR = resolve(ROOT, "tmp/desktop-release-test");

test("release config requires both updater keys", () => {
  assert.throws(() => execFileSync(process.execPath, [SCRIPT, "check-env"], { cwd: ROOT, stdio: "ignore", env: { ...process.env, TAURI_UPDATER_PUBLIC_KEY: "", TAURI_SIGNING_PRIVATE_KEY: "" } }));
});

test("release config injects only the public key and preserves HTTPS endpoint", () => {
  try {
    execFileSync(process.execPath, [SCRIPT, "prepare-config"], {
      cwd: ROOT,
      env: {
        ...process.env,
        TAURI_UPDATER_PUBLIC_KEY: "a".repeat(64),
        TAURI_SIGNING_PRIVATE_KEY: "b".repeat(64),
      },
    });
    assert.ok(existsSync(GENERATED));
    const config = JSON.parse(readFileSync(GENERATED, "utf8"));
    assert.equal(config.bundle.createUpdaterArtifacts, true);
    assert.equal(config.plugins.updater.pubkey, "a".repeat(64));
    assert.ok(config.plugins.updater.endpoints[0].startsWith("https://releases.erg.edu.vn/"));
  } finally {
    rmSync(GENERATED, { force: true });
  }
});

test("manifest command hashes artifacts and keeps output under the release directory", () => {
  mkdirSync(FIXTURE_DIR, { recursive: true });
  const artifact = resolve(FIXTURE_DIR, "ERG-LMS-Desktop_1.2.3_x64-setup.exe");
  const signature = resolve(FIXTURE_DIR, "ERG-LMS-Desktop_1.2.3_x64-setup.exe.sig");
  const updater = resolve(FIXTURE_DIR, "ERG-LMS-Desktop_1.2.3_x64.nsis.zip");
  const updaterSignature = resolve(FIXTURE_DIR, "ERG-LMS-Desktop_1.2.3_x64.nsis.zip.sig");
  const input = resolve(FIXTURE_DIR, "release-input.json");
  const output = resolve(ROOT, "deploy/desktop/releases/test/latest.json");
  try {
    writeFileSync(artifact, "signed-installer");
    writeFileSync(signature, "signature");
    writeFileSync(updater, "signed-updater");
    writeFileSync(updaterSignature, "updater-signature");
    writeFileSync(input, JSON.stringify({
      version: "1.2.3",
      channel: "stable",
      baseUrl: "https://downloads.erg.edu.vn/desktop",
      artifacts: [{ platform: "windows", architecture: "x86_64", installer: "nsis", path: artifact, signaturePath: signature, updaterPath: updater, updaterSignaturePath: updaterSignature }],
    }));
    execFileSync(process.execPath, [SCRIPT, "manifest", "--input", input, "--output", "deploy/desktop/releases/test/latest.json"], { cwd: ROOT });
    const manifest = JSON.parse(readFileSync(output, "utf8"));
    assert.equal(manifest.artifacts[0].downloadUrl, "https://downloads.erg.edu.vn/desktop/1.2.3/ERG-LMS-Desktop_1.2.3_x64-setup.exe");
    assert.equal(manifest.artifacts[0].sizeBytes, "signed-installer".length);
    assert.match(manifest.artifacts[0].sha256, /^[0-9a-f]{64}$/);
    assert.equal(manifest.artifacts[0].updaterSignature, "updater-signature");
    const feed = resolve(ROOT, "deploy/desktop/releases/test/feed.json");
    execFileSync(process.execPath, [SCRIPT, "feed", "--input", input, "--output", "deploy/desktop/releases/test/feed.json"], { cwd: ROOT });
    const updateFeed = JSON.parse(readFileSync(feed, "utf8"));
    assert.equal(updateFeed.platforms["windows-x86_64"].signature, "updater-signature");
  } finally {
    rmSync(FIXTURE_DIR, { recursive: true, force: true });
    rmSync(resolve(ROOT, "deploy/desktop/releases/test"), { recursive: true, force: true });
  }
});
