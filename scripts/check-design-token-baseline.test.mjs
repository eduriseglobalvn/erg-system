import assert from "node:assert/strict";
import { test } from "node:test";

import { compareToBaseline, countDesignTokens, isScanned } from "./check-design-token-baseline.mjs";

test("counts hex colors in strings of all lengths, ignores comments, entities and urls", () => {
  const src = `const a = "#fff", b = '#0F6CBD', c = \`1px solid #11223344\`;
// color: #abcdef
/* #123 */
const d = "&#123;"; const e = "https://x.io/#abc"; const f = "#12345";`;
  assert.deepEqual(countDesignTokens(src), { hex: 3, font: 0 });
});

test("counts numeric fontSize/fontWeight but not tokens or theme strings", () => {
  const src = `sx={{ fontSize: 12, fontWeight: 600, fontSize: "14px", fontWeight: "700", fontSize: "0.875rem", fontWeight: "bold", fontSize: theme.x, fontWeight: tokens.w }}`;
  assert.deepEqual(countDesignTokens(src), { hex: 0, font: 4 });
});

test("compareToBaseline flags growth and new files, reports reductions", () => {
  const baseline = { "a.tsx": { hex: 2, font: 1 }, "b.tsx": { hex: 1, font: 0 }, "gone.tsx": { hex: 1, font: 0 } };
  const current = { "a.tsx": { hex: 3, font: 1 }, "b.tsx": { hex: 0, font: 0 }, "new.tsx": { hex: 0, font: 1 } };
  const { over, under } = compareToBaseline(current, baseline);
  assert.deepEqual(over.map((o) => o.file), ["a.tsx", "new.tsx"]);
  assert.deepEqual(under, ["b.tsx", "gone.tsx"]);
});

test("isScanned excludes tests, themes, legacy ui, generated and d.ts", () => {
  assert.ok(isScanned("src/features/x/a.tsx"));
  for (const p of ["src/a.test.tsx", "src/test/a.ts", "src/themes/t.ts", "src/components/ui/b.tsx", "src/lib/api/generated/c.ts", "src/d.d.ts", "src/a.css"]) {
    assert.ok(!isScanned(p), p);
  }
});
