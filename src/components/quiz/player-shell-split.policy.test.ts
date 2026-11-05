import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const ROOT = resolve(process.cwd(), "src/components/quiz");
const PLAYER = resolve(process.cwd(), "src/features/lcms/quiz/player");

// The runtime is split into sibling files (shell <= 200 lines); ownership is checked across them.
const RUNTIME_FILES = ["player-shell-runtime.tsx", "player-ready-view.tsx", "player-ready-parts.tsx", "use-player-runtime.ts", "use-player-ready-handlers.ts"];

describe("Quiz Player Shell ownership", () => {
  it("keeps the public shell as a typed runtime boundary", () => {
    const source = readFileSync(resolve(PLAYER, "player-shell.tsx"), "utf8");

    expect(source.split(/\r?\n/).length).toBeLessThanOrEqual(80);
    expect(source).toContain("PlayerShellRuntime");
    expect(source).not.toMatch(/\buse(?:Callback|Effect|Memo|QueryClient|Ref|State)\b/);
  });

  it("keeps runtime, navigation, mobile and result owners explicit", () => {
    const runtime = RUNTIME_FILES.map((file) => readFileSync(resolve(PLAYER, file), "utf8")).join("\n");

    expect(runtime).toContain("QuestionNavigator");
    expect(runtime).toContain("MobilePlayerShell");
    expect(runtime).toContain("FinalResultScreen");
    expect(runtime).toContain("player-shell-runtime-model");
  });

  it("has a dedicated pure runtime model owner", () => {
    expect(() => readFileSync(resolve(ROOT, "player-shell-runtime-model.ts"), "utf8")).not.toThrow();
  });

  it("does not make protected matching implementations shell dependencies", () => {
    for (const file of [resolve(PLAYER, "player-shell.tsx"), ...RUNTIME_FILES.map((name) => resolve(PLAYER, name)), resolve(ROOT, "player-shell-runtime-model.ts")]) {
      const source = readFileSync(file, "utf8");
      expect(source).not.toContain("matching-question");
    }
  });
});
