import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(relativePath) {
  const absolutePath = path.join(ROOT, relativePath);
  assert.ok(fs.existsSync(absolutePath), `Missing Tauri foundation file: ${relativePath}`);
  return fs.readFileSync(absolutePath, "utf8");
}

const packageJson = JSON.parse(read("package.json"));
const config = JSON.parse(read("src-tauri/tauri.conf.json"));
const capabilities = JSON.parse(read("src-tauri/capabilities/default.json"));
const cargo = read("src-tauri/Cargo.toml");
const runtime = read("src/platform/desktop/runtime.ts");
const routes = read("src/routes/app-routes.tsx");
const lib = read("src-tauri/src/lib.rs");

assert.match(cargo, /tauri\s*=\s*\{\s*version\s*=\s*"2\./, "Rust shell must pin Tauri v2");
assert.match(cargo, /tauri-build\s*=\s*\{\s*version\s*=\s*"2\./, "Rust build helper must pin Tauri v2");
assert.equal(packageJson.dependencies?.["@tauri-apps/api"]?.startsWith("2."), true, "JS API must be Tauri v2");
assert.equal(packageJson.devDependencies?.["@tauri-apps/cli"]?.startsWith("2."), true, "CLI must be Tauri v2");

assert.deepEqual(config.app.security.capabilities, ["main-window"], "Only the named main-window capability may be attached");
assert.equal(config.bundle.active, false, "Packaging stays disabled until signing/update tasks are complete");
assert.equal(config.bundle.createUpdaterArtifacts, false, "Updater artifacts stay disabled until ERG-123");
assert.deepEqual(
  capabilities.permissions,
  ["updater:default", "process:allow-restart"],
  "Desktop release capability must expose only updater and relaunch permissions",
);
assert.match(cargo, /tauri-plugin-updater\s*=\s*"2\./, "Desktop release must pin the Tauri updater plugin");
assert.match(cargo, /tauri-plugin-process\s*=\s*"2\./, "Desktop release must pin the Tauri process plugin");
assert.match(lib, /tauri_plugin_updater::Builder::new\(\)\.build\(\)/, "Updater plugin must be registered in Rust");
assert.match(lib, /tauri_plugin_process::init\(\)/, "Process plugin must be registered in Rust");
assert.ok(Array.isArray(config.bundle.icon) && config.bundle.icon.includes("icons/icon.ico"), "Desktop bundle needs a checked-in Windows icon");
assert.doesNotMatch(JSON.stringify(config), /\*/, "Foundation config must not use a wildcard origin");
assert.doesNotMatch(
  JSON.stringify(config),
  /[\"'](?:dangerousRemoteDomainIpcAccess|shell|process|fs|updater)[\"']\s*:/i,
  "Foundation config must not grant broad native access"
);
assert.doesNotMatch(lib, /#\[tauri::command\]|invoke_handler|std::process|std::fs/, "Foundation Rust shell must not expose commands or host access");

assert.match(runtime, /DESKTOP_WORKSPACES\s*=\s*\["TEACHER",\s*"STUDENT"\]/, "Desktop surface is limited to Teacher and Student");
assert.doesNotMatch(runtime, /"ADMIN"|"CRM"/, "Admin and CRM must not be desktop workspaces in ERG-120");
assert.doesNotMatch(runtime, /accessToken|refreshToken|sso_token|localStorage|sessionStorage|indexedDB/i, "Desktop runtime boundary must not carry credentials");
assert.doesNotMatch(routes, /src-tauri|@tauri-apps\//, "Route/page code must use the platform boundary, not Rust/SDK details");
assert.match(routes, /app\/pages\/teacher\/teacher-page/);
assert.match(routes, /app\/pages\/student\/student-page/);
assert.match(routes, /teacher\/downloads\/desktop/);
assert.match(routes, /student\/downloads\/desktop/);

function sourceFiles(relativeDirectory) {
  const directory = path.join(ROOT, relativeDirectory);
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const relative = path.join(relativeDirectory, entry.name);
    return entry.isDirectory() ? sourceFiles(relative) : [relative];
  });
}

for (const relativeDirectory of ["src/features", "src/app/pages"]) {
  for (const file of sourceFiles(relativeDirectory).filter((item) => /\.(?:ts|tsx)$/.test(item))) {
    assert.doesNotMatch(read(file), /@tauri-apps\//, `${file} must remain portable across web/PWA/Tauri`);
  }
}

console.log("Tauri architecture passed: shared React boundary, Teacher/Student-only surface, least privilege and no credential IPC.");
