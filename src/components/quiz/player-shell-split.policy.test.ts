import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const ROOT = resolve(process.cwd(), "src/components/quiz");

describe("Quiz Player Shell ownership", () => {
  it("keeps the public shell as a typed runtime boundary", () => {
    const source = readFileSync(resolve(ROOT, "player-shell.tsx"), "utf8");

    expect(source.split(/\r?\n/).length).toBeLessThanOrEqual(80);
    expect(source).toContain("PlayerShellRuntime");
    expect(source).not.toMatch(/\buse(?:Callback|Effect|Memo|QueryClient|Ref|State)\b/);
  });

  it("keeps runtime, navigation, mobile and result owners explicit", () => {
    const runtime = readFileSync(resolve(ROOT, "player-shell-runtime.tsx"), "utf8");

    expect(runtime).toContain("QuestionNavigator");
    expect(runtime).toContain("MobilePlayerShell");
    expect(runtime).toContain("FinalResultScreen");
    expect(runtime).toContain("player-shell-runtime-model");
  });

  it("has a dedicated pure runtime model owner", () => {
    expect(() => readFileSync(resolve(ROOT, "player-shell-runtime-model.ts"), "utf8")).not.toThrow();
  });

  it("does not make protected matching implementations shell dependencies", () => {
    for (const fileName of ["player-shell.tsx", "player-shell-runtime.tsx", "player-shell-runtime-model.ts"]) {
      const source = readFileSync(resolve(ROOT, fileName), "utf8");
      expect(source).not.toContain("matching-question");
      expect(source).not.toContain("classic-editor.css");
    }
  });
});
