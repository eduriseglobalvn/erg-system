import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const ROOT = resolve(process.cwd(), "src/features/lcms/quiz/quiz-editor/components");
const ownerFiles = [
  "quiz-editor-slide-render-types.ts",
  "quiz-editor-slide-intro-preview.tsx",
  "quiz-editor-slide-choice-preview.tsx",
  "quiz-editor-slide-drag-drop-preview.tsx",
  "quiz-editor-slide-feedback-preview.tsx",
  "quiz-editor-slide-media.tsx",
  "quiz-editor-slide-layout.tsx",
];

describe("Quiz Editor Slide Render ownership", () => {
  it("keeps the public renderer below the 250-line container budget", () => {
    const source = readFileSync(resolve(ROOT, "quiz-editor-slide-render.tsx"), "utf8");
    expect(source.split(/\r?\n/).length).toBeLessThanOrEqual(250);
  });

  it("keeps focused render owners present and below 300 lines", () => {
    for (const fileName of ownerFiles) {
      const source = readFileSync(resolve(ROOT, fileName), "utf8");
      expect(source.split(/\r?\n/).length, `${fileName} exceeds its owner budget`).toBeLessThanOrEqual(300);
    }
  });

  it("does not couple slide rendering to the locked Matching implementation", () => {
    const sources = ["quiz-editor-slide-render.tsx", ...ownerFiles]
      .map((fileName) => readFileSync(resolve(ROOT, fileName), "utf8"))
      .join("\n");

    expect(sources).not.toContain("matching-question");
    expect(sources).not.toContain("classic-editor.css");
    expect(sources).not.toContain("src/styles/globals.css");
  });
});
