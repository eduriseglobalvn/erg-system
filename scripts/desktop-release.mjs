import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const TEMPLATE_PATH = resolve(ROOT, "src-tauri/tauri.release.template.json");
const GENERATED_CONFIG_PATH = resolve(ROOT, "src-tauri/tauri.release.generated.json");
const PUBLIC_KEY_ENV = "TAURI_UPDATER_PUBLIC_KEY";
const PRIVATE_KEY_ENV = "TAURI_SIGNING_PRIVATE_KEY";

const command = process.argv[2] ?? "help";

if (command === "prepare-config") {
  const config = prepareReleaseConfig();
  writeFileSync(GENERATED_CONFIG_PATH, `${JSON.stringify(config, null, 2)}\n`, "utf8");
  console.log(`Prepared ${GENERATED_CONFIG_PATH}`);
} else if (command === "check-env") {
  assertReleaseSecrets();
  console.log("Desktop release signing environment is ready.");
} else if (command === "build") {
  assertReleaseSecrets();
  prepareReleaseConfig();
  const executable = process.platform === "win32" ? "bun.exe" : "bun";
  const buildArgs = ["x", "tauri", "build", "--config", GENERATED_CONFIG_PATH];
  if (process.env.ERG_TAURI_TARGET?.trim()) buildArgs.push("--target", process.env.ERG_TAURI_TARGET.trim());
  const result = spawnSync(executable, buildArgs, {
    cwd: ROOT,
    env: process.env,
    stdio: "inherit",
  });
  process.exit(result.status ?? 1);
} else if (command === "sha256") {
  const path = process.argv[3];
  if (!path) fail("Usage: bun run desktop:release:sha256 -- <artifact-path>");
  const absolutePath = resolve(ROOT, path);
  if (!existsSync(absolutePath)) fail(`Artifact does not exist: ${absolutePath}`);
  console.log(createHash("sha256").update(readFileSync(absolutePath)).digest("hex"));
} else if (command === "manifest") {
  const inputPath = flagValue("--input");
  const outputPath = flagValue("--output");
  if (!inputPath || !outputPath) fail("Usage: bun run desktop:release:manifest -- --input <release-input.json> --output <manifest.json>");
  const manifest = buildManifest(inputPath, outputPath);
  console.log(`Wrote ${manifest.artifacts.length} artifact(s) to ${resolve(ROOT, outputPath)}`);
} else if (command === "feed") {
  const inputPath = flagValue("--input");
  const outputPath = flagValue("--output");
  if (!inputPath || !outputPath) fail("Usage: bun run desktop:release:feed -- --input <release-input.json> --output <tauri-feed.json>");
  const manifest = buildManifest(inputPath, outputPath, { write: false });
  const feed = buildTauriFeed(manifest);
  const outputAbsolute = resolveInsideRoot(outputPath);
  if (!outputAbsolute.startsWith(resolve(ROOT, "deploy/desktop/releases"))) fail("Desktop feeds must be written under deploy/desktop/releases.");
  mkdirSync(dirname(outputAbsolute), { recursive: true });
  writeFileSync(outputAbsolute, `${JSON.stringify(feed, null, 2)}\n`, "utf8");
  console.log(`Wrote ${Object.keys(feed.platforms).length} updater platform(s) to ${outputAbsolute}`);
} else {
  console.log([
    "Desktop release commands:",
    "  bun run desktop:release:check-env",
    "  bun run desktop:release:prepare-config",
    "  bun run desktop:release:build",
    "  bun run desktop:release:manifest -- --input deploy/desktop/releases/release-input.json --output deploy/desktop/releases/stable/latest.json",
    "  bun run desktop:release:feed -- --input deploy/desktop/releases/release-input.json --output deploy/desktop/releases/feed/stable.json",
    "  bun run desktop:release:sha256 -- src-tauri/target/release/bundle/nsis/ERG-LMS-Desktop_0.1.0_x64-setup.exe",
  ].join("\n"));
}

function buildManifest(inputPath, outputPath, options = { write: true }) {
  const inputAbsolute = resolveInsideRoot(inputPath);
  const outputAbsolute = resolveInsideRoot(outputPath);
  if (!outputAbsolute.startsWith(resolve(ROOT, "deploy/desktop/releases"))) {
    fail("Desktop release manifests must be written under deploy/desktop/releases.");
  }
  const input = JSON.parse(readFileSync(inputAbsolute, "utf8"));
  const version = assertVersion(input.version, "version");
  if (!['stable', 'beta', 'internal'].includes(input.channel)) fail("Release channel is invalid.");
  const baseUrl = assertBaseUrl(input.baseUrl);
  if (!Array.isArray(input.artifacts) || input.artifacts.length === 0 || input.artifacts.length > 32) fail("Release input must contain 1-32 artifacts.");
  const artifacts = input.artifacts.map((item, index) => {
    const artifactPath = resolveInsideRoot(item.path);
    const signaturePath = resolveInsideRoot(item.signaturePath);
    if (!existsSync(artifactPath) || !existsSync(signaturePath)) fail(`Artifact ${index} or its signature file is missing.`);
    const platform = item.platform;
    const architecture = item.architecture;
    const installer = item.installer;
    if (!['windows', 'darwin'].includes(platform) || !['x86_64', 'aarch64'].includes(architecture) || !['nsis', 'msi', 'dmg'].includes(installer)) {
      fail(`Artifact ${index} platform, architecture, or installer is invalid.`);
    }
    const rolloutPercent = Number(item.rolloutPercent ?? 100);
    if (!Number.isInteger(rolloutPercent) || rolloutPercent < 0 || rolloutPercent > 100) fail(`Artifact ${index} rolloutPercent is invalid.`);
    const filename = item.filename || artifactPath.split(/[\\/]/).pop();
    const signature = readFileSync(signaturePath, "utf8").trim();
    if (!signature || signature.length > 4096) fail(`Artifact ${index} signature is invalid.`);
    const updaterPath = item.updaterPath ? resolveInsideRoot(item.updaterPath) : undefined;
    const updaterSignaturePath = item.updaterSignaturePath ? resolveInsideRoot(item.updaterSignaturePath) : undefined;
    if (Boolean(updaterPath) !== Boolean(updaterSignaturePath)) fail(`Artifact ${index} must provide both updaterPath and updaterSignaturePath.`);
    if (updaterPath && (!existsSync(updaterPath) || !existsSync(updaterSignaturePath))) fail(`Artifact ${index} updater artifact or signature is missing.`);
    const updaterFilename = updaterPath?.split(/[\\/]/).pop();
    const updaterSignature = updaterSignaturePath ? readFileSync(updaterSignaturePath, "utf8").trim() : undefined;
    if (updaterSignaturePath && (!updaterSignature || updaterSignature.length > 4096)) fail(`Artifact ${index} updater signature is invalid.`);
    return {
      platform,
      architecture,
      installer,
      version,
      downloadUrl: `${baseUrl}/${encodeURIComponent(version)}/${encodeURIComponent(filename)}`,
      ...(updaterFilename && updaterSignature ? {
        updaterDownloadUrl: `${baseUrl}/${encodeURIComponent(version)}/${encodeURIComponent(updaterFilename)}`,
        updaterSignature,
      } : {}),
      ...(typeof item.minimumRuntimeVersion === "string" ? { minimumRuntimeVersion: assertVersion(item.minimumRuntimeVersion, `artifacts[${index}].minimumRuntimeVersion`) } : {}),
      ...(typeof item.notes === "string" ? { notes: item.notes.slice(0, 20_000) } : {}),
      sha256: createHash("sha256").update(readFileSync(artifactPath)).digest("hex"),
      signature,
      sizeBytes: statSync(artifactPath).size,
      rolloutPercent,
      publishedAt: item.publishedAt || new Date().toISOString(),
    };
  });
  const manifest = {
    schemaVersion: 1,
    product: "erg-lms-desktop",
    channel: input.channel,
    generatedAt: input.generatedAt || new Date().toISOString(),
    currentVersion: version,
    ...(Array.isArray(input.revokedVersions) && input.revokedVersions.length ? { revokedVersions: input.revokedVersions } : {}),
    artifacts,
  };
  mkdirSync(dirname(outputAbsolute), { recursive: true });
  if (options.write) {
    mkdirSync(dirname(outputAbsolute), { recursive: true });
    writeFileSync(outputAbsolute, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  }
  return manifest;
}

function buildTauriFeed(manifest) {
  const platforms = {};
  for (const artifact of manifest.artifacts) {
    const key = `${artifact.platform}-${artifact.architecture}`;
    if (!artifact.updaterDownloadUrl || !artifact.updaterSignature) {
      fail(`Artifact ${key} is missing the signed Tauri updater archive.`);
    }
    platforms[key] = {
      signature: artifact.updaterSignature,
      url: artifact.updaterDownloadUrl,
    };
  }
  return {
    version: manifest.currentVersion,
    notes: `ERG LMS Desktop ${manifest.currentVersion} (${manifest.channel})`,
    pub_date: manifest.generatedAt,
    platforms,
  };
}

function prepareReleaseConfig() {
  assertReleaseSecrets();
  const raw = readFileSync(TEMPLATE_PATH, "utf8");
  const config = JSON.parse(raw.replaceAll("__ERG_UPDATER_PUBLIC_KEY__", process.env[PUBLIC_KEY_ENV]));
  if (config.plugins?.updater?.endpoints?.some((endpoint) => !String(endpoint).startsWith("https://releases.erg.edu.vn/"))) {
    fail("Updater endpoints must remain under https://releases.erg.edu.vn/.");
  }
  return config;
}

function assertReleaseSecrets() {
  const publicKey = process.env[PUBLIC_KEY_ENV]?.trim();
  const privateKey = process.env[PRIVATE_KEY_ENV]?.trim();
  if (!publicKey || publicKey.length < 32) fail(`${PUBLIC_KEY_ENV} must contain the Tauri updater public key.`);
  if (!privateKey || privateKey.length < 32) fail(`${PRIVATE_KEY_ENV} must be provided only by the release runner.`);
  if (privateKey.includes("__ERG_UPDATER_PUBLIC_KEY__")) fail("The updater public and private keys are mixed up.");
}

function flagValue(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function resolveInsideRoot(relativePath) {
  const absolute = resolve(ROOT, relativePath);
  const relativePathFromRoot = relative(ROOT, absolute);
  if (relativePathFromRoot.startsWith("..") || isAbsolute(relativePathFromRoot)) fail(`Path must stay inside the repository: ${relativePath}`);
  return absolute;
}

function assertBaseUrl(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash || !["downloads.erg.edu.vn", "releases.erg.edu.vn"].includes(url.hostname.toLowerCase())) throw new Error("unsafe");
    return url.toString().replace(/\/$/, "");
  } catch {
    fail("Release baseUrl must be an approved HTTPS origin.");
  }
}

function assertVersion(value, field) {
  if (typeof value !== "string" || !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(value)) fail(`${field} must be a semantic version.`);
  return value;
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
