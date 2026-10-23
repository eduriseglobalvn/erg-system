import { API_ENDPOINTS } from "@/lib/api/api-endpoints";
import { apiRequest } from "@/lib/api-client";
import {
  canonicalContentStatus,
  canonicalContentVisibility,
  contentRoleForResource,
  contentTypeForResource,
  firstPositiveSortOrder,
  mapCanonicalContentItemToCard,
  toCanonicalAssetCreateRequest,
} from "@/features/lcms/admin-operations/api/learning-resource-authoring-content-mapper";
import { mapGraphQlResourceCard } from "@/features/lcms/admin-operations/api/learning-resource-authoring-library-mapper";
import { loadLearningResourceLibraryGraphQl } from "@/features/lcms/admin-operations/api/learning-resource-authoring-library-query-api";
import { createLearningResourceAsset } from "@/features/lcms/admin-operations/api/learning-resource-authoring-asset-command-api";
import { compactObject, slugify } from "@/features/lcms/admin-operations/api/learning-resource-authoring-utils";
import type {
  CreateLearningResourceResourcePayload,
  LearningResourceResourceCard,
  LearningResourceResourceDetail,
  StudioAssetResponse,
} from "@/features/lcms/admin-operations/api/learning-resource-authoring-domain-types";
import type { ContentAssetResponse, ContentItemResponse, ContentPlacementResponse, GoogleSlidesLectureResponse } from "@/features/lcms/admin-operations/api/learning-resource-authoring-transport-types";

export async function createLearningResourceResource(payload: CreateLearningResourceResourcePayload) {
  if (payload.selectedFileType === "PPTX" && payload.topicId && payload.upstreamUrl) {
    const lecture = await apiRequest<GoogleSlidesLectureResponse>(API_ENDPOINTS.legacy.contentSlides, {
      method: "POST",
      body: JSON.stringify({
        topicId: payload.topicId,
        title: payload.title,
        googleSlidesUrl: payload.upstreamUrl,
        status: canonicalContentStatus(payload.status),
        visibility: canonicalContentVisibility(payload.visibility),
      }),
    });
    return mapCanonicalContentItemToCard(
      {
        ...lecture.contentItem,
        assets: [{ ...lecture.contentAsset, assetRole: "primary", sortOrder: 1 }],
        placements: [lecture.placement],
      },
      payload,
    );
  }
  const { contentItem, contentAsset, placement } = await createCanonicalLearningResource(payload);
  return mapCanonicalContentItemToCard(
    {
      ...contentItem,
      assets: contentAsset ? [{ ...contentAsset, assetRole: "primary", sortOrder: 1 }] : [],
      placements: placement ? [placement] : [],
    },
    payload,
  );
}

export async function updateLearningResourceResource(resourceId: string, payload: Partial<CreateLearningResourceResourcePayload>) {
  const contentItem = await apiRequest<ContentItemResponse>(API_ENDPOINTS.content.item(resourceId), {
    method: "PATCH",
    body: JSON.stringify(compactObject({
      contentType: payload.selectedFileType || payload.documentTypeId ? contentTypeForResource(payload) : undefined,
      title: payload.title,
      description: payload.description ?? payload.subtitle,
      status: payload.status ? canonicalContentStatus(payload.status) : undefined,
      visibility: payload.visibility ? canonicalContentVisibility(payload.visibility) : undefined,
    })),
  });
  return mapCanonicalContentItemToCard(contentItem, payload);
}

export function deleteLearningResourceResource(resourceId: string) {
  return apiRequest<{ deleted: boolean }>(API_ENDPOINTS.content.item(resourceId), {
    method: "DELETE",
  });
}

export async function loadLearningResourceResourceDetail(resourceId: string): Promise<LearningResourceResourceDetail> {
  const library = await loadLearningResourceLibraryGraphQl({ size: 100, status: undefined });
  const resource = (library.resources.items ?? []).find((item) => item.id === resourceId);
  const card = resource
    ? mapGraphQlResourceCard(resource)
    : {
        id: resourceId,
        slug: slugify(resourceId),
        title: resourceId,
        programSlug: "curriculum",
        subjectId: "curriculum",
        categoryId: "curriculum",
        selectedFileType: "PDF",
        fileTypeBadge: "PDF",
        launchMode: "pdf_reader",
        priceType: "free",
        accessState: "open",
        canDownload: false,
      };

  return {
    ...card,
    description: card.subtitle,
    assets: [],
  };
}

export function uploadLearningResourceResource(input: {
  file?: File;
  title: string;
  selectedFileType: string;
  subjectId: string;
  categoryId: string;
  slug?: string;
  subtitle?: string;
  description?: string;
  thumbnailUrl?: string;
  programSlug?: string;
  gradeId?: string;
  sectionId?: string;
  bookSeriesId?: string;
  topicId?: string;
  levelId?: string;
  documentTypeId?: string;
  priceType?: string;
  visibility?: string;
  status?: string;
  canDownload?: boolean;
  upstreamUrl?: string;
  storageUrl?: string;
  tags?: string[];
  totalSlides?: number;
}): Promise<{ resource: LearningResourceResourceCard; asset: StudioAssetResponse }> {
  const { upstreamUrl, storageUrl, totalSlides, ...resourceInput } = input;
  return createLearningResourceResource({
    ...resourceInput,
    programSlug: input.programSlug || input.subjectId,
  }).then(async (resource) => {
    const asset = await createLearningResourceAsset(resource.id, {
      title: input.title,
      selectedFileType: input.selectedFileType,
      file: input.file,
      storageProvider: upstreamUrl || storageUrl ? "google_drive" : undefined,
      storageUrl: upstreamUrl || storageUrl,
      totalSlides,
      canDownload: input.canDownload,
    });
    return { resource, asset };
  });
}

async function createCanonicalLearningResource(payload: CreateLearningResourceResourcePayload) {
  const contentItem = await apiRequest<ContentItemResponse>(API_ENDPOINTS.legacy.contentItems, {
    method: "POST",
    body: JSON.stringify({
      contentType: contentTypeForResource(payload),
      title: payload.title,
      description: payload.description,
      status: canonicalContentStatus(payload.status),
      visibility: canonicalContentVisibility(payload.visibility),
    }),
  });

  const contentAsset = await createCanonicalContentAsset(payload);
  if (contentAsset) {
    await apiRequest(API_ENDPOINTS.content.itemAssets(contentItem.id), {
      method: "POST",
      body: JSON.stringify({
        contentAssetId: contentAsset.id,
        assetRole: "primary",
        sortOrder: 1,
        metadata: compactObject({
          source: "learning-resource-authoring",
          selectedFileType: payload.selectedFileType,
        }),
      }),
    });
  }

  const placement = payload.topicId
    ? await apiRequest<ContentPlacementResponse>(API_ENDPOINTS.curriculum.topicContentItems(payload.topicId), {
        method: "POST",
        body: JSON.stringify({
          contentItemId: contentItem.id,
          contentRole: contentRoleForResource(payload),
          sortOrder: firstPositiveSortOrder(payload.items?.[0]?.sortOrder),
          status: payload.status === "archived" ? "archived" : "active",
        }),
      })
    : undefined;

  return { contentItem, contentAsset, placement };
}

async function createCanonicalContentAsset(payload: CreateLearningResourceResourcePayload) {
  const storageUrl = payload.upstreamUrl || payload.storageUrl;
  const hasAssetMetadata = Boolean(storageUrl || payload.originalFileName || payload.detectedMimeType || payload.totalSlides);
  if (!hasAssetMetadata) return null;

  return apiRequest<ContentAssetResponse>(API_ENDPOINTS.legacy.contentAssets, {
    method: "POST",
    body: JSON.stringify(toCanonicalAssetCreateRequest({
      title: payload.title,
      selectedFileType: payload.selectedFileType,
      originalFileName: payload.originalFileName,
      detectedMimeType: payload.detectedMimeType,
      storageProvider: storageUrl ? "google_drive" : "metadata_only",
      storageUrl,
      status: payload.status === "archived" ? "archived" : "active",
      totalSlides: payload.totalSlides,
      canDownload: payload.canDownload,
    })),
  });
}
