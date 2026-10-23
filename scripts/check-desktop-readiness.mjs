import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const adrPath = path.join(ROOT, "docs/architecture/desktop-readiness-adr.md");
const threatPath = path.join(ROOT, "docs/security/desktop-threat-model.md");
const packagePath = path.join(ROOT, "package.json");
const vitePath = path.join(ROOT, "vite.config.ts");

function read(file) {
  assert.ok(fs.existsSync(file), `Missing readiness artifact: ${path.relative(ROOT, file)}`);
  return fs.readFileSync(file, "utf8");
}

const adr = read(adrPath);
const threat = read(threatPath);
const packageJson = JSON.parse(read(packagePath));
const vite = read(vitePath);

for (const required of [
  "PWA-first",
  "auth.erg.edu.vn",
  "lms.erg.edu.vn/admin",
  "lms.erg.edu.vn/teacher",
  "lms.erg.edu.vn/student",
  "BE-062",
  "OIDC Authorization Code + PKCE",
  "HttpOnly",
  "no-go",
]) {
  assert.ok(adr.includes(required), `ADR is missing required section/term: ${required}`);
}

for (const required of [
  "Trust boundaries",
  "STRIDE",
  "Spoofing",
  "Tampering",
  "Information disclosure",
  "Elevation",
  "service-worker",
  "IndexedDB",
  "IPC",
  "Release checklist",
]) {
  assert.ok(threat.includes(required), `Threat model is missing required section/term: ${required}`);
}

for (const forbidden of ["electron"]) {
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
  assert.ok(!Object.keys(dependencies).some((name) => name.toLowerCase().includes(forbidden)),
    `Unsupported native shell dependency: ${forbidden}`);
}

const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
const hasTauri = Object.keys(dependencies).some((name) => name.startsWith("@tauri-apps/"));
if (hasTauri) {
  assert.ok(
    fs.existsSync(path.join(ROOT, "src-tauri", "tauri.conf.json")),
    "Tauri dependencies require a checked-in src-tauri configuration"
  );
}

assert.match(vite, /VitePWA\(/, "vite-plugin-pwa must remain the current client foundation");
assert.match(adr, /No auth transport rewrite|No auth transport rewrite/i, "ADR must keep the scope boundary explicit");
assert.doesNotMatch(adr, /desktop\.(?:erg|erg\.edu)/i, "Do not introduce a client-specific domain");
assert.doesNotMatch(threat, /(?:access|refresh)Token\s*[:=]\s*['`]/i, "Threat model must not embed token examples");

console.log("Desktop readiness docs passed: ADR, STRIDE threat model, PWA foundation and native-shell boundary are consistent.");
