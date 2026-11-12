import { existsSync, readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// Guards the copied design canvas (spec 9.4): every artboard is listed, and each keeps at most one contained button.
const root = "docs/design/student-portal";
const manifest = JSON.parse(readFileSync(`${root}/manifest/artboards.json`, "utf8")) as Record<string, { file: string; contained: number }>;

describe("student design sources", () => {
  it("lists every artboard file, and nothing else", () => {
    const files = readdirSync(`${root}/source`).filter((f) => f.endsWith(".dc.html")).sort();
    expect(Object.values(manifest).map((m) => m.file).sort()).toEqual(files);
  });
  it.each(Object.entries(manifest))("%s keeps its contained-button count and stays at most 1", (_id, m) => {
    const html = readFileSync(`${root}/source/${m.file}`, "utf8");
    const count = (html.match(/class="btn c[ "]/g) ?? []).length;
    expect(count).toBe(m.contained);
    expect(count).toBeLessThanOrEqual(1);
  });
  it("has the shared stylesheet", () => {
    expect(existsSync(`${root}/source/erg.css`)).toBe(true);
  });
});
