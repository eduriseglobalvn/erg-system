import { API_ENDPOINTS } from "@/lib/api/api-endpoints";
import { apiRequest } from "@/lib/api-client";
import { mapContentAssetToStudioAsset, toCanonicalAssetCreateRequest, toCanonicalAssetUpdateRequest } from "@/features/lcms/admin-operations/api/learning-resource-authoring-content-mapper";
import { compactObject } from "@/features/lcms/admin-operations/api/learning-resource-authoring-utils";
import type { StudioAssetResponse } from "@/features/lcms/admin-operations/api/learning-resource-authoring-domain-types";
import type { ContentAssetResponse } from "@/features/lcms/admin-operations/api/learning-resource-authoring-transport-types";

export function uploadLearningResourceAsset(input: {
  resourceId: string;
  file?: File;
  selectedFileType: string;
  title?: string;
  storageUrl?: string;
  totalSlides?: number;
  canDownload?: boolean;
}): Promise<StudioAssetResponse> {
  return createLearningResourceAsset(input.resourceId, {
    title: input.title || input.file?.name,
    selectedFileType: input.selectedFileType,
    file: input.file,
    storageProvider: input.storageUrl ? "google_drive" : undefined,
    storageUrl: input.storageUrl,
    totalSlides: input.totalSlides,
    canDownload: input.canDownload,
  });
}

export function createLearningResourceAsset(
  resourceId: string,
  input: {
    file?: File;
    title?: string;
    selectedFileType?: string;
    launchMode?: string;
    originalFileName?: string;
    detectedMimeType?: string;
    fileExtension?: string;
    fileSizeBytes?: number;
    storageProvider?: string;
    storageUrl?: string;
    canDownload?: boolean;
    status?: string;
    totalSlides?: number;
    metadata?: Record<string, unknown>;
  },
) {
  return createCanonicalAssetForResource(resourceId, input);
}

export function updateLearningResourceAsset(
  assetId: string,
  input: {
    title?: string;
    selectedFileType?: string;
    originalFileName?: string;
    detectedMimeType?: string;
    storageProvider?: string;
    storageUrl?: string;
    upstreamUrl?: string;
    canDownload?: boolean;
    status?: string;
  },
) {
  return apiRequest<ContentAssetResponse>(API_ENDPOINTS.content.asset(assetId), {
    method: "PATCH",
    body: JSON.stringify(toCanonicalAssetUpdateRequest(input)),
  }).then((asset) => mapContentAssetToStudioAsset(asset, ""));
}

async function createCanonicalAssetForResource(
  resourceId: string,
  input: {
    file?: File;
    title?: string;
    selectedFileType?: string;
    launchMode?: string;
    originalFileName?: string;
    detectedMimeType?: string;
    fileExtension?: string;
    fileSizeBytes?: number;
    storageProvider?: string;
    storageUrl?: string;
    canDownload?: boolean;
    status?: string;
    totalSlides?: number;
    metadata?: Record<string, unknown>;
  },
): Promise<StudioAssetResponse> {
  const asset = await apiRequest<ContentAssetResponse>(API_ENDPOINTS.legacy.contentAssets, {
    method: "POST",
    body: JSON.stringify(toCanonicalAssetCreateRequest(input)),
  });

  await apiRequest(API_ENDPOINTS.content.itemAssets(resourceId), {
    method: "POST",
    body: JSON.stringify({
      contentAssetId: asset.id,
      assetRole: "primary",
      sortOrder: 1,
      metadata: compactObject({
        source: "learning-resource-authoring",
        selectedFileType: input.selectedFileType,
      }),
    }),
  });

  return mapContentAssetToStudioAsset(asset, resourceId);
}
