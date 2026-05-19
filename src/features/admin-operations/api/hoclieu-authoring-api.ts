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

export type HocLieuResourceList = {
  data: HocLieuResourceCard[];
  total?: number;
  page?: number;
  limit?: number;
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

export function loadHocLieuTaxonomies() {
  return apiRequest<HocLieuTaxonomyResponse>("/api/hoclieu/admin/content-model");
}

export function listHocLieuTaxonomies(kind: string) {
  return apiRequest<HocLieuTaxonomyOption[]>(`/api/hoclieu/admin/taxonomy/${encodeURIComponent(kind)}`);
}

export function listHocLieuSubjects() {
  return listHocLieuTaxonomies("subjects");
}

export function listHocLieuResources(params: Record<string, string | number | undefined> = {}) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  if (!search.has("limit")) search.set("limit", "100");
  return apiRequest<HocLieuResourceList>(`/api/hoclieu/resources?${search.toString()}`);
}

export function createHocLieuResource(payload: CreateHocLieuResourcePayload) {
  return apiRequest<HocLieuResourceCard>("/api/hoclieu/admin/resources", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateHocLieuResource(resourceId: string, payload: Partial<CreateHocLieuResourcePayload>) {
  return apiRequest<HocLieuResourceCard>(`/api/hoclieu/admin/resources/${encodeURIComponent(resourceId)}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteHocLieuResource(resourceId: string) {
  return apiRequest<{ deleted: boolean }>(`/api/hoclieu/admin/resources/${encodeURIComponent(resourceId)}`, {
    method: "DELETE",
  });
}

export function createHocLieuTaxonomy(kind: string, payload: CreateTaxonomyPayload) {
  return apiRequest<HocLieuTaxonomyOption>(`/api/hoclieu/admin/taxonomy/${encodeURIComponent(kind)}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateHocLieuTaxonomy(kind: string, id: string, payload: Partial<CreateTaxonomyPayload>) {
  return apiRequest<HocLieuTaxonomyOption>(`/api/hoclieu/admin/taxonomy/${encodeURIComponent(kind)}/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteHocLieuTaxonomy(kind: string, id: string) {
  return apiRequest<{ deleted: boolean }>(`/api/hoclieu/admin/taxonomy/${encodeURIComponent(kind)}/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export function uploadHocLieuAsset(input: {
  resourceId: string;
  file: File;
  selectedFileType: string;
  title?: string;
  canDownload?: boolean;
}) {
  const form = new FormData();
  form.set("resourceId", input.resourceId);
  form.set("selectedFileType", input.selectedFileType);
  form.set("title", input.title || input.file.name);
  form.set("canDownload", String(Boolean(input.canDownload)));
  form.set("file", input.file);
  return apiRequest(`/api/hoclieu/admin/assets/upload`, {
    method: "POST",
    body: form,
  });
}

export function uploadHocLieuResource(input: {
  file: File;
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
  tags?: string[];
}) {
  const form = new FormData();
  form.set("file", input.file);
  form.set("title", input.title);
  form.set("selectedFileType", input.selectedFileType);
  form.set("subjectId", input.subjectId);
  form.set("categoryId", input.categoryId);
  const optional: Record<string, string | undefined> = {
    slug: input.slug,
    subtitle: input.subtitle,
    description: input.description,
    thumbnailUrl: input.thumbnailUrl,
    programSlug: input.programSlug,
    gradeId: input.gradeId,
    sectionId: input.sectionId,
    bookSeriesId: input.bookSeriesId,
    topicId: input.topicId,
    levelId: input.levelId,
    documentTypeId: input.documentTypeId,
    priceType: input.priceType,
    visibility: input.visibility,
    status: input.status,
    tags: input.tags?.join(","),
  };
  for (const [key, value] of Object.entries(optional)) {
    if (value) form.set(key, value);
  }
  form.set("canDownload", String(Boolean(input.canDownload)));
  return apiRequest<{ resource: HocLieuResourceCard; asset: unknown }>("/api/hoclieu/admin/resources/upload", {
    method: "POST",
    body: form,
  });
}
