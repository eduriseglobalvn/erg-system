import { compactObject, extensionFromFileName, launchModeFor, normalizeStudioFileType, positiveInteger, slugify } from "@/features/lcms/admin-operations/api/learning-resource-authoring-utils";
import type { CreateLearningResourceResourcePayload, CreateTaxonomyPayload, LearningResourceResourceCard, LearningResourceTaxonomyOption, StudioAssetResponse } from "@/features/lcms/admin-operations/api/learning-resource-authoring-domain-types";
import type { ContentAssetResponse, ContentItemResponse, CurriculumTreeNodeResponse } from "@/features/lcms/admin-operations/api/learning-resource-authoring-transport-types";

export function toCanonicalAssetCreateRequest(input: {
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
}) {
  const fileName = input.originalFileName || input.file?.name || input.title || "learning-resource";
  const selectedFileType = normalizeStudioFileType(input.selectedFileType || input.fileExtension || "PDF");
  return compactObject({
    assetType: canonicalAssetType({ selectedFileType }),
    title: input.title || fileName,
    storageProvider: input.storageProvider || (input.storageUrl ? "google_drive" : "metadata_only"),
    storageUrl: input.storageUrl,
    mimeType: input.detectedMimeType || input.file?.type,
    byteSize: input.fileSizeBytes ?? input.file?.size,
    status: input.status || "active",
    metadata: compactObject({
      ...(input.metadata ?? {}),
      originalFileName: fileName,
      selectedFileType,
      launchMode: input.launchMode || launchModeFor(selectedFileType),
      fileExtension: input.fileExtension || extensionFromFileName(fileName),
      totalSlides: positiveInteger(input.totalSlides),
      canDownload: input.canDownload,
    }),
  });
}

export function toCanonicalAssetUpdateRequest(input: {
  title?: string;
  selectedFileType?: string;
  originalFileName?: string;
  detectedMimeType?: string;
  storageProvider?: string;
  storageUrl?: string;
  upstreamUrl?: string;
  canDownload?: boolean;
  status?: string;
}) {
  const selectedFileType = input.selectedFileType ? normalizeStudioFileType(input.selectedFileType) : undefined;
  return compactObject({
    assetType: selectedFileType ? canonicalAssetType({ selectedFileType }) : undefined,
    title: input.title,
    storageProvider: input.storageProvider || (input.upstreamUrl || input.storageUrl ? "google_drive" : undefined),
    storageUrl: input.upstreamUrl || input.storageUrl,
    mimeType: input.detectedMimeType,
    status: input.status,
    metadata: compactObject({
      originalFileName: input.originalFileName,
      selectedFileType,
      launchMode: selectedFileType ? launchModeFor(selectedFileType) : undefined,
      canDownload: input.canDownload,
    }),
  });
}

export function canonicalAssetType(payload: Pick<CreateLearningResourceResourcePayload, "selectedFileType" | "documentTypeId">) {
  const type = normalizeStudioFileType(payload.documentTypeId || payload.selectedFileType || "PDF");
  if (type === "PPTX") return "GOOGLE_SLIDE";
  if (type === "QUIZ") return "QUIZ_PACKAGE";
  if (type === "VIDEO") return "VIDEO";
  if (type === "AUDIO") return "AUDIO";
  if (type === "LINK") return "EXTERNAL_LINK";
  return "DOCUMENT";
}

export function contentTypeForResource(payload: Partial<Pick<CreateLearningResourceResourcePayload, "selectedFileType" | "documentTypeId">>) {
  const type = normalizeStudioFileType(payload.documentTypeId || payload.selectedFileType || "PDF");
  if (type === "QUIZ") return "EXERCISE";
  if (type === "PPTX" || type === "PDF" || type === "VIDEO" || type === "AUDIO" || type === "LINK") return "LECTURE";
  return "DOCUMENT";
}

export function contentRoleForResource(payload: Partial<Pick<CreateLearningResourceResourcePayload, "selectedFileType" | "documentTypeId">>) {
  return contentTypeForResource(payload) === "EXERCISE" ? "EXERCISE" : "LECTURE";
}

export function canonicalContentStatus(status?: string) {
  if (!status || status === "published") return "published";
  if (status === "ready") return "published";
  if (status === "archived") return "archived";
  return "draft";
}

export function canonicalContentVisibility(visibility?: string) {
  if (!visibility || visibility === "open" || visibility === "published") return "public";
  if (visibility === "private") return "private";
  return visibility;
}

export function firstPositiveSortOrder(value?: number) {
  return positiveInteger(value) ?? undefined;
}

export function toCurriculumTaxonomyRequest(payload: Partial<CreateTaxonomyPayload>) {
  return compactObject({
    id: payload.id,
    code: payload.code || payload.slug || slugify(payload.label || "node"),
    name: payload.label,
    slug: payload.slug,
    parentId: payload.parentId,
    subjectId: payload.subjectId,
    gradeId: payload.gradeId,
    levelId: payload.categoryId || payload.parentId,
    categoryId: payload.categoryId,
    bookSeriesId: payload.bookSeriesId,
    topicId: payload.topicId,
    levelIds: payload.levelIds,
    sortOrder: payload.sortOrder,
    status: payload.status,
    description: payload.description,
    metadata: payload.metadata,
  });
}

export function mapCurriculumTaxonomyNode(node: CurriculumTreeNodeResponse, fallback: Partial<LearningResourceTaxonomyOption> = {}): LearningResourceTaxonomyOption {
  const categoryId = node.categoryId || node.levelId || fallback.categoryId;
  return {
    id: node.id || fallback.id || "",
    label: node.label || node.name || node.title || fallback.label || "",
    slug: node.slug || fallback.slug,
    parentId: node.parentId || fallback.parentId || categoryId,
    subjectId: node.subjectId || fallback.subjectId,
    gradeId: node.gradeId || fallback.gradeId,
    categoryId,
    bookSeriesId: node.bookSeriesId || fallback.bookSeriesId,
    topicId: node.topicId || fallback.topicId,
    levelIds: node.levelIds || fallback.levelIds,
    description: node.description || fallback.description,
    sortOrder: node.sortOrder ?? fallback.sortOrder,
    status: node.status || fallback.status,
    metadata: node.metadata || fallback.metadata,
  };
}

export function mapCanonicalContentItemToCard(
  item: ContentItemResponse,
  scope: Record<string, unknown> = {},
): LearningResourceResourceCard {
  const primaryPlacement = [...(item.placements ?? [])].sort((left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0))[0];
  const primaryAsset = [...(item.assets ?? [])].sort((left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0))[0];
  const selectedFileType = fileTypeForCanonicalContent(item, primaryAsset);
  const topicId = primaryPlacement?.topicId || String(scope.topicId || scope.sectionId || item.id);
  const categoryId = String(scope.categoryId || scope.levelId || topicId);
  const subjectId = String(scope.subjectId || "curriculum");

  return {
    id: item.id,
    slug: slugify(item.title || item.id),
    title: item.title,
    subtitle: item.description,
    programSlug: subjectId,
    subjectId,
    categoryId,
    sectionId: topicId,
    topicId,
    selectedFileType,
    fileTypeBadge: selectedFileType,
    launchMode: launchModeFor(selectedFileType),
    priceType: "free",
    accessState: "open",
    visibility: item.visibility,
    status: item.status,
    canDownload: Boolean(primaryAsset?.metadata?.canDownload),
    updatedAt: item.updatedAt,
  };
}

export function mapContentAssetToStudioAsset(asset: ContentAssetResponse, resourceId: string): StudioAssetResponse {
  const selectedFileType = typeof asset.metadata?.selectedFileType === "string"
    ? normalizeStudioFileType(asset.metadata.selectedFileType)
    : fileTypeForCanonicalAsset(asset);
  const originalFileName = typeof asset.metadata?.originalFileName === "string" ? asset.metadata.originalFileName : asset.title;
  return {
    id: asset.id,
    resourceId,
    title: asset.title,
    selectedFileType,
    fileType: selectedFileType,
    launchMode: typeof asset.metadata?.launchMode === "string" ? asset.metadata.launchMode : launchModeFor(selectedFileType),
    originalFileName,
    mimeType: asset.mimeType,
    extension: extensionFromFileName(originalFileName || asset.title || selectedFileType.toLowerCase()),
    sizeBytes: asset.byteSize,
    storageProvider: asset.storageProvider,
    storageUrl: asset.storageUrl,
    upstreamUrl: asset.storageUrl,
    canDownload: Boolean(asset.metadata?.canDownload),
    status: asset.status,
  };
}

export function fileTypeForCanonicalContent(item: ContentItemResponse, asset?: ContentAssetResponse) {
  const assetType = (asset?.assetType || "").toUpperCase();
  const contentType = (item.contentType || "").toUpperCase();
  const selectedFileType = typeof asset?.metadata?.selectedFileType === "string" ? asset.metadata.selectedFileType : "";
  if (selectedFileType) return normalizeStudioFileType(selectedFileType);
  if (assetType === "GOOGLE_SLIDE") return "PPTX";
  if (assetType === "QUIZ_PACKAGE" || contentType === "EXERCISE") return "QUIZ";
  if (assetType === "VIDEO") return "VIDEO";
  if (assetType === "AUDIO") return "AUDIO";
  if (assetType === "EXTERNAL_LINK") return "LINK";
  return "PDF";
}

export function fileTypeForCanonicalAsset(asset: ContentAssetResponse) {
  const assetType = (asset.assetType || "").toUpperCase();
  if (assetType === "GOOGLE_SLIDE") return "PPTX";
  if (assetType === "QUIZ_PACKAGE") return "QUIZ";
  if (assetType === "VIDEO") return "VIDEO";
  if (assetType === "AUDIO") return "AUDIO";
  if (assetType === "EXTERNAL_LINK") return "LINK";
  return "PDF";
}
