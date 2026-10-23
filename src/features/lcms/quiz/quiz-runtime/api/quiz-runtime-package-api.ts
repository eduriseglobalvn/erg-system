import { createQuizPackage } from "@/lib/assessment-engine";
import { getLocalQuizById, sampleQuiz } from "@/lib/sample-quiz";
import { apiRequest } from "@/lib/api-client";
import { getDefaultTenantId } from "@/lib/graphql-client";
import { shouldUseLocalQuizRuntimeFallback } from "@/features/lcms/quiz/quiz-runtime/api/quiz-runtime-fallback";
import { normalizeQuizPackage } from "@/features/lcms/quiz/quiz-runtime/api/quiz-runtime-package-normalizer";
import { DEFAULT_QUIZ_RUNTIME_PORTAL } from "@/features/lcms/quiz/quiz-runtime/api/quiz-runtime-normalization-utils";
import { API_ENDPOINTS } from "@/lib/api/api-endpoints";
import { isObject, validateResponse } from "@/lib/validate-response";
import { runtimeFixturesEnabled } from "@/lib/runtime-fixtures";
import type { QuizPackage } from "@/lib/types";
import type { QuizRuntimePortal } from "@/features/lcms/quiz/quiz-runtime/types/quiz-runtime-types";

export type BackendQuizPackage = Partial<Omit<QuizPackage, "quiz">> & {
  quiz?: unknown;
  answerKey?: Record<string, Record<string, unknown>>;
  packageHash?: string;
  version?: string | number;
};

const normalizedPackageCache = new Map<string, QuizPackage>();

export function clearNormalizedQuizPackageCache(quizId?: string) {
  if (!quizId) {
    normalizedPackageCache.clear();
    return;
  }

  Array.from(normalizedPackageCache.keys())
    .filter((key) => key.endsWith(`:${quizId}`))
    .forEach((key) => normalizedPackageCache.delete(key));
}

export async function getQuizPackage(
  quizId: string,
  portal: QuizRuntimePortal = DEFAULT_QUIZ_RUNTIME_PORTAL,
  tenantId: string = getDefaultTenantId(),
  signal?: AbortSignal,
): Promise<QuizPackage> {
  const localQuiz = getLocalQuizById(quizId) ?? sampleQuiz;

  if (runtimeFixturesEnabled()) {
    return createQuizPackage(localQuiz, {
      gradingMode: "client-first",
      source: "local",
    });
  }

  try {
    const cacheKey = `${tenantId}:${portal}:${quizId}`;
    const backendPackage = await apiRequest<BackendQuizPackage | undefined>(API_ENDPOINTS.lms.quizPackage(quizId), {
      cache: "default",
      portal,
      ...(signal ? { signal } : {}),
    });
    if (!backendPackage) {
      const cachedPackage = normalizedPackageCache.get(cacheKey);
      if (cachedPackage) {
        return cachedPackage;
      }
      throw new Error("Quiz package returned no body and no cached package is available.");
    }

    const validPackage = validateResponse(backendPackage, isBackendQuizPackage, "quiz-runtime.package");
    const normalizedPackage = normalizeQuizPackage(validPackage);
    normalizedPackageCache.set(cacheKey, normalizedPackage);
    return normalizedPackage;
  } catch (error) {
    if (shouldUseLocalQuizRuntimeFallback(quizId, error)) {
      return createQuizPackage(localQuiz, {
        gradingMode: "client-first",
        source: "local",
      });
    }

    throw error;
  }
}

function isBackendQuizPackage(value: unknown): value is BackendQuizPackage {
  return isObject(value) && isObject(value.quiz);
}
