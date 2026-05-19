import {
  HOCLIEU_CATEGORIES,
  HOCLIEU_LIBRARY_SECTIONS,
  type HocLieuAccessState,
  type HocLieuFileType,
  type HocLieuLaunchMode,
  type HocLieuPriceType,
  type HocLieuResource,
  type HocLieuResourceSection,
  type HocLieuViewerUnit,
} from "@/features/hoclieu/api/library-data";
import { apiRequest, hasApiBase } from "@/lib/api-client";
import { getApiBase } from "@/lib/platform";

type HocLieuResourceCardDTO = {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  thumbnailUrl?: string;
  programSlug?: string;
  subjectId: string;
  gradeId?: string;
  categoryId: string;
  sectionId?: string;
  bookSeriesId?: string;
  topicId?: string;
  selectedFileType: HocLieuFileType | string;
  fileTypeBadge?: string;
  launchMode: HocLieuLaunchMode | string;
  priceType?: HocLieuPriceType | string;
  accessState?: HocLieuAccessState | string;
  canDownload?: boolean;
  updatedAt?: string;
};

type HocLieuAssetDTO = {
  id: string;
  resourceId: string;
  title: string;
  selectedFileType: HocLieuFileType | string;
  fileTypeBadge?: string;
  launchMode: HocLieuLaunchMode | string;
  canDownload?: boolean;
};

type HocLieuResourceDetailDTO = HocLieuResourceCardDTO & {
  description?: string;
  assets?: HocLieuAssetDTO[];
  items?: HocLieuResourceItemDTO[];
};

type HocLieuResourceItemDTO = {
  id: string;
  assetId: string;
  unitTitle: string;
  lessonTitle?: string;
  sortOrder?: number;
  pageCount?: number;
  durationSec?: number;
};

type HocLieuLaunchDTO = {
  assetId: string;
  resourceId: string;
  selectedFileType: HocLieuFileType | string;
  launchMode: HocLieuLaunchMode | string;
  title: string;
  embedUrl?: string;
  viewerTokenUrl?: string;
  streamUrl?: string;
  canDownload?: boolean;
};

type PaginatedResponseDTO<T> = {
  data: T[];
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
};

export async function loadHocLieuLibrarySections(): Promise<HocLieuResourceSection[]> {
  if (!hasApiBase()) return HOCLIEU_LIBRARY_SECTIONS;

  const result = await apiRequest<HocLieuResourceCardDTO[] | PaginatedResponseDTO<HocLieuResourceCardDTO>>(
    "/api/hoclieu/resources?limit=100",
  );
  const cards = Array.isArray(result) ? result : result.data;
  return groupCardsBySection(cards.map(mapCardToResource));
}

export async function loadHocLieuResourcesBySubject(subjectId: string): Promise<HocLieuResource[]> {
  if (!hasApiBase()) {
    return HOCLIEU_LIBRARY_SECTIONS.flatMap((section) => section.resources).filter((resource) => resource.subjectId === subjectId);
  }

  const result = await apiRequest<HocLieuResourceCardDTO[] | PaginatedResponseDTO<HocLieuResourceCardDTO>>(
    `/api/hoclieu/resources?subjectId=${encodeURIComponent(subjectId)}&limit=100`,
  );
  const cards = Array.isArray(result) ? result : result.data;
  return cards.map((card, index) => mapCardToResource(card, index));
}

export async function loadHocLieuResourceForViewer(resource: HocLieuResource): Promise<HocLieuResource> {
  if (!hasApiBase()) return resource;

  const detail = await apiRequest<HocLieuResourceDetailDTO>(`/api/hoclieu/resources/${encodeURIComponent(resource.id)}`);
  const mapped = mapDetailToResource(detail, resource);
  const asset = detail.assets?.[0];

  if (!asset?.id) return mapped;

  const launch = await apiRequest<HocLieuLaunchDTO>(`/api/hoclieu/assets/${encodeURIComponent(asset.id)}/launch`);
  return mergeLaunchIntoResource(mapped, launch);
}

function groupCardsBySection(resources: HocLieuResource[]): HocLieuResourceSection[] {
  const sectionMap = new Map<string, HocLieuResourceSection>();

  for (const resource of resources) {
    const section = sectionMap.get(resource.sectionId);

    if (section) {
      section.resources.push(resource);
      continue;
    }

    const mockSection = HOCLIEU_LIBRARY_SECTIONS.find((item) => item.id === resource.sectionId);
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

function mapDetailToResource(detail: HocLieuResourceDetailDTO, fallback: HocLieuResource): HocLieuResource {
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

function mapCardToResource(card: HocLieuResourceCardDTO, sortOrder = 0): HocLieuResource {
  const fileType = normalizeFileType(card.selectedFileType);
  const launchMode = normalizeLaunchMode(card.launchMode, fileType);
  const sectionId = card.sectionId || card.categoryId || card.programSlug || "hoc-lieu";
  const shellCategoryId = categoryForHocLieuShell(card);

  return {
    id: card.id,
    slug: card.slug,
    title: card.title,
    subtitle: card.subtitle,
    gradeId: card.gradeId,
    subjectId: card.subjectId,
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
      description: card.subtitle || categoryLabel(card.categoryId),
    },
  };
}

function categoryForHocLieuShell(card: HocLieuResourceCardDTO) {
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
  return card.categoryId || "hoc-lieu-giao-duc-khac";
}

function mergeLaunchIntoResource(resource: HocLieuResource, launch: HocLieuLaunchDTO): HocLieuResource {
  const fileType = normalizeFileType(launch.selectedFileType);
  const launchMode = normalizeLaunchMode(launch.launchMode, fileType);
  const streamUrl = toApiUrl(launch.streamUrl);
  const embedUrl = toApiUrl(launch.embedUrl);
  const viewerTokenUrl = toApiUrl(launch.viewerTokenUrl);

  return {
    ...resource,
    fileType,
    formatBadge: fileType,
    launchMode,
    isDownloadable: Boolean(launch.canDownload),
    viewer: {
      ...resource.viewer,
      title: launch.title || resource.viewer.title,
      embedUrl,
      secureEmbedUrl: streamUrl || viewerTokenUrl || resource.viewer.secureEmbedUrl,
    },
  };
}

function itemsToUnits(items: HocLieuResourceItemDTO[]): HocLieuViewerUnit[] {
  const sorted = [...items].sort((left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0));
  const units = new Map<string, HocLieuViewerUnit>();

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
  return HOCLIEU_CATEGORIES.find((category) => category.id === categoryId)?.label ?? "Học liệu";
}

function normalizeFileType(fileType: string): HocLieuFileType {
  const normalized = fileType.toUpperCase();
  if (["PDF", "PPTX", "VIDEO", "AUDIO", "HTML5", "LINK", "QUIZ", "ZIP", "DOCX", "XLSX", "IMAGE"].includes(normalized)) {
    return normalized as HocLieuFileType;
  }
  return "PDF";
}

function normalizeLaunchMode(mode: string, fileType: HocLieuFileType): HocLieuLaunchMode {
  if (
    [
      "pdf_reader",
      "ebook_reader",
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
    return mode as HocLieuLaunchMode;
  }

  if (fileType === "PPTX") return "google_slide_embed";
  if (fileType === "PDF") return "pdf_reader";
  if (fileType === "VIDEO") return "video_player";
  if (fileType === "AUDIO") return "audio_player";
  if (fileType === "QUIZ") return "quiz_runtime";
  return "download_only";
}

function normalizePriceType(value?: string): HocLieuPriceType {
  return value === "paid" || value === "licensed" ? value : "free";
}

function normalizeAccessState(value?: string): HocLieuAccessState {
  if (value === "login_required" || value === "license_required" || value === "unavailable") return value;
  return "open";
}

function resourceTypeFor(fileType: HocLieuFileType, launchMode: HocLieuLaunchMode): HocLieuResource["resourceType"] {
  if (launchMode === "quiz_runtime" || fileType === "QUIZ") return "quiz";
  if (launchMode === "video_player" || fileType === "VIDEO") return "video";
  if (launchMode === "audio_player" || fileType === "AUDIO") return "audio";
  if (fileType === "PPTX") return "slide";
  if (fileType === "PDF") return "pdf";
  if (fileType === "LINK") return "external_link";
  if (fileType === "HTML5") return "interactive";
  return "download_package";
}

function themeFor(fileType: HocLieuFileType): HocLieuResource["thumbnailTheme"] {
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

function slugify(value: string) {
  return value
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}
