import { listLearningResourceResources } from "@/features/admin-operations/api/learning-resource-authoring-api";
import {
  LEARNING_RESOURCE_CATEGORIES,
  LEARNING_RESOURCE_LIBRARY_SECTIONS,
  type LearningResourceAccessState,
  type LearningResourceFileType,
  type LearningResourceLaunchMode,
  type LearningResourcePriceType,
  type LearningResourceResource,
  type LearningResourceResourceSection,
  type LearningResourceViewerSlide,
  type LearningResourceViewerUnit,
} from "@/features/lms/learning-resources/api/learning-resource-data";
import { apiRequest, hasApiBase } from "@/lib/api-client";
import { getApiBase } from "@/lib/platform";

type LearningResourceResourceCardDTO = {
  id: string;
  slug?: string;
  title: string;
  subtitle?: string;
  thumbnailUrl?: string;
  programSlug?: string;
  subjectId?: string;
  gradeId?: string;
  categoryId?: string;
  groupId?: string;
  sectionId?: string;
  lessonId?: string;
  bookSeriesId?: string;
  topicId?: string;
  selectedFileType?: LearningResourceFileType | string;
  fileType?: LearningResourceFileType | string;
  documentTypeId?: string;
  fileTypeBadge?: string;
  launchMode?: LearningResourceLaunchMode | string;
  priceType?: LearningResourcePriceType | string;
  accessState?: LearningResourceAccessState | string;
  canDownload?: boolean;
  updatedAt?: string;
};

type LearningResourceAssetDTO = {
  id: string;
  resourceId: string;
  title?: string;
  selectedFileType?: LearningResourceFileType | string;
  fileType?: LearningResourceFileType | string;
  fileTypeBadge?: string;
  launchMode?: LearningResourceLaunchMode | string;
  canDownload?: boolean;
};

type LearningResourceResourceDetailDTO = LearningResourceResourceCardDTO & {
  description?: string;
  assets?: LearningResourceAssetDTO[];
  items?: LearningResourceResourceItemDTO[];
};

type LearningResourceResourceItemDTO = {
  id: string;
  assetId: string;
  unitTitle: string;
  lessonTitle?: string;
  sortOrder?: number;
  pageCount?: number;
  durationSec?: number;
};

type LearningResourceLaunchDTO = {
  assetId: string;
  resourceId: string;
  selectedFileType?: LearningResourceFileType | string;
  fileType?: LearningResourceFileType | string;
  launchMode?: LearningResourceLaunchMode | string;
  title?: string;
  embedUrl?: string;
  viewerTokenUrl?: string;
  streamUrl?: string;
  url?: string;
  slideCount?: number;
  slides?: LearningResourceLaunchSlideDTO[];
  viewerManifest?: {
    slideCount?: number;
    slides?: LearningResourceLaunchSlideDTO[];
  };
  canDownload?: boolean;
};

type LearningResourceLaunchSlideDTO = {
  id?: string;
  index?: number;
  title?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  url?: string;
};

export type LearningResourceLibraryBootstrapResourceDTO = {
  id: string;
  assetId?: string;
  resourceId?: string;
  title: string;
  type: "lecture" | "exercise" | string;
  fileType: LearningResourceFileType | string;
  thumbnailUrl?: string;
  launchUrl?: string;
  launchMode?: LearningResourceLaunchMode | string;
  slides?: LearningResourceLaunchSlideDTO[];
};

export type LearningResourceLibraryBootstrapLessonDTO = {
  id: string;
  label: string;
  progressRate?: number;
  resources: LearningResourceLibraryBootstrapResourceDTO[];
};

export type LearningResourceLibraryBootstrapGroupDTO = {
  id: string;
  label: string;
  lessons: LearningResourceLibraryBootstrapLessonDTO[];
};

export type LearningResourceLibraryBootstrapSubjectDTO = {
  id: string;
  label: string;
  groups: LearningResourceLibraryBootstrapGroupDTO[];
};

export type LearningResourceLibraryBootstrapDTO = {
  schoolId: string;
  academicYear: string;
  subjects: LearningResourceLibraryBootstrapSubjectDTO[];
};

export type LearningResourceLibraryProgressDTO = {
  schoolId: string;
  academicYear: string;
  lessons: Array<{
    lessonId: string;
    progressRate: number;
  }>;
};

export async function loadLearningResourceLibraryBootstrap(input: { schoolId: string; academicYear: string }) {
  if (!hasApiBase()) {
    return mockLibraryBootstrap(input);
  }

  const search = new URLSearchParams();
  search.set("schoolId", input.schoolId);
  search.set("academicYear", input.academicYear);
  return apiRequest<LearningResourceLibraryBootstrapDTO>(`/api/v1/hoclieu/library/bootstrap?${search.toString()}`);
}

export async function loadLearningResourceLibraryProgress(input: { schoolId: string; academicYear: string }) {
  if (!hasApiBase()) {
    return { schoolId: input.schoolId, academicYear: input.academicYear, lessons: [] } satisfies LearningResourceLibraryProgressDTO;
  }

  const search = new URLSearchParams();
  search.set("schoolId", input.schoolId);
  search.set("academicYear", input.academicYear);
  return apiRequest<LearningResourceLibraryProgressDTO>(`/api/v1/hoclieu/library/progress?${search.toString()}`);
}

export async function loadLearningResourceLibrarySections(): Promise<LearningResourceResourceSection[]> {
  if (!hasApiBase()) return LEARNING_RESOURCE_LIBRARY_SECTIONS;

  const result = await listLearningResourceResources({ limit: 100 });
  const cards = result.data;
  return groupCardsBySection(cards.map(mapCardToResource));
}

export async function loadLearningResourceResourcesBySubject(subjectId: string): Promise<LearningResourceResource[]> {
  if (!hasApiBase()) {
    return LEARNING_RESOURCE_LIBRARY_SECTIONS.flatMap((section) => section.resources).filter((resource) => resource.subjectId === subjectId);
  }

  const result = await listLearningResourceResources({ subjectId, limit: 100 });
  const cards = result.data;
  return cards.map((card, index) => mapCardToResource(card, index));
}

export async function loadLearningResourceResourceForViewer(resource: LearningResourceResource): Promise<LearningResourceResource> {
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

    const launch = await apiRequest<LearningResourceLaunchDTO>(toApiRequestPath(resource.viewer.launchUrl));
    return mergeLaunchIntoResource(resource, launch);
  }
  if (resource.viewer.assetId && resource.launchMode === "google_slide_embed" && !resource.viewer.embedUrl) {
    const launch = await apiRequest<LearningResourceLaunchDTO>(`/api/v1/hoclieu/assets/${encodeURIComponent(resource.viewer.assetId)}/launch`);
    return mergeLaunchIntoResource(resource, launch);
  }
  if (resource.viewer.embedUrl || resource.viewer.secureEmbedUrl || (resource.viewer.assetId && resource.viewer.slides?.length)) return resource;

  const detail = await apiRequest<LearningResourceResourceDetailDTO>(`/api/v1/hoclieu/resources/${encodeURIComponent(resource.id)}`);
  const mapped = mapDetailToResource(detail, resource);
  const asset = detail.assets?.[0];

  if (!asset?.id) return mapped;

  const launch = await apiRequest<LearningResourceLaunchDTO>(`/api/v1/hoclieu/assets/${encodeURIComponent(asset.id)}/launch`);
  return mergeLaunchIntoResource(mapped, launch);
}

export function mapLibraryResourceToLearningResourceResource(
  resource: LearningResourceLibraryBootstrapResourceDTO,
  context: {
    subjectId: string;
    groupId: string;
    lessonId: string;
    sortOrder?: number;
  },
): LearningResourceResource {
  const fileType = normalizeFileType(resource.fileType);
  const launchMode = normalizeLaunchMode(resource.launchMode || "", fileType);
  const resourceType = resource.type === "exercise" && fileType !== "QUIZ" ? "interactive" : resourceTypeFor(fileType, launchMode);

  const viewerUrl = toApiUrl(resource.launchUrl);
  const isLaunchEndpoint = isApiLaunchUrl(viewerUrl);
  const slides = normalizeViewerSlides(resource.slides);

  return {
    id: resource.id,
    slug: slugify(resource.title || resource.id),
    title: resource.title,
    subjectId: context.subjectId,
    categoryId: context.groupId,
    sectionId: context.lessonId,
    resourceType,
    fileType,
    formatBadge: fileType,
    launchMode,
    thumbnailUrl: toApiUrl(resource.thumbnailUrl),
    thumbnailLabel: resource.title,
    thumbnailSubLabel: fileType,
    thumbnailTheme: themeFor(fileType),
    priceType: "free",
    accessState: "open",
    isDownloadable: false,
    sortOrder: context.sortOrder ?? 0,
    viewer: {
      assetId: resource.assetId,
      resourceId: resource.resourceId || resource.id,
      title: resource.title,
      description: resource.type === "exercise" ? "Bài tập" : "Bài giảng",
      embedUrl: isLaunchEndpoint ? undefined : normalizeViewerUrl(viewerUrl),
      launchUrl: isLaunchEndpoint ? viewerUrl : undefined,
      pageCount: slides.length || undefined,
      slides,
    },
  };
}

function groupCardsBySection(resources: LearningResourceResource[]): LearningResourceResourceSection[] {
  const sectionMap = new Map<string, LearningResourceResourceSection>();

  for (const resource of resources) {
    const section = sectionMap.get(resource.sectionId);

    if (section) {
      section.resources.push(resource);
      continue;
    }

    const mockSection = LEARNING_RESOURCE_LIBRARY_SECTIONS.find((item) => item.id === resource.sectionId);
    sectionMap.set(resource.sectionId, {
      id: resource.sectionId,
      title: mockSection?.title ?? categoryLabel(resource.categoryId),
      subtitle: mockSection?.subtitle,
      gradeId: resource.gradeId,
      subjectId: resource.subjectId,
      categoryId: resource.categoryId,
      resources: [resource],
    });
  }

  return [...sectionMap.values()].map((section) => ({
    ...section,
    resources: section.resources.sort((left, right) => left.sortOrder - right.sortOrder),
  }));
}

function mapDetailToResource(detail: LearningResourceResourceDetailDTO, fallback: LearningResourceResource): LearningResourceResource {
  const resource = mapCardToResource(detail, fallback.sortOrder);
  const items = detail.items?.length ? itemsToUnits(detail.items) : fallback.viewer.units;

  return {
    ...resource,
    viewer: {
      ...fallback.viewer,
      ...resource.viewer,
      description: detail.description || resource.viewer.description || fallback.viewer.description,
      units: items,
    },
  };
}

function mapCardToResource(card: LearningResourceResourceCardDTO, sortOrder = 0): LearningResourceResource {
  const subjectId = card.subjectId || card.programSlug || "hoc-lieu";
  const categoryId = card.categoryId || card.groupId || subjectId;
  const fileType = normalizeFileType(card.selectedFileType || card.fileType || card.documentTypeId || "PDF");
  const launchMode = normalizeLaunchMode(card.launchMode || "", fileType);
  const sectionId = card.sectionId || card.lessonId || categoryId || card.programSlug || "hoc-lieu";
  const shellCategoryId = categoryForLearningResourceShell(card);

  return {
    id: card.id,
    slug: card.slug || slugify(card.title || card.id),
    title: card.title,
    subtitle: card.subtitle,
    gradeId: card.gradeId,
    subjectId,
    categoryId: shellCategoryId,
    sectionId,
    topicId: card.topicId,
    bookSeriesId: card.bookSeriesId,
    resourceType: resourceTypeFor(fileType, launchMode),
    fileType,
    formatBadge: card.fileTypeBadge || fileType,
    launchMode,
    thumbnailUrl: card.thumbnailUrl,
    thumbnailLabel: card.title,
    thumbnailSubLabel: card.fileTypeBadge || fileType,
    thumbnailTheme: themeFor(fileType),
    priceType: normalizePriceType(card.priceType),
    accessState: normalizeAccessState(card.accessState),
    isDownloadable: Boolean(card.canDownload),
    sortOrder,
    viewer: {
      title: card.title,
      description: card.subtitle || categoryLabel(categoryId),
    },
  };
}

function categoryForLearningResourceShell(card: LearningResourceResourceCardDTO) {
  if (card.subjectId === "giao-duc-stem") return "giao-duc-stem";
  if (card.subjectId === "ic3") return "ic3-digital-literacy";
  if (card.subjectId === "mos") return "mos";
  if (card.subjectId === "tin-hoc") return "tin-hoc-pho-thong";
  if (card.subjectId === "tieng-anh") {
    if (card.categoryId === "lecture-bank" || card.categoryId === "lesson-plan" || card.categoryId === "worksheet") {
      return "hop-phan-bo-tro";
    }
    return "sach-mem-2";
  }
  return card.categoryId || card.groupId || "hoc-lieu-giao-duc-khac";
}

function mergeLaunchIntoResource(resource: LearningResourceResource, launch: LearningResourceLaunchDTO): LearningResourceResource {
  const fileType = normalizeFileType(launch.selectedFileType || launch.fileType || resource.fileType);
  const launchMode = normalizeLaunchMode(launch.launchMode || "", fileType);
  const streamUrl = toApiUrl(launch.streamUrl);
  const embedUrl = normalizeViewerUrl(toApiUrl(launch.embedUrl || launch.url));
  const viewerTokenUrl = toApiUrl(launch.viewerTokenUrl);
  const slides = normalizeViewerSlides(launch.slides || launch.viewerManifest?.slides);

  return {
    ...resource,
    fileType,
    formatBadge: fileType,
    launchMode,
    isDownloadable: Boolean(launch.canDownload),
    viewer: {
      ...resource.viewer,
      assetId: launch.assetId || resource.viewer.assetId,
      resourceId: launch.resourceId || resource.viewer.resourceId,
      title: launch.title || resource.viewer.title,
      embedUrl,
      secureEmbedUrl: streamUrl || viewerTokenUrl || resource.viewer.secureEmbedUrl,
      launchUrl: undefined,
      pageCount: launch.slideCount || launch.viewerManifest?.slideCount || slides.length || resource.viewer.pageCount,
      slides: slides.length ? slides : resource.viewer.slides,
    },
  };
}

function itemsToUnits(items: LearningResourceResourceItemDTO[]): LearningResourceViewerUnit[] {
  const sorted = [...items].sort((left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0));
  const units = new Map<string, LearningResourceViewerUnit>();

  for (const item of sorted) {
    const unitTitle = item.unitTitle || "Bài học";
    const unitId = slugify(unitTitle);
    const unit = units.get(unitId) ?? { id: unitId, title: unitTitle, children: [] };

    if (item.lessonTitle) {
      unit.children = [
        ...(unit.children ?? []),
        {
          id: item.id,
          title: item.lessonTitle,
          duration: item.durationSec ? `${Math.round(item.durationSec / 60)} phút` : undefined,
        },
      ];
    }

    units.set(unitId, unit);
  }

  return [...units.values()];
}

function categoryLabel(categoryId: string) {
  return LEARNING_RESOURCE_CATEGORIES.find((category) => category.id === categoryId)?.label ?? "Học liệu";
}

function normalizeFileType(fileType: string): LearningResourceFileType {
  const normalized = fileType.toUpperCase();
  if (["PDF", "PPTX", "VIDEO", "AUDIO", "HTML5", "LINK", "QUIZ", "ZIP", "DOCX", "XLSX", "IMAGE"].includes(normalized)) {
    return normalized as LearningResourceFileType;
  }
  return "PDF";
}

function normalizeLaunchMode(mode: string, fileType: LearningResourceFileType): LearningResourceLaunchMode {
  if (
    [
      "pdf_reader",
      "ebook_reader",
      "custom_slide_viewer",
      "google_slide_embed",
      "slide_image_proxy",
      "video_player",
      "audio_player",
      "html5_embed",
      "quiz_runtime",
      "download_only",
      "external",
    ].includes(mode)
  ) {
    return mode as LearningResourceLaunchMode;
  }

  if (fileType === "PPTX") return "google_slide_embed";
  if (fileType === "PDF") return "pdf_reader";
  if (fileType === "VIDEO") return "video_player";
  if (fileType === "AUDIO") return "audio_player";
  if (fileType === "QUIZ") return "quiz_runtime";
  return "download_only";
}

function normalizePriceType(value?: string): LearningResourcePriceType {
  return value === "paid" || value === "licensed" ? value : "free";
}

function normalizeAccessState(value?: string): LearningResourceAccessState {
  if (value === "login_required" || value === "license_required" || value === "unavailable") return value;
  return "open";
}

function resourceTypeFor(fileType: LearningResourceFileType, launchMode: LearningResourceLaunchMode): LearningResourceResource["resourceType"] {
  if (launchMode === "custom_slide_viewer" || launchMode === "slide_image_proxy" || launchMode === "google_slide_embed") return "slide";
  if (launchMode === "quiz_runtime" || fileType === "QUIZ") return "quiz";
  if (launchMode === "video_player" || fileType === "VIDEO") return "video";
  if (launchMode === "audio_player" || fileType === "AUDIO") return "audio";
  if (fileType === "PPTX") return "slide";
  if (fileType === "PDF") return "pdf";
  if (fileType === "LINK") return "external_link";
  if (fileType === "HTML5") return "interactive";
  return "download_package";
}

function themeFor(fileType: LearningResourceFileType): LearningResourceResource["thumbnailTheme"] {
  switch (fileType) {
    case "PPTX":
      return "orange";
    case "VIDEO":
      return "rose";
    case "AUDIO":
      return "green";
    case "QUIZ":
      return "purple";
    case "XLSX":
      return "green";
    case "DOCX":
      return "blue";
    case "IMAGE":
      return "teal";
    case "ZIP":
      return "slate";
    default:
      return "blue";
  }
}

function toApiUrl(value?: string) {
  if (!value) return undefined;
  if (/^https?:\/\//i.test(value)) return value;
  const apiBase = getApiBase();
  if (!apiBase || !value.startsWith("/")) return value;
  return `${apiBase}${value}`;
}

function toApiRequestPath(value: string) {
  const apiBase = getApiBase();
  if (apiBase && value.startsWith(apiBase)) return value.slice(apiBase.length) || "/";
  return value;
}

function isApiLaunchUrl(value?: string) {
  if (!value) return false;

  try {
    const url = new URL(value, getApiBase() || window.location.origin);
    const apiBase = getApiBase();
    const isSameApiOrigin = !apiBase || url.origin === new URL(apiBase).origin;
    return isSameApiOrigin && url.pathname.replace(/\/$/, "").endsWith("/launch");
  } catch {
    return value.startsWith("/api/") && value.split("?")[0]?.replace(/\/$/, "").endsWith("/launch");
  }
}

function normalizeViewerUrl(value?: string) {
  if (!value) return undefined;

  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    const path = url.pathname.replace(/\/$/, "");

    if (path.endsWith("/launch")) {
      return undefined;
    }

    if (host.includes("docs.google.com") && path.includes("/presentation/")) {
      const match = path.match(/^(.*\/presentation\/d\/[^/]+)/);
      if (!match) return value;
      return `${url.origin}${match[1]}/embed?start=false&loop=false&delayms=3000`;
    }

    if (host.includes("drive.google.com") && path.includes("/file/d/")) {
      const previewPath = path.replace(/\/(view|edit|preview)$/i, "");
      return `${url.origin}${previewPath}/preview`;
    }
  } catch {
    if (value.split("?")[0]?.replace(/\/$/, "").endsWith("/launch")) {
      return undefined;
    }
    return value;
  }

  return value;
}

function normalizeViewerSlides(slides?: LearningResourceLaunchSlideDTO[]): LearningResourceViewerSlide[] {
  if (!Array.isArray(slides)) return [];

  const normalizedSlides: LearningResourceViewerSlide[] = [];

  slides.forEach((slide, arrayIndex) => {
      const imageUrl = toApiUrl(slide.imageUrl || slide.url);
      if (!imageUrl) return;

      normalizedSlides.push({
        id: slide.id || `slide-${arrayIndex + 1}`,
        index: slide.index ?? arrayIndex + 1,
        title: slide.title,
        imageUrl,
        thumbnailUrl: toApiUrl(slide.thumbnailUrl),
      });
    });

  return normalizedSlides.sort((left, right) => left.index - right.index);
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

function mockLibraryBootstrap(input: { schoolId: string; academicYear: string }): LearningResourceLibraryBootstrapDTO {
  const subjects = LEARNING_RESOURCE_LIBRARY_SECTIONS.map((section) => ({
    id: section.subjectId,
    label: section.title,
    groups: [
      {
        id: section.id,
        label: section.subtitle || section.title,
        lessons: [
          {
            id: section.id,
            label: section.subtitle || section.title,
            progressRate: 0,
            resources: section.resources.map((resource) => ({
              id: resource.id,
              title: resource.title,
              type: resource.resourceType === "quiz" || resource.fileType === "QUIZ" ? "exercise" : "lecture",
              fileType: resource.fileType,
              thumbnailUrl: resource.thumbnailUrl,
              launchUrl: resource.viewer.embedUrl || resource.viewer.secureEmbedUrl,
            })),
          },
        ],
      },
    ],
  }));

  return {
    schoolId: input.schoolId,
    academicYear: input.academicYear,
    subjects,
  };
}
