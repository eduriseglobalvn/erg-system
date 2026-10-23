import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, extname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const OPERATION_DEFINITION = /\b(query|mutation|subscription)\s+([A-Za-z_][A-Za-z0-9_]*)/g;
const UNNAMED_OPERATION = /\b(query|mutation|subscription)\s*(?=[({])/g;
const OPERATION_NAME_METADATA = /\boperationName\s*:\s*["']([A-Za-z_][A-Za-z0-9_]*)["']/g;
const RAW_GRAPHQL_IMPORT = /\bfrom\s*["']([^"']+\.graphql)\?raw["']/g;

function domainPrefix(file) {
  const normalized = file.replace(/\\/g, "/");
  const feature = normalized.match(/(?:^|\/)src\/features\/([^/]+)\//)?.[1];
  if (!feature) return null;
  return feature
    .split("-")
    .filter(Boolean)
    .map((part) => `${part[0]?.toUpperCase() ?? ""}${part.slice(1)}`)
    .join("");
}

function collectSourceFiles(entryPath) {
  const absolutePath = resolve(entryPath);
  if (!existsSync(absolutePath)) return [];
  if (statSync(absolutePath).isFile()) return [absolutePath];

  return readdirSync(absolutePath, { withFileTypes: true }).flatMap((entry) =>
    collectSourceFiles(resolve(absolutePath, entry.name)),
  );
}

function operationNames(source, pattern) {
  pattern.lastIndex = 0;
  return [...source.matchAll(pattern)].map((match) => match[2] ?? match[1]);
}

function templateLiteralContents(source) {
  return [...source.matchAll(/`([\s\S]*?)`/g)].map((match) => match[1]);
}

function importedRawGraphqlDocuments(file, source) {
  RAW_GRAPHQL_IMPORT.lastIndex = 0;
  return [...source.matchAll(RAW_GRAPHQL_IMPORT)].flatMap((match) => {
    const documentPath = resolve(dirname(file), match[1]);
    return existsSync(documentPath) ? [readFileSync(documentPath, "utf8")] : [];
  });
}

export function auditGraphqlOperationSources(entries) {
  const violations = [];
  const definitionsByName = new Map();

  for (const { file, source, documents: importedDocuments = [] } of entries) {
    const prefix = domainPrefix(file);
    const documents = [...templateLiteralContents(source), ...importedDocuments];
    const definitions = documents.flatMap((document) => operationNames(document, OPERATION_DEFINITION));
    const metadata = operationNames(source, OPERATION_NAME_METADATA);
    const definitionSet = new Set(definitions);
    const metadataSet = new Set(metadata);

    for (const document of documents) {
      UNNAMED_OPERATION.lastIndex = 0;
      for (const match of document.matchAll(UNNAMED_OPERATION)) {
        violations.push({ file, rule: "unnamed-operation", detail: match[1] });
      }
    }

    for (const name of definitions) {
      const owners = definitionsByName.get(name) ?? [];
      owners.push(file);
      definitionsByName.set(name, owners);

      if (prefix && !name.startsWith(prefix)) {
        violations.push({ file, rule: "wrong-domain-prefix", detail: `${name} must start with ${prefix}` });
      }
      if (!metadataSet.has(name)) {
        violations.push({ file, rule: "operation-name-mismatch", detail: `${name} is missing matching request metadata` });
      }
    }

    for (const name of metadata) {
      if (!definitionSet.has(name)) {
        violations.push({ file, rule: "operation-name-mismatch", detail: `${name} does not match a document definition` });
      }
    }
  }

  for (const [name, files] of definitionsByName) {
    if (files.length > 1) {
      violations.push({ file: files.join(", "), rule: "duplicate-operation-name", detail: name });
    }
  }

  return violations;
}

export function scanGraphqlOperationNames(paths = []) {
  const scanPaths = paths.length > 0 ? paths : ["src/features"];
  const files = [...new Set(scanPaths.flatMap(collectSourceFiles))]
    .filter((file) => [".ts", ".tsx"].includes(extname(file)))
    .filter((file) => !/\.(?:d|spec|test)\.[cm]?[jt]sx?$/.test(file))
    .sort();
  return auditGraphqlOperationSources(files.map((file) => {
    const source = readFileSync(file, "utf8");
    return {
      file: relative(process.cwd(), file).replace(/\\/g, "/"),
      source,
      documents: importedRawGraphqlDocuments(file, source),
    };
  }));
}

function runCli() {
  const violations = scanGraphqlOperationNames(process.argv.slice(2));
  if (violations.length === 0) {
    console.log("GraphQL operation-name policy passed.");
    return;
  }

  for (const violation of violations) {
    console.error(`${violation.file}: ${violation.rule}: ${violation.detail}`);
  }
  console.error(`GraphQL operation-name policy failed with ${violations.length} violation(s).`);
  process.exitCode = 1;
}

if (resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url)) {
  runCli();
}
