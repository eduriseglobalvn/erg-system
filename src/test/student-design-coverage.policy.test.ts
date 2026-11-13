import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// Spec 9.4: every artboard has exactly one entry in student-design.spec.ts (a real test, or a fixme with a reason), a manifest row and a baseline PNG.
const root = "docs/design/student-portal";
const manifest = JSON.parse(readFileSync(`${root}/manifest/artboards.json`, "utf8")) as Record<string, unknown>;
const spec = readFileSync("src/test/e2e/student-design.spec.ts", "utf8");

const tests = [...spec.matchAll(/^(?:test|mobileTest)\("(\w+)[ ",]/gm)].map((m) => m[1]);
const fixmeBlock = spec.slice(spec.indexOf("const FIXME"), spec.indexOf("for (const [id, reason]"));
const fixmes = new Map([...fixmeBlock.matchAll(/^\s+(\w+): "([^"]+)"/gm)].map((m) => [m[1], m[2]]));
const covered = [...tests, ...fixmes.keys()];

describe("student-design coverage", () => {
  it.each(Object.keys(manifest))("%s has exactly one spec entry", (id) => {
    expect(covered.filter((c) => c === id)).toHaveLength(1);
  });
  it.each([...fixmes])("%s fixme states a reason", (_id, reason) => {
    expect(reason.length).toBeGreaterThan(10);
  });
  it.each(Object.keys(manifest))("%s has a baseline PNG, or is a documented fixme", (id) => {
    expect(existsSync(`${root}/baseline-by-id/${id}.png`) || fixmes.has(id)).toBe(true);
  });
  it("spec names no artboard missing from the manifest", () => {
    expect(covered.filter((c) => !(c in manifest))).toEqual([]);
  });
});
