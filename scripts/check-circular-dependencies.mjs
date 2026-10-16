import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = path.join(root, "src");
const includeTests = process.argv.includes("--include-tests");

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) return walk(full);
    if (!/\.(ts|tsx)$/.test(entry.name)) return [];
    if (!includeTests && /\.(test|spec)\.(ts|tsx)$/.test(entry.name)) return [];
    return [full];
  });
}

const files = walk(sourceRoot);
const fileSet = new Set(files);
const graph = new Map(files.map((file) => [file, []]));
const importPattern = /(?:import\s+(?:[\s\S]*?\s+from\s+|)|export\s+[\s\S]*?\s+from\s+|import\s*\()(["'])([^"']+)\1/g;

function resolveImport(from, specifier) {
  if (specifier.startsWith("@/")) return resolveFile(path.join(sourceRoot, specifier.slice(2)));
  if (specifier.startsWith(".")) return resolveFile(path.resolve(path.dirname(from), specifier));
  return null;
}

function resolveFile(base) {
  for (const candidate of [base, `${base}.ts`, `${base}.tsx`, path.join(base, "index.ts"), path.join(base, "index.tsx")]) {
    if (fileSet.has(candidate)) return candidate;
  }
  return null;
}

for (const file of files) {
  const source = fs.readFileSync(file, "utf8").replace(/import\s+type[\s\S]*?from\s+["'][^"']+["'];?/g, "");
  for (const match of source.matchAll(importPattern)) {
    const target = resolveImport(file, match[2]);
    if (target) graph.get(file).push(target);
  }
}

const cycles = [];
const state = new Map();
const stack = [];
function visit(file) {
  state.set(file, "visiting");
  stack.push(file);
  for (const next of graph.get(file) ?? []) {
    if (state.get(next) === "visiting") {
      const start = stack.indexOf(next);
      cycles.push([...stack.slice(start), next]);
    } else if (!state.has(next)) visit(next);
  }
  stack.pop();
  state.set(file, "visited");
}
for (const file of files) if (!state.has(file)) visit(file);

const unique = new Map(cycles.map((cycle) => [cycle.join("\0"), cycle]));
if (unique.size) {
  console.error([...unique.values()].map((cycle) => `- ${cycle.map((file) => path.relative(root, file)).join(" -> ")}`).join("\n"));
  process.exitCode = 1;
} else {
  console.log(`No circular dependencies found in ${files.length} source files.`);
}
