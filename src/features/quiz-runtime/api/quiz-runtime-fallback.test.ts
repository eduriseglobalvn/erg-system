import { expect, test } from "vitest";

import { ApiClientError } from "@/lib/api-client";
import { sampleQuiz } from "@/lib/sample-quiz";
import { shouldUseLocalQuizRuntimeFallback } from "@/features/quiz-runtime/api/quiz-runtime-fallback";

test("uses local runtime fallback for the hardcoded demo quiz when backend fails", () => {
  expect(
    shouldUseLocalQuizRuntimeFallback(
      sampleQuiz.id,
      new ApiClientError("Request failed: 500", "HTTP_500", 500),
    ),
  ).toBe(true);
});

test("does not force local runtime fallback for non-demo quizzes", () => {
  expect(
    shouldUseLocalQuizRuntimeFallback(
      "real-quiz-id",
      new ApiClientError("Request failed: 500", "HTTP_500", 500),
    ),
  ).toBe(false);
});
