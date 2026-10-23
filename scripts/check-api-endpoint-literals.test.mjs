import assert from "node:assert/strict";
import { test } from "node:test";

import { findEndpointLiterals } from "./check-api-endpoint-literals.mjs";

test("reports backend endpoint literals outside the central registry", () => {
  const findings = findEndpointLiterals({
    "src/feature/api.ts": "apiRequest(`/api/v1/users/${id}`)",
    "src/lib/api/api-endpoints.ts": "const root = '/api/v1/users'",
    "src/feature/api.test.ts": "expect(path).toBe('/api/v1/users')",
  });

  assert.deepEqual(findings, [{ file: "src/feature/api.ts", line: 1 }]);
});

test("ignores external and asset URLs", () => {
  assert.deepEqual(findEndpointLiterals({
    "src/view.ts": "fetch('https://cdn.example.com/api/image.png')",
  }), []);
});
