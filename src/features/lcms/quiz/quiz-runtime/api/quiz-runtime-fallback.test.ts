import { expect, test } from "vitest";

import { shouldUseLocalQuizRuntimeFallback } from "@/features/lcms/quiz/quiz-runtime/api/quiz-runtime-fallback";

test("does not hide API-enabled runtime failures behind local mock fallback", () => {
  expect(shouldUseLocalQuizRuntimeFallback()).toBe(false);
});
