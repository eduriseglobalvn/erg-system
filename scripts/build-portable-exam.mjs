import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { basename, dirname, isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const TEMPLATE = resolve(ROOT, "src-tauri/tauri.portable.template.json");
const GENERATED = resolve(ROOT, "src-tauri/tauri.portable.generated.json");
const DIST = resolve(ROOT, "dist-portable");
const PACKAGE_DESTINATION = resolve(DIST, "portable-exam.ergquiz");

const options = parseArguments(process.argv.slice(2));
const packagePath = resolveInsideRoot(options.package);
if (!existsSync(packagePath)) fail(`Portable package does not exist: ${packagePath}`);

const packageEnvelope = JSON.parse(readFileSync(packagePath, "utf8"));
const packageId = text(packageEnvelope.packageId) || "portable-exam";
const publicKeyId = text(packageEnvelope.signatureBlock?.publicKeyId);
assertTrustedPublicKey(publicKeyId);
const version = semver(text(packageEnvelope.versionLabel) || options.version || "1.0.0");
const title = safeTitle(options.title || readQuizTitle(packageEnvelope) || "ERG Portable Exam");
const identifier = `vn.erg.portable.${safeIdentifier(packageId)}`;

run("bun", ["run", "portable:build:web"]);
copyFileSync(packagePath, PACKAGE_DESTINATION);

const template = readFileSync(TEMPLATE, "utf8")
  .replaceAll("__ERG_PORTABLE_PRODUCT_NAME__", title)
  .replaceAll("__ERG_PORTABLE_VERSION__", version)
  .replaceAll("__ERG_PORTABLE_IDENTIFIER__", identifier);
const config = JSON.parse(template);
writeFileSync(GENERATED, `${JSON.stringify(config, null, 2)}\n`, "utf8");

const targetDirectory = resolveInsideRoot(options.output || `deploy/portable/${safeIdentifier(packageId)}/${version}`);
rmSync(targetDirectory, { recursive: true, force: true });
mkdirSync(targetDirectory, { recursive: true });

if (!options.prepareOnly) {
  const args = ["x", "tauri", "build", "--config", GENERATED];
  if (options.target) args.push("--target", options.target);
  run("bun", args);
}

copyFileSync(packagePath, resolve(targetDirectory, basename(packagePath)));
writeFileSync(resolve(targetDirectory, "portable-build.json"), `${JSON.stringify({
  schemaVersion: 1,
  packageId,
  contentHash: text(packageEnvelope.signatureBlock?.contentHash),
  identifier,
  title,
  version,
  packageSha256: createHash("sha256").update(readFileSync(packagePath)).digest("hex"),
  generatedConfig: relative(ROOT, GENERATED).replaceAll("\\", "/"),
  status: options.prepareOnly ? "prepared" : "built",
}, null, 2)}\n`, "utf8");

console.log(`${options.prepareOnly ? "Prepared" : "Built"} portable exam ${packageId} at ${targetDirectory}`);

function parseArguments(args) {
  const value = (flag) => {
    const index = args.indexOf(flag);
    return index >= 0 ? args[index + 1] : undefined;
  };
  const packageValue = value("--package");
  if (!packageValue) fail("Usage: bun run portable:build -- --package <quiz.ergquiz> [--title <name>] [--output <dir>] [--target <triple>] [--prepare-only]");
  return {
    package: packageValue,
    title: value("--title"),
    output: value("--output"),
    target: value("--target"),
    version: value("--version"),
    prepareOnly: args.includes("--prepare-only"),
  };
}

function resolveInsideRoot(value) {
  const absolute = resolve(ROOT, value);
  const fromRoot = relative(ROOT, absolute);
  if (fromRoot.startsWith("..") || isAbsolute(fromRoot)) fail(`Path must remain inside the repository: ${value}`);
  return absolute;
}

function run(command, args) {
  const executable = process.platform === "win32" && command === "bun" ? "bun.exe" : command;
  const result = spawnSync(executable, args, { cwd: ROOT, env: process.env, stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function readQuizTitle(envelope) {
  return text(envelope.package?.quiz?.title) || text(envelope.package?.quiz?.info?.title);
}

function assertTrustedPublicKey(publicKeyId) {
  if (!publicKeyId) fail("Portable package is missing signatureBlock.publicKeyId.");
  const raw = process.env.VITE_PORTABLE_PACKAGE_PUBLIC_KEYS;
  if (!raw) fail("VITE_PORTABLE_PACKAGE_PUBLIC_KEYS is required to build a portable exam.");
  try {
    const keys = JSON.parse(raw);
    if (!keys || typeof keys !== "object" || Array.isArray(keys) || !text(keys[publicKeyId])) {
      fail(`No trusted public key is configured for ${publicKeyId}.`);
    }
  } catch (error) {
    if (error instanceof SyntaxError) fail("VITE_PORTABLE_PACKAGE_PUBLIC_KEYS must be a valid JSON object.");
    throw error;
  }
}

function safeIdentifier(value) {
  return value.toLowerCase().replace(/[^a-z0-9.-]+/g, ".").replace(/^\.+|\.+$/g, "").slice(0, 80) || "exam";
}

function safeTitle(value) {
  return value.replace(/[\u0000-\u001f<>:"/\\|?*]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 80) || "ERG Portable Exam";
}

function semver(value) {
  const normalized = value.replace(/^v/i, "");
  return /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(normalized) ? normalized : "1.0.0";
}

function text(value) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
