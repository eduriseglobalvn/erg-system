import { apiRequest } from "@/lib/api-client";

export type HocLieuTaxonomyOption = {
  id: string;
  label: string;
  slug?: string;
  parentId?: string;
  subjectId?: string;
  gradeId?: string;
  categoryId?: string;
  bookSeriesId?: string;
  topicId?: string;
  levelIds?: string[];
  description?: string;
  sortOrder?: number;
  status?: string;
  metadata?: Record<string, string>;
};

export type HocLieuTaxonomyResponse = {
  grades: HocLieuTaxonomyOption[];
  subjects: HocLieuTaxonomyOption[];
  categories: HocLieuTaxonomyOption[];
  sections: HocLieuTaxonomyOption[];
  bookSeries: HocLieuTaxonomyOption[];
  topics: HocLieuTaxonomyOption[];
  fileTypes: string[];
  designerPresets?: Array<{
    id: string;
    name: string;
    description: string;
    accentColor: string;
    layout: string;
  }>;
};

export type HocLieuResourceCard = {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  thumbnailUrl?: string;
  programSlug: string;
  subjectId: string;
  gradeId?: string;
  categoryId: string;
  sectionId?: string;
  bookSeriesId?: string;
  topicId?: string;
  levelId?: string;
  documentTypeId?: string;
  selectedFileType: string;
  fileTypeBadge?: string;
  launchMode: string;
  priceType: string;
  accessState: string;
  visibility?: string;
  status?: string;
  canDownload: boolean;
  updatedAt?: string;
};

export type HocLieuAssetDetail = {
  id: string;
  resourceId: string;
  title?: string;
  selectedFileType?: string;
  fileTypeBadge?: string;
  launchMode?: string;
  originalFileName?: string;
  detectedMimeType?: string;
  fileExtension?: string;
  storageProvider?: string;
  storageUrl?: string;
  upstreamUrl?: string;
  canDownload?: boolean;
  status?: string;
};

export type HocLieuResourceDetail = HocLieuResourceCard & {
  description?: string;
  assets: HocLieuAssetDetail[];
};

export type HocLieuResourceList = {
  data: HocLieuResourceCard[];
  total?: number;
  page?: number;
  limit?: number;
};

type HocLieuStudioBootstrap = {
  subjects: HocLieuTaxonomyOption[];
  groups?: HocLieuTaxonomyOption[];
  categories?: HocLieuTaxonomyOption[];
  lessons?: HocLieuTaxonomyOption[];
  sections?: HocLieuTaxonomyOption[];
  resources?: StudioResourceResponse[];
  fileTypes?: string[];
  designerPresets?: HocLieuTaxonomyResponse["designerPresets"];
};

type StudioTaxonomyNodeResponse = HocLieuTaxonomyOption & {
  kind?: string;
  childCount?: number;
  resourceCount?: number;
};

type StudioResourceResponse = {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  thumbnailUrl?: string;
  subjectId?: string;
  categoryId?: string;
  groupId?: string;
  lessonId?: string;
  sectionId?: string;
  fileType?: string;
  type?: string;
  status?: string;
  visibility?: string;
  updatedAt?: string;
};

export type StudioAssetResponse = {
  id: string;
  resourceId: string;
  title?: string;
  selectedFileType?: string;
  fileType?: string;
  launchMode?: string;
  originalFileName?: string;
  mimeType?: string;
  extension?: string;
  sizeBytes?: number;
  storageProvider?: string;
  storageUrl?: string;
  upstreamUrl?: string;
  canDownload?: boolean;
  status?: string;
};

export type CreateHocLieuResourcePayload = {
  title: string;
  slug?: string;
  subtitle?: string;
  description?: string;
  thumbnailUrl?: string;
  upstreamUrl?: string;
  programSlug: string;
  subjectId: string;
  gradeId?: string;
  categoryId: string;
  sectionId?: string;
  bookSeriesId?: string;
  topicId?: string;
  levelId?: string;
  documentTypeId?: string;
  selectedFileType: string;
  originalFileName?: string;
  detectedMimeType?: string;
  storageUrl?: string;
  totalSlides?: number;
  priceType?: string;
  visibility?: string;
  status?: string;
  canDownload?: boolean;
  tags?: string[];
  items?: Array<{
    id?: string;
    unitTitle: string;
    lessonTitle?: string;
    sortOrder?: number;
    pageCount?: number;
    durationSec?: number;
  }>;
  lectureDesign?: {
    templateId?: string;
    bannerTitle?: string;
    bannerSubtitle?: string;
    backgroundUrl?: string;
    coverUrl?: string;
    accentColor?: string;
    secondaryColor?: string;
    logoUrl?: string;
    itemColumns?: number;
    showDownload?: boolean;
    unitLabels?: string[];
  };
};

export type CreateTaxonomyPayload = {
  id?: string;
  label: string;
  slug?: string;
  parentId?: string;
  subjectId?: string;
  gradeId?: string;
  categoryId?: string;
  bookSeriesId?: string;
  topicId?: string;
  levelIds?: string[];
  description?: string;
  sortOrder?: number;
  status?: string;
  metadata?: Record<string, string>;
};

export function loadHocLieuStudioBootstrap() {
  return apiRequest<HocLieuStudioBootstrap>("/api/v1/admin/hoclieu/studio/bootstrap");
}

export async function loadHocLieuTaxonomies() {
  const bootstrap = await loadHocLieuStudioBootstrap();
  return mapStudioBootstrapToTaxonomies(bootstrap);
}

export async function loadHocLieuStudioWorkspaceData(limit = 120) {
  const bootstrap = await loadHocLieuStudioBootstrap();
  const taxonomy = mapStudioBootstrapToTaxonomies(bootstrap);
  const resources = mapStudioBootstrapToResources(bootstrap, limit);

  return {
    taxonomy,
    subjects: taxonomy.subjects,
    resources,
  };
}

export async function listHocLieuTaxonomies(kind: string) {
  const taxonomy = await loadHocLieuTaxonomies();

  switch (kind) {
    case "subjects":
      return taxonomy.subjects;
    case "categories":
    case "groups":
      return taxonomy.categories;
    case "sections":
    case "lessons":
      return taxonomy.sections;
    case "topics":
      return taxonomy.topics;
    case "book-series":
    case "bookSeries":
      return taxonomy.bookSeries;
    default:
      return [];
  }
}

export function listHocLieuSubjects() {
  return listHocLieuTaxonomies("subjects");
}

export async function listHocLieuResources(params: Record<string, string | number | undefined> = {}) {
  const bootstrap = await loadHocLieuStudioBootstrap();
  const limit = Number(params.limit ?? 100);
  const resources = (bootstrap.resources ?? [])
    .map(mapStudioResourceToCard)
    .filter((resource) => !params.subjectId || resource.subjectId === params.subjectId)
    .filter((resource) => !params.categoryId || resource.categoryId === params.categoryId)
    .filter((resource) => !params.sectionId || resource.sectionId === params.sectionId)
    .slice(0, Number.isFinite(limit) && limit > 0 ? limit : undefined);

  return {
    data: resources,
    total: resources.length,
    page: 1,
    limit,
  } satisfies HocLieuResourceList;
}

export async function createHocLieuResource(payload: CreateHocLieuResourcePayload) {
  const resource = await apiRequest<StudioResourceResponse>("/api/v1/admin/hoclieu/resources", {
    method: "POST",
    body: JSON.stringify(toStudioResourceRequest(payload)),
  });
  if (payload.upstreamUrl || payload.storageUrl) {
    await createHocLieuAsset(resource.id, {
      title: payload.title,
      selectedFileType: payload.selectedFileType,
      originalFileName: payload.originalFileName || payload.title,
      detectedMimeType: payload.detectedMimeType,
      storageProvider: "google_drive",
      storageUrl: payload.upstreamUrl || payload.storageUrl,
      canDownload: payload.canDownload,
      status: "ready",
      totalSlides: payload.totalSlides,
    });
  }
  return mapStudioResourceToCard(resource);
}

export async function updateHocLieuResource(resourceId: string, payload: Partial<CreateHocLieuResourcePayload>) {
  const resource = await apiRequest<StudioResourceResponse>(`/api/v1/admin/hoclieu/resources/${encodeURIComponent(resourceId)}`, {
    method: "PATCH",
    body: JSON.stringify(toStudioResourceRequest(payload)),
  });
  return mapStudioResourceToCard(resource);
}

export function deleteHocLieuResource(resourceId: string) {
  return apiRequest<{ deleted: boolean }>(`/api/v1/admin/hoclieu/resources/${encodeURIComponent(resourceId)}`, {
    method: "DELETE",
  });
}

export async function loadHocLieuResourceDetail(resourceId: string): Promise<HocLieuResourceDetail> {
  const detail = await apiRequest<StudioResourceResponse & { assets?: StudioAssetResponse[]; description?: string }>(
    `/api/v1/hoclieu/resources/${encodeURIComponent(resourceId)}`,
  );

  return {
    ...mapStudioResourceToCard(detail),
    description: detail.description,
    assets: (detail.assets ?? []).map(mapStudioAssetToDetail),
  };
}

export async function createHocLieuTaxonomy(kind: string, payload: CreateTaxonomyPayload) {
  const path = payload.parentId
    ? `/api/v1/admin/hoclieu/taxonomy/${encodeURIComponent(payload.parentId)}/children`
    : "/api/v1/admin/hoclieu/taxonomy";
  const node = await apiRequest<StudioTaxonomyNodeResponse>(path, {
    method: "POST",
    body: JSON.stringify(toStudioTaxonomyRequest(kind, payload)),
  });
  return mapStudioTaxonomyNode(node);
}

export async function updateHocLieuTaxonomy(kind: string, id: string, payload: Partial<CreateTaxonomyPayload>) {
  const node = await apiRequest<StudioTaxonomyNodeResponse>(`/api/v1/admin/hoclieu/taxonomy/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(toStudioTaxonomyRequest(kind, payload)),
  });
  return mapStudioTaxonomyNode(node);
}

export function deleteHocLieuTaxonomy(_kind: string, id: string) {
  return apiRequest<{ deleted: boolean }>(`/api/v1/admin/hoclieu/taxonomy/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export function uploadHocLieuAsset(input: {
  resourceId: string;
  file?: File;
  selectedFileType: string;
  title?: string;
  storageUrl?: string;
  totalSlides?: number;
  canDownload?: boolean;
}): Promise<StudioAssetResponse> {
  return createHocLieuAsset(input.resourceId, {
    title: input.title || input.file?.name,
    selectedFileType: input.selectedFileType,
    file: input.file,
    storageProvider: input.storageUrl ? "google_drive" : undefined,
    storageUrl: input.storageUrl,
    totalSlides: input.totalSlides,
    canDownload: input.canDownload,
  });
}

export function createHocLieuAsset(
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
  return apiRequest<StudioAssetResponse>(`/api/v1/admin/hoclieu/resources/${encodeURIComponent(resourceId)}/assets`, {
    method: "POST",
    body: JSON.stringify(toStudioAssetRequest(input)),
  });
}

export function updateHocLieuAsset(
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
  return apiRequest<StudioAssetResponse>(`/api/v1/admin/hoclieu/assets/${encodeURIComponent(assetId)}`, {
    method: "PATCH",
    body: JSON.stringify(compactObject(input)),
  }).then(mapStudioAssetToDetail);
}

export function uploadHocLieuResource(input: {
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
}): Promise<{ resource: HocLieuResourceCard; asset: StudioAssetResponse }> {
  const { upstreamUrl, storageUrl, ...resourceInput } = input;
  return createHocLieuResource({
    ...resourceInput,
    programSlug: input.programSlug || input.subjectId,
  }).then(async (resource) => {
    const asset = await createHocLieuAsset(resource.id, {
      title: input.title,
      selectedFileType: input.selectedFileType,
      file: input.file,
      storageProvider: upstreamUrl || storageUrl ? "google_drive" : undefined,
      storageUrl: upstreamUrl || storageUrl,
      totalSlides: input.totalSlides,
      canDownload: input.canDownload,
    });
    return { resource, asset };
  });
}

function toStudioResourceRequest(payload: Partial<CreateHocLieuResourcePayload>) {
  const fileType = payload.documentTypeId || payload.selectedFileType || "PDF";
  return compactObject({
    title: payload.title,
    slug: payload.slug,
    subtitle: payload.subtitle,
    description: payload.description,
    thumbnailUrl: payload.thumbnailUrl,
    subjectId: payload.subjectId,
    categoryId: payload.categoryId,
    sectionId: payload.sectionId,
    lessonId: payload.sectionId,
    type: fileType,
    documentTypeId: fileType,
    fileType,
    status: payload.status || "published",
    visibility: normalizeVisibilityForStudio(payload.visibility),
    programSlug: payload.programSlug || payload.subjectId,
    canDownload: payload.canDownload,
  });
}

function toStudioTaxonomyRequest(kind: string, payload: Partial<CreateTaxonomyPayload>) {
  return compactObject({
    id: payload.id,
    kind: taxonomyKindForStudio(kind),
    label: payload.label,
    slug: payload.slug,
    parentId: payload.parentId,
    subjectId: payload.subjectId,
    categoryId: payload.categoryId,
    sortOrder: payload.sortOrder,
    status: payload.status || "active",
    description: payload.description,
  });
}

function toStudioAssetRequest(input: {
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
  const fileName = input.originalFileName || input.file?.name || input.title || "hoc-lieu";
  const selectedFileType = input.selectedFileType || input.fileExtension || "PDF";

  return compactObject({
    title: input.title || fileName,
    selectedFileType,
    fileType: selectedFileType,
    launchMode: input.launchMode || launchModeFor(selectedFileType),
    originalFileName: fileName,
    detectedMimeType: input.detectedMimeType || input.file?.type,
    mimeType: input.detectedMimeType || input.file?.type,
    fileExtension: input.fileExtension || extensionFromFileName(fileName),
    extension: input.fileExtension || extensionFromFileName(fileName),
    fileSizeBytes: input.fileSizeBytes ?? input.file?.size,
    sizeBytes: input.fileSizeBytes ?? input.file?.size,
    storageProvider: input.storageProvider || "metadata_only",
    storageUrl: input.storageUrl,
    canDownload: Boolean(input.canDownload),
    status: input.status || "ready",
    metadata: googleSlideMetadata(input),
  });
}

function mapStudioBootstrapToTaxonomies(bootstrap: HocLieuStudioBootstrap): HocLieuTaxonomyResponse {
  return {
    grades: [],
    subjects: sortTaxonomies(bootstrap.subjects ?? []),
    categories: sortTaxonomies(bootstrap.groups ?? bootstrap.categories ?? []),
    sections: sortTaxonomies(bootstrap.lessons ?? bootstrap.sections ?? []),
    bookSeries: [],
    topics: [],
    fileTypes: bootstrap.fileTypes ?? [],
    designerPresets: bootstrap.designerPresets,
  };
}

function mapStudioBootstrapToResources(bootstrap: HocLieuStudioBootstrap, limit: number): HocLieuResourceList {
  const resources = (bootstrap.resources ?? []).map(mapStudioResourceToCard).slice(0, Number.isFinite(limit) && limit > 0 ? limit : undefined);

  return {
    data: resources,
    total: resources.length,
    page: 1,
    limit,
  };
}

function mapStudioTaxonomyNode(node: StudioTaxonomyNodeResponse): HocLieuTaxonomyOption {
  return {
    id: node.id,
    label: node.label,
    slug: node.slug,
    parentId: node.parentId,
    subjectId: node.subjectId,
    categoryId: node.categoryId,
    description: node.description,
    sortOrder: node.sortOrder,
    status: node.status,
    metadata: node.metadata,
  };
}

function mapStudioResourceToCard(resource: StudioResourceResponse): HocLieuResourceCard {
  const subjectId = resource.subjectId || "hoc-lieu";
  const categoryId = resource.categoryId || resource.groupId || subjectId;
  const sectionId = resource.sectionId || resource.lessonId || categoryId;
  const fileType = normalizeStudioFileType(resource.fileType || resource.type || "PDF");

  return {
    id: resource.id,
    slug: slugify(resource.title || resource.id),
    title: resource.title,
    subtitle: resource.subtitle,
    thumbnailUrl: resource.thumbnailUrl,
    programSlug: subjectId,
    subjectId,
    categoryId,
    sectionId,
    selectedFileType: fileType,
    fileTypeBadge: fileType,
    launchMode: launchModeFor(fileType),
    priceType: "free",
    accessState: "open",
    visibility: resource.visibility,
    status: resource.status,
    canDownload: false,
    updatedAt: resource.updatedAt,
  };
}

function mapStudioAssetToDetail(asset: StudioAssetResponse): HocLieuAssetDetail {
  return {
    id: asset.id,
    resourceId: asset.resourceId,
    title: asset.title,
    selectedFileType: asset.selectedFileType || asset.fileType,
    fileTypeBadge: asset.fileType || asset.selectedFileType,
    launchMode: asset.launchMode,
    originalFileName: asset.originalFileName,
    detectedMimeType: asset.mimeType,
    fileExtension: asset.extension,
    storageProvider: asset.storageProvider,
    storageUrl: asset.storageUrl,
    upstreamUrl: asset.upstreamUrl,
    canDownload: asset.canDownload,
    status: asset.status,
  };
}

function sortTaxonomies(items: HocLieuTaxonomyOption[]) {
  return [...items].sort((left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0) || left.label.localeCompare(right.label, "vi"));
}

function normalizeStudioFileType(fileType: string) {
  const normalized = fileType.toUpperCase();
  if (normalized === "LECTURE") return "PPTX";
  if (normalized === "EXERCISE") return "QUIZ";
  return normalized;
}

function launchModeFor(fileType: string) {
  const normalized = normalizeStudioFileType(fileType);
  if (normalized === "PPTX") return "google_slide_embed";
  if (normalized === "QUIZ") return "quiz_runtime";
  if (normalized === "PDF") return "pdf_reader";
  if (normalized === "VIDEO") return "video_player";
  if (normalized === "AUDIO") return "audio_player";
  if (normalized === "LINK") return "external";
  return "download_only";
}

function taxonomyKindForStudio(kind: string) {
  const normalized = kind.toLowerCase();
  if (normalized === "subjects" || normalized === "subject") return "subject";
  if (["categories", "groups", "category", "group"].includes(normalized)) return "category";
  if (["sections", "lessons", "section", "lesson"].includes(normalized)) return "section";
  throw new Error("Learning Resources backend currently supports subject, category, and section taxonomy only.");
}

function normalizeVisibilityForStudio(visibility?: string) {
  if (!visibility || visibility === "public" || visibility === "published") return "open";
  return visibility;
}

function googleSlideMetadata(input: { totalSlides?: number; metadata?: Record<string, unknown> }) {
  const totalSlides = positiveInteger(input.totalSlides);
  if (!totalSlides && !input.metadata) return undefined;
  return compactObject({
    ...(input.metadata ?? {}),
    totalSlides,
  });
}

function positiveInteger(value?: number) {
  if (!Number.isFinite(value)) return undefined;
  const normalized = Math.floor(Number(value));
  return normalized > 0 ? normalized : undefined;
}

function extensionFromFileName(fileName: string) {
  const segments = fileName.split(".");
  return segments.length > 1 ? segments.pop()?.toLowerCase() : undefined;
}

function compactObject<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined && entry !== "")) as Partial<T>;
}

function slugify(value: string) {
  return value
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}
