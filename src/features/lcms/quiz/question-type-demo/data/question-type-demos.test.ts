import { expect, it } from "vitest";

import { questionTypeLabel } from "@/features/lcms/quiz/quiz-editor/components/question-authoring/question-type-catalog";
import { questionTypeDemos } from "./question-type-demos";

it("names every demo type the way the quiz editor does (BUG-C-009)", () => {
  for (const demo of questionTypeDemos) expect(demo.label).toBe(questionTypeLabel(demo.kind));
  expect(questionTypeDemos.map((demo) => demo.label)).not.toContain("Nối cặp");
});
