import assert from "node:assert/strict";
import { test } from "node:test";

import { extractEndpointPaths, findPathsOutsideContract, normalizePath } from "./check-api-endpoints-in-contract.mjs";

const contract = ["/api/v1/roles", "/api/v1/users/{userId}/effective-permissions", "/api/v1/curriculum/subjects/{id}"];

test("passes a path that is in the contract", () => {
  assert.deepEqual(findPathsOutsideContract(["/api/v1/roles"], contract, new Map()), []);
});

test("reports a path that is not in the contract by name", () => {
  assert.deepEqual(
    findPathsOutsideContract(["/api/v1/roles", "/api/lms/access-management/options"], contract, new Map()),
    ["/api/lms/access-management/options"],
  );
});

test("matches a ${id} template segment against a {param} contract segment", () => {
  assert.equal(normalizePath("/api/v1/users/${encodeApiPathSegment(userId)}/effective-permissions"), "/api/v1/users/{}/effective-permissions");
  assert.deepEqual(findPathsOutsideContract(["/api/v1/users/${encodeApiPathSegment(userId)}/effective-permissions"], contract, new Map()), []);
  assert.deepEqual(findPathsOutsideContract(["/api/v1/users/${id}/access-scopes"], contract, new Map()), ["/api/v1/users/${id}/access-scopes"]);
});

test("a template segment may stand for a literal contract segment, and the query string is ignored", () => {
  assert.deepEqual(findPathsOutsideContract(["/api/v1/curriculum/${kind}/${id}", "/api/v1/roles?page=1"], contract, new Map()), []);
});

test("allows listed root prefixes", () => {
  assert.deepEqual(findPathsOutsideContract(["/api/v1/"], contract, new Map([["/api/v1/", "routing root"]])), []);
});

test("resolves root constants used as template prefixes", () => {
  const source = [
    'const usersRoot = "/api/v1/users";',
    "export const API_ENDPOINTS = {",
    "  effective: (id) => path(`${usersRoot}/${encodeApiPathSegment(id)}/effective-permissions`),",
    '  roles: "/api/v1/roles" satisfies ContractPath,',
    "};",
  ].join("\n");
  assert.deepEqual(extractEndpointPaths(source).sort(), [
    "/api/v1/roles",
    "/api/v1/users",
    "/api/v1/users/${encodeApiPathSegment(id)}/effective-permissions",
  ]);
});
