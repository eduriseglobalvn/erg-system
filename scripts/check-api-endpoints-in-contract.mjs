import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ENDPOINTS_FILE = "src/lib/api/api-endpoints.ts";
const CONTRACT_FILE = "contracts/backend/erg-openapi.json";

// Paths that are legitimately absent from the OpenAPI contract, each with the reason.
export const ALLOWED_OUTSIDE_CONTRACT = new Map([
  ["/api/v1/", "routing root: the API client uses it to detect versioned requests"],
  ["/api/v1/admin", "routing root: admin portal detection in the API client"],
  ["/api/v1/users", "routing root: back-office portal detection (also a contract path)"],
  ["/api/v1/curriculum", "routing root: curriculum requests go to the lcms portal"],
  ["/api/v1/timekeeping", "routing root: base of the timekeeping paths"],
  ["/api/content", "routing root: content requests go to the lcms portal"],
  ["/api/elearning", "routing root: elearning portal detection in the API client"],
  ["/api/v1/graphql", "GraphQL endpoint, checked against contracts/backend/schema.graphqls instead"],
  ["/api/v1/auth/csrf", "BFF endpoint (OidcBffController), not exported to OpenAPI"],
  ["/api/v1/auth/session", "BFF endpoint (OidcBffController), not exported to OpenAPI"],
]);

/** Every `/api/...` string literal in the registry, with `${ROOT_CONST}` prefixes resolved from same-file constants. */
export function extractEndpointPaths(source) {
  const constants = new Map();
  for (const match of source.matchAll(/const\s+(\w+)\s*=\s*["'`](\/api[^"'`$]*)["'`]/g)) constants.set(match[1], match[2]);
  const found = new Set();
  for (const match of source.matchAll(/["'`]((?:\/api|\$\{\w+\})[^"'`]*)["'`]/g)) {
    const value = match[1].replace(/^\$\{(\w+)\}/, (whole, name) => constants.get(name) ?? whole);
    if (value.startsWith("/api")) found.add(value);
  }
  return [...found];
}

/** `${...}` and `{name}` both become one `{}` segment; the query string is dropped. */
export function normalizePath(value) {
  return value.split("?")[0].replace(/\$\{[^}]*\}/g, "{}").replace(/\{[^}]*\}/g, "{}");
}

function matches(endpoint, contractPath) {
  const a = endpoint.split("/");
  const b = contractPath.split("/");
  // A parameter on either side stands for any single segment.
  return a.length === b.length && a.every((segment, index) => segment === b[index] || segment === "{}" || b[index] === "{}");
}

export function findPathsOutsideContract(endpointPaths, contractPaths, allowed = ALLOWED_OUTSIDE_CONTRACT) {
  const contract = contractPaths.map(normalizePath);
  return endpointPaths.filter((value) => {
    if (allowed.has(value)) return false;
    const normalized = normalizePath(value);
    return !contract.some((contractPath) => matches(normalized, contractPath));
  });
}

function main() {
  const source = fs.readFileSync(path.join(ROOT, ENDPOINTS_FILE), "utf8");
  const contract = JSON.parse(fs.readFileSync(path.join(ROOT, CONTRACT_FILE), "utf8"));
  const missing = findPathsOutsideContract(extractEndpointPaths(source), Object.keys(contract.paths ?? {}));
  if (!missing.length) return;
  for (const value of missing) console.error(`${ENDPOINTS_FILE}: ${value} is not in ${CONTRACT_FILE}`);
  console.error("Add the path to the backend contract, remove the caller, or allow it with a reason in scripts/check-api-endpoints-in-contract.mjs.");
  process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
