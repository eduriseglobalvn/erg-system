import { describe, expect, test } from "vitest";

import {
  QUIZ_RUNTIME_PACKAGE_GC_TIME_MS,
  QUIZ_RUNTIME_PACKAGE_STALE_TIME_MS,
  quizPackageQueryOptions,
  quizRuntimeMutationKeys,
  quizRuntimeQueryKeys,
} from "@/features/lcms/quiz/quiz-runtime/api/quiz-runtime-query";

describe("quizPackageQueryOptions", () => {
  test("scopes runtime package cache by tenant, portal, and quiz", () => {
    const options = quizPackageQueryOptions("quiz-a", "elearning", "tenant-a");

    expect(options.queryKey).toEqual(["quiz-runtime", "package", "tenant-a", "elearning", "quiz-a"]);
    expect(options.staleTime).toBe(QUIZ_RUNTIME_PACKAGE_STALE_TIME_MS);
    expect(options.gcTime).toBe(QUIZ_RUNTIME_PACKAGE_GC_TIME_MS);
  });

  test("provides a tenant-scoped runtime package invalidation prefix", () => {
    expect(quizRuntimeQueryKeys.packageRoot("tenant-a")).toEqual(["quiz-runtime", "package", "tenant-a"]);
  });
});

describe("quizRuntimeMutationKeys", () => {
  test("names runtime mutations for MutationCache/devtools/offline instrumentation", () => {
    expect(quizRuntimeMutationKeys.saveDraft).toEqual(["quiz-runtime", "mutation", "attempt-draft"]);
    expect(quizRuntimeMutationKeys.saveAnswer).toEqual(["quiz-runtime", "mutation", "attempt-answer"]);
    expect(quizRuntimeMutationKeys.syncAttempt).toEqual(["quiz-runtime", "mutation", "attempt-sync"]);
  });
});
