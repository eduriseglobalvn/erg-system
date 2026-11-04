import test from "node:test";
import assert from "node:assert/strict";
import { findLayerViolations, findOwnershipViolations } from "./check-frontend-folder-boundary.mjs";

test("allows new files in page and dashboard roots when owned", () => {
  assert.deepEqual(findOwnershipViolations(["src/pages/new-page.tsx", "src/layouts/dashboard/new-shell.tsx"]), []);
});

test("rejects UI files under generated transport ownership", () => {
  assert.deepEqual(findOwnershipViolations(["src/lib/api/generated/new-page.tsx"]), ["src/lib/api/generated/new-page.tsx"]);
});

test("rejects platform importing app (alias and relative)", () => {
  assert.equal(findLayerViolations({
    "src/platform/auth/a.ts": 'import { x } from "@/app/portal-route-registry";',
    "src/platform/auth/b.ts": 'export * from "../../app/router";',
    "src/platform/auth/c.test.ts": 'vi.mock("@/app/foo");',
  }).length, 3);
});

test("rejects lib importing features, including multi-line type imports", () => {
  assert.equal(findLayerViolations({ "src/lib/q.ts": 'import type {\n  A,\n} from "@/features/x/y";\nexport * from "../features/z";' }).length, 2);
});

test("allows lower-layer imports and other layers", () => {
  assert.deepEqual(findLayerViolations({
    "src/platform/a.ts": 'import x from "@/lib/x"; import y from "@/platform/y";',
    "src/lib/a.ts": 'import x from "@/platform/x"; import y from "./features-helper";',
    "src/features/a.ts": 'import x from "@/app/x";',
  }), []);
});
