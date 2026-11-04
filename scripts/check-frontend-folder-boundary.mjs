import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";

// Lower layers must not import upper ones: platform -> app, lib -> features, components -> features.
export const LAYER_RULES = [
  { from: "src/platform/", forbidden: "app", message: "platform must not import from app" },
  { from: "src/lib/", forbidden: "features", message: "lib must not import from features" },
  { from: "src/components/", forbidden: "features", message: "components must not import from features" },
];
// Known exceptions as "file -> imported specifier". Keep empty; add a comment with the reason for each entry.
export const LAYER_ALLOWLIST = new Set([]);

const importSpecifierPattern = /(?:from\s*|import\s*\(?\s*|mock\(\s*)(["'])([^"']+)\1/g;

function resolvesToLayer(file, specifier, layer) {
  if (specifier.startsWith("@/")) return specifier === `@/${layer}` || specifier.startsWith(`@/${layer}/`);
  if (!specifier.startsWith(".")) return false;
  const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(file), specifier));
  return resolved === `src/${layer}` || resolved.startsWith(`src/${layer}/`);
}

export function findLayerViolations(sources) {
  const violations = [];
  for (const [rawFile, text] of Object.entries(sources)) {
    const file = rawFile.replaceAll("\\", "/");
    for (const rule of LAYER_RULES.filter((item) => file.startsWith(item.from))) {
      for (const match of text.matchAll(importSpecifierPattern)) {
        const specifier = match[2];
        if (!resolvesToLayer(file, specifier, rule.forbidden) || LAYER_ALLOWLIST.has(`${file} -> ${specifier}`)) continue;
        violations.push(`${file}: ${rule.message} (${specifier})`);
      }
    }
  }
  return violations;
}

function readSources(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = path.posix.join(directory, entry.name);
    if (entry.isDirectory()) return readSources(full);
    return /\.(ts|tsx)$/.test(entry.name) ? [[full, fs.readFileSync(full, "utf8")]] : [];
  });
}

export function findOwnershipViolations(files) {
  return files.filter((file) => {
    const normalized = file.replaceAll("\\", "/");
    return normalized.includes("/generated/") && normalized.endsWith(".tsx");
  });
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const names = execFileSync("git", ["diff", "--name-only", "--diff-filter=A", "HEAD"], { encoding: "utf8" })
    .split(/\r?\n/)
    .filter(Boolean);
  const violations = findOwnershipViolations(names);
  const layerViolations = findLayerViolations(Object.fromEntries(["src/platform", "src/lib", "src/components"].flatMap(readSources)));
  if (violations.length) {
    console.error("Generated transport directories cannot own UI files:\n" + violations.join("\n"));
    process.exitCode = 1;
  }
  if (layerViolations.length) {
    console.error("Reverse-direction imports:\n" + layerViolations.join("\n"));
    process.exitCode = 1;
  }
  if (!process.exitCode) {
    console.log("Frontend folder boundary check passed.");
  }
}
