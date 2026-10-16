import { USE_LEARNING_RESOURCE_AUTHORING_MOCK, mockLearningResourceAuthoringTaxonomy } from "@/features/lcms/admin-operations/api/mock-learning-resource-authoring-data";
import type {
  LearningResourceResource,
  LearningResourceResourceSection,
  LearningResourceViewerUnit,
} from "@/features/lms/learning-resources/api/learning-resource-domain-types";
import { LEARNING_RESOURCE_LIBRARY_SECTIONS } from "@/features/lms/learning-resources/api/learning-resource-mock-data";
import type {
  LearningResourceLibraryBootstrapResourceDTO,
  LearningResourceResourceCardDTO,
  LearningResourceResourceItemDTO,
} from "@/features/lms/learning-resources/api/learning-resource-types";
import {
  categoryLabel,
  isApiLaunchUrl,
  normalizeAccessState,
  normalizeFileType,
  normalizeLaunchMode,
  normalizePriceType,
  normalizeViewerSlides,
  normalizeViewerUrl,
  resourceTypeFor,
  slugify,
  themeFor,
  toApiUrl,
} from "@/features/lms/learning-resources/api/learning-resource-normalizers";

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

export function groupCardsBySection(resources: LearningResourceResource[]): LearningResourceResourceSection[] {
  const sectionMap = new Map<string, LearningResourceResourceSection>();

  for (const resource of resources) {
    const section = sectionMap.get(resource.sectionId);

    if (section) {
      section.resources.push(resource);
      continue;
    }

    const sectionTitle = USE_LEARNING_RESOURCE_AUTHORING_MOCK
      ? mockLearningResourceAuthoringTaxonomy.sections.find((item) => item.id === resource.sectionId)?.label
      : LEARNING_RESOURCE_LIBRARY_SECTIONS.find((item) => item.id === resource.sectionId)?.title;
    const sectionSubtitle = USE_LEARNING_RESOURCE_AUTHORING_MOCK
      ? undefined
      : LEARNING_RESOURCE_LIBRARY_SECTIONS.find((item) => item.id === resource.sectionId)?.subtitle;
    sectionMap.set(resource.sectionId, {
      id: resource.sectionId,
      title: sectionTitle ?? categoryLabel(resource.categoryId),
      subtitle: sectionSubtitle,
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

export function mapCardToResource(card: LearningResourceResourceCardDTO, sortOrder = 0): LearningResourceResource {
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

export function itemsToUnits(items: LearningResourceResourceItemDTO[]): LearningResourceViewerUnit[] {
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
