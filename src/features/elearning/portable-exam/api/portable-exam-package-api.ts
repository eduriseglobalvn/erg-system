import { apiRequest } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/lib/api/api-endpoints";
import type { QuizRuntimePortal } from "@/features/lcms/quiz/quiz-runtime/types/quiz-runtime-types";
import type { PortableExamManifest } from "@/features/elearning/portable-exam/types/portable-exam-types";

export type PortableExamUpdateFeed = {
  available?: readonly PortableExamManifest[];
  currentVersionNumber?: number;
  etag?: string;
  feedVersion?: string;
  generatedAt?: string;
  latest?: PortableExamManifest;
  quizId?: string;
  releaseChannel?: string;
  runtimeVersion?: string;
  tenantId?: string;
};

export async function getPortableExamManifest(
  packageId: string,
  options: { etag?: string; portal?: QuizRuntimePortal; signal?: AbortSignal } = {},
) {
  return apiRequest<PortableExamManifest | undefined>(API_ENDPOINTS.lcms.quizPackageManifest(packageId), {
    cache: "no-store",
    portal: options.portal ?? "elearning",
    ...(options.etag ? { headers: { "If-None-Match": options.etag } } : {}),
    ...(options.signal ? { signal: options.signal } : {}),
  });
}

export async function getPortableExamUpdateFeed(
  quizId: string,
  options: {
    channel?: string;
    currentVersion?: number;
    etag?: string;
    portal?: QuizRuntimePortal;
    runtimeVersion?: string;
    signal?: AbortSignal;
  } = {},
) {
  return apiRequest<PortableExamUpdateFeed | undefined>(
    API_ENDPOINTS.lcms.quizPackageUpdates(quizId, options),
    {
      cache: "no-store",
      portal: options.portal ?? "elearning",
      ...(options.etag ? { headers: { "If-None-Match": options.etag } } : {}),
      ...(options.signal ? { signal: options.signal } : {}),
    },
  );
}

export async function downloadPortableExamPackage(
  packageId: string,
  options: { portal?: QuizRuntimePortal; signal?: AbortSignal } = {},
) {
  return apiRequest<Blob>(API_ENDPOINTS.lcms.quizPackageDownload(packageId), {
    cache: "no-store",
    portal: options.portal ?? "elearning",
    responseType: "blob",
    ...(options.signal ? { signal: options.signal } : {}),
  });
}

