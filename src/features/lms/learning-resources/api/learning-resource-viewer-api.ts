import { USE_LEARNING_RESOURCE_AUTHORING_MOCK } from "@/features/lcms/admin-operations/api/mock-learning-resource-authoring-data";
import type { LearningResourceResource } from "@/features/lms/learning-resources/api/learning-resource-domain-types";
import { isApiLaunchUrl, normalizeViewerUrl } from "@/features/lms/learning-resources/api/learning-resource-normalizers";
import { hasApiBase } from "@/lib/api-client";
import {
  createOfflineScopedJsonStore,
  OfflineResourceCache,
  type OfflineResourceCachePolicy,
  type OfflineResourceScope,
} from "@/platform/offline";

export const offlineLearningResourceCache = new OfflineResourceCache(
  createOfflineScopedJsonStore("learning-resource-cache-v1"),
);

export async function loadLearningResourceResourceForViewer(resource: LearningResourceResource): Promise<LearningResourceResource> {
  if (USE_LEARNING_RESOURCE_AUTHORING_MOCK && resource.id.startsWith("mock-")) return resource;
  if (!hasApiBase()) return resource;
  if (resource.viewer.launchUrl) {
    if (!isApiLaunchUrl(resource.viewer.launchUrl)) {
      return {
        ...resource,
        viewer: {
          ...resource.viewer,
          embedUrl: normalizeViewerUrl(resource.viewer.launchUrl),
          launchUrl: undefined,
        },
      };
    }

    return resource;
  }
  if (resource.viewer.assetId && resource.launchMode === "google_slide_embed" && !resource.viewer.embedUrl) {
    return resource;
  }
  if (resource.viewer.embedUrl || resource.viewer.secureEmbedUrl || (resource.viewer.assetId && resource.viewer.slides?.length)) return resource;
  return resource;
}

/**
 * Cache bytes only after a backend-provided allowlist/expiry/quota decision.
 * The viewer's signed/embed URLs are deliberately not persisted with the bytes.
 */
export function cacheLearningResourceBytes(input: {
  scope: OfflineResourceScope;
  resource: LearningResourceResource;
  bytes: Uint8Array;
  mimeType: string;
  policy: OfflineResourceCachePolicy;
}) {
  return offlineLearningResourceCache.put({
    scope: input.scope,
    resourceId: input.resource.id,
    fileType: input.resource.fileType,
    launchMode: input.resource.launchMode,
    accessState: input.resource.accessState,
    isDownloadable: input.resource.isDownloadable,
    bytes: input.bytes,
    mimeType: input.mimeType,
    policy: input.policy,
  });
}

export function getCachedLearningResourceBytes(input: { scope: OfflineResourceScope; resourceId: string; nowMs?: number }) {
  return offlineLearningResourceCache.get(input);
}
