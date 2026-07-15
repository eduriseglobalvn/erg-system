import { listLearningResourceResources } from "@/features/lcms/admin-operations/api/learning-resource-authoring-api";
import {
  USE_LEARNING_RESOURCE_AUTHORING_MOCK,
  mockLearningResourceAuthoringResources,
  mockLearningResourceAuthoringTaxonomy,
} from "@/features/lcms/admin-operations/api/mock-learning-resource-authoring-data";
import {
  LEARNING_RESOURCE_CATEGORIES,
  LEARNING_RESOURCE_LIBRARY_SECTIONS,
  type LearningResourceAccessState,
  type LearningResourceCategory,
  type LearningResourceFileType,
  type LearningResourceLaunchMode,
  type LearningResourcePriceType,
  type LearningResourceResource,
  type LearningResourceResourceSection,
  type LearningResourceSubject,
  type LearningResourceViewerSlide,
  type LearningResourceViewerUnit,
} from "@/features/lms/learning-resources/api/learning-resource-data";
import {
  loadLmsLearningResourceLibrary,
  type LmsLearningResourceCard,
  type LmsLearningResourceLibrary,
  type LmsLearningResourceLibraryInput,
  type LmsLearningResourceProgress,
  type LmsLearningResourceTaxonomyNode,
} from "@/features/lms/api/lms-graphql-api";
import { hasApiBase } from "@/lib/api-client";
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

type LearningResourceResourceItemDTO = {
  id: string;
  assetId: string;
  unitTitle: string;
  lessonTitle?: string;
  sortOrder?: number;
  pageCount?: number;
  durationSec?: number;
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

type GraphQlLearningResourceLibrarySnapshot = {
  tenantId?: string | null;
  educationUnitId?: string | null;
  taxonomyTree: LmsLearningResourceTaxonomyNode[];
  resources: LmsLearningResourceLibrary["resources"] & { items: LmsLearningResourceCard[] };
  progress: LmsLearningResourceProgress[];
  recentOpened: LmsLearningResourceLibrary["recentOpened"];
};

type LearningResourceExplorerOperationBase = {
  actorId?: string;
  schoolId?: string;
  academicYear?: string;
  subjectId?: string;
  categoryId?: string;
  sectionId?: string;
  clientRequestId?: string;
};

const GRAPHQL_LIBRARY_PAGE_SIZE = 50;
const GRAPHQL_LIBRARY_MAX_PAGES = 10;

async function loadGraphQlLearningResourceLibrary(
  input: LmsLearningResourceLibraryInput = {},
): Promise<GraphQlLearningResourceLibrarySnapshot | null> {
  if (!hasApiBase()) return null;

  const pageSize = Math.min(Math.max(input.size ?? GRAPHQL_LIBRARY_PAGE_SIZE, 1), GRAPHQL_LIBRARY_PAGE_SIZE);
  const baseInput: LmsLearningResourceLibraryInput = {
    ...input,
    size: pageSize,
    page: input.page ?? 0,
  };

  try {
    const pages: LmsLearningResourceLibrary[] = [];
    let currentPage = baseInput.page ?? 0;
    let hasNext = true;

    for (let pageIndex = 0; hasNext && pageIndex < GRAPHQL_LIBRARY_MAX_PAGES; pageIndex += 1) {
      const response = await loadLmsLearningResourceLibrary({
        ...baseInput,
        page: currentPage,
        size: pageSize,
      });

      pages.push(response);
      hasNext = Boolean(response.resources.hasNext);
      currentPage += 1;

      if (!hasNext) {
        const resources = pages.flatMap((page) => page.resources.items ?? []);
        const latest = pages[pages.length - 1] ?? response;

        return {
          tenantId: latest.tenantId,
          educationUnitId: latest.educationUnitId,
          taxonomyTree: latest.taxonomyTree ?? [],
          resources: {
            ...latest.resources,
            items: resources,
            page: baseInput.page ?? 0,
            size: resources.length || latest.resources.size,
            totalItems: latest.resources.totalItems ?? resources.length,
            totalPages: latest.resources.totalPages ?? pages.length,
            hasNext: false,
            hasPrevious: Boolean(baseInput.page && baseInput.page > 0),
          },
          progress: latest.progress ?? [],
          recentOpened: latest.recentOpened ?? [],
        };
      }
    }

    const latest = pages[pages.length - 1];
    if (!latest) return null;
    const resources = pages.flatMap((page) => page.resources.items ?? []);

    return {
      tenantId: latest.tenantId,
      educationUnitId: latest.educationUnitId,
      taxonomyTree: latest.taxonomyTree ?? [],
      resources: {
        ...latest.resources,
        items: resources,
        page: baseInput.page ?? 0,
        size: resources.length || latest.resources.size,
        totalItems: latest.resources.totalItems ?? resources.length,
        totalPages: latest.resources.totalPages ?? pages.length,
        hasNext: latest.resources.hasNext,
        hasPrevious: Boolean(baseInput.page && baseInput.page > 0),
      },
      progress: latest.progress ?? [],
      recentOpened: latest.recentOpened ?? [],
    };
  } catch {
    return null;
  }
}

function mapGraphQlLearningResourceToBootstrapResource(resource: LmsLearningResourceCard) {
  const title = resource.title || resource.slug || resource.id;
  const fileType = inferGraphQlFileType({
    slug: resource.slug,
    subtitle: resource.subtitle,
    title,
  });
  const type = inferGraphQlResourceType(fileType, title);

  return {
    id: resource.id,
    title,
    type,
    fileType,
    thumbnailUrl: resource.thumbnailUrl ?? undefined,
  } satisfies LearningResourceLibraryBootstrapResourceDTO;
}

function mapGraphQlLearningResourceToResource(
  resource: LmsLearningResourceCard,
  context: {
    subjectId: string;
    groupId: string;
    lessonId: string;
    sortOrder: number;
  },
): LearningResourceResource {
  return mapLibraryResourceToLearningResourceResource(mapGraphQlLearningResourceToBootstrapResource(resource), context);
}

function inferGraphQlFileType(resource: Pick<LmsLearningResourceCard, "slug" | "subtitle" | "title">): LearningResourceFileType {
  const haystack = [resource.title, resource.subtitle, resource.slug].filter(Boolean).join(" ").toLowerCase();

  if (/(quiz|test|đề|de thi|trac nghiem|trắc nghiệm)/i.test(haystack)) return "QUIZ";
  if (/(video|clip|movie)/i.test(haystack)) return "VIDEO";
  if (/(audio|mp3|sound)/i.test(haystack)) return "AUDIO";
  if (/(ppt|slide|bai giang|bài giảng|presentation)/i.test(haystack)) return "PPTX";
  if (/(image|anh|ảnh|poster|infographic)/i.test(haystack)) return "IMAGE";
  if (/(zip|package|thuc hanh|thực hành)/i.test(haystack)) return "ZIP";
  if (/(link|external|url)/i.test(haystack)) return "LINK";
  if (/(html5|interactive)/i.test(haystack)) return "HTML5";
  if (/(docx|word|tai lieu|tài liệu)/i.test(haystack)) return "DOCX";
  if (/(xlsx|excel|spreadsheet)/i.test(haystack)) return "XLSX";
  return "PDF";
}

function inferGraphQlResourceType(fileType: LearningResourceFileType, title: string): "lecture" | "exercise" {
  if (fileType === "QUIZ") return "exercise";
  if (/(quiz|test|đề|de thi|trac nghiem|trắc nghiệm|bài tập|bai tap)/i.test(title)) return "exercise";
  return "lecture";
}

function buildGraphQlResourceLabelMap(library: GraphQlLearningResourceLibrarySnapshot) {
  const labels = new Map<string, string>();
  const subjectLabels = new Map<string, string>();
  const categoryLabels = new Map<string, string>();
  const sectionLabels = new Map<string, string>();

  for (const node of library.taxonomyTree ?? []) {
    if (node.id && node.label) {
      labels.set(node.id, node.label);
    }
    if (node.subjectId && node.label && !subjectLabels.has(node.subjectId)) {
      subjectLabels.set(node.subjectId, node.label);
    }
    if (node.categoryId && node.label && !categoryLabels.has(node.categoryId)) {
      categoryLabels.set(node.categoryId, node.label);
    }
    if ((node.kind === "section" || node.kind === "topic") && node.id && node.label && !sectionLabels.has(node.id)) {
      sectionLabels.set(node.id, node.label);
    }
  }

  return { labels, subjectLabels, categoryLabels, sectionLabels };
}

function fallbackLabelFor(value?: string | null, prefix = "Hoc lieu") {
  if (!value) return prefix;
  return value
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function mapGraphQlLibraryToBootstrap(
  library: GraphQlLearningResourceLibrarySnapshot,
  input: { schoolId: string; academicYear: string },
): LearningResourceLibraryBootstrapDTO {
  const labels = buildGraphQlResourceLabelMap(library);
  const subjects = new Map<string, LearningResourceLibraryBootstrapSubjectDTO>();
  const sortedResources = [...(library.resources.items ?? [])].sort((left, right) => {
    const leftKey = [left.subjectId ?? "", left.categoryId ?? "", left.sectionId ?? "", left.topicId ?? "", left.title ?? ""].join("::");
    const rightKey = [right.subjectId ?? "", right.categoryId ?? "", right.sectionId ?? "", right.topicId ?? "", right.title ?? ""].join("::");
    return leftKey.localeCompare(rightKey, "vi");
  });

  sortedResources.forEach((resource) => {
    const subjectId = resource.subjectId || library.educationUnitId || "hoc-lieu";
    const groupId = resource.categoryId || subjectId;
    const lessonId = resource.sectionId || resource.topicId || groupId;
    const subject = subjects.get(subjectId) ?? {
      id: subjectId,
      label: labels.subjectLabels.get(subjectId) ?? labels.labels.get(subjectId) ?? fallbackLabelFor(subjectId, "Hoc lieu"),
      groups: [],
    };

    const group = subject.groups.find((item) => item.id === groupId) ?? {
      id: groupId,
      label: labels.categoryLabels.get(groupId) ?? labels.labels.get(groupId) ?? fallbackLabelFor(groupId, "Nhom hoc lieu"),
      lessons: [],
    };

    const lesson = group.lessons.find((item) => item.id === lessonId) ?? {
      id: lessonId,
      label: labels.sectionLabels.get(lessonId) ?? labels.labels.get(lessonId) ?? fallbackLabelFor(lessonId, "Bai hoc"),
      resources: [],
    };

    lesson.resources.push(
      mapGraphQlLearningResourceToBootstrapResource(resource),
    );

    if (!group.lessons.some((item) => item.id === lesson.id)) {
      group.lessons.push(lesson);
    }
    if (!subject.groups.some((item) => item.id === group.id)) {
      subject.groups.push(group);
    }
    subjects.set(subjectId, subject);
  });

  return {
    schoolId: input.schoolId,
    academicYear: input.academicYear,
    subjects: [...subjects.values()].map((subject) => ({
      ...subject,
      groups: subject.groups.map((group) => ({
        ...group,
        lessons: group.lessons.map((lesson) => ({
          ...lesson,
          resources: [...lesson.resources],
        })),
      })),
    })),
  };
}

function mapGraphQlLibraryToProgress(
  library: GraphQlLearningResourceLibrarySnapshot,
  input: { schoolId: string; academicYear: string },
): LearningResourceLibraryProgressDTO {
  const progressByLesson = new Map<string, number[]>();
  const resourceById = new Map((library.resources.items ?? []).map((resource) => [resource.id, resource]));

  for (const entry of library.progress ?? []) {
    const resource = resourceById.get(entry.resourceId);
    const lessonId = resource?.sectionId || resource?.topicId || resource?.categoryId || resource?.subjectId || entry.resourceId;
    const values = progressByLesson.get(lessonId) ?? [];
    values.push(Number(entry.progressRate ?? 0));
    progressByLesson.set(lessonId, values);
  }

  return {
    schoolId: input.schoolId,
    academicYear: input.academicYear,
    lessons: [...progressByLesson.entries()].map(([lessonId, values]) => ({
      lessonId,
      progressRate: average(values),
    })),
  };
}

function mapGraphQlLibraryToSections(library: GraphQlLearningResourceLibrarySnapshot): LearningResourceResourceSection[] {
  const labels = buildGraphQlResourceLabelMap(library);
  const sectionMap = new Map<string, LearningResourceResourceSection>();

  [...(library.resources.items ?? [])].forEach((resource, index) => {
    const subjectId = resource.subjectId || library.educationUnitId || "hoc-lieu";
    const categoryId = resource.categoryId || subjectId;
    const sectionId = resource.sectionId || resource.topicId || categoryId;
    const mappedResource = mapGraphQlLearningResourceToResource(resource, {
      subjectId,
      groupId: categoryId,
      lessonId: sectionId,
      sortOrder: index + 1,
    });
    const current = sectionMap.get(sectionId);
    const title =
      labels.sectionLabels.get(sectionId) ??
      labels.labels.get(sectionId) ??
      mappedResource.viewer.title ??
      fallbackLabelFor(sectionId, "Tai lieu");

    if (current) {
      current.resources.push(mappedResource);
      return;
    }

    sectionMap.set(sectionId, {
      id: sectionId,
      title,
      subtitle: mappedResource.subtitle || labels.categoryLabels.get(categoryId) || labels.labels.get(categoryId),
      gradeId: mappedResource.gradeId,
      subjectId,
      categoryId,
      resources: [mappedResource],
    });
  });

  return [...sectionMap.values()].map((section) => ({
    ...section,
    resources: section.resources.sort((left, right) => left.sortOrder - right.sortOrder),
  }));
}

function average(values: number[]) {
  const filtered = values.filter((value) => Number.isFinite(value));
  if (!filtered.length) return 0;
  return Math.round(filtered.reduce((sum, value) => sum + value, 0) / filtered.length);
}

export type CreateLearningResourceFolderOperation = LearningResourceExplorerOperationBase & {
  type: "create_folder";
  name: string;
  parentId?: string;
};

export type CreateLearningResourceLectureOperation = LearningResourceExplorerOperationBase & {
  type: "create_lecture";
  title: string;
  parentId?: string;
  fileType?: LearningResourceFileType | string;
  launchUrl?: string;
  assetId?: string;
  resourceId?: string;
};

export type CreateLearningResourceExerciseOperation = LearningResourceExplorerOperationBase & {
  type: "create_exercise";
  title: string;
  parentId?: string;
  fileType?: LearningResourceFileType | string;
  launchUrl?: string;
  assetId?: string;
  resourceId?: string;
};

export type MoveLearningResourceExplorerItemOperation = LearningResourceExplorerOperationBase & {
  type: "move";
  targetId: string;
  destinationParentId: string;
  previousParentId?: string;
};

export type CopyLearningResourceExplorerItemOperation = LearningResourceExplorerOperationBase & {
  type: "copy";
  targetId: string;
  destinationParentId: string;
};

export type RenameLearningResourceExplorerItemOperation = LearningResourceExplorerOperationBase & {
  type: "rename";
  targetId: string;
  name: string;
};

export type DeleteLearningResourceExplorerItemOperation = LearningResourceExplorerOperationBase & {
  type: "delete";
  targetId: string;
};

export type LearningResourceExplorerOperation =
  | CreateLearningResourceFolderOperation
  | CreateLearningResourceLectureOperation
  | CreateLearningResourceExerciseOperation
  | MoveLearningResourceExplorerItemOperation
  | CopyLearningResourceExplorerItemOperation
  | RenameLearningResourceExplorerItemOperation
  | DeleteLearningResourceExplorerItemOperation;

export type LearningResourceExplorerOperationItem = {
  id: string;
  type: "folder" | "lecture" | "exercise" | "resource";
  name: string;
  parentId?: string;
};

export type LearningResourceExplorerOperationResult = {
  operationId: string;
  status: "saved" | "mock_saved";
  operation: LearningResourceExplorerOperation;
  item?: LearningResourceExplorerOperationItem;
  affectedIds?: string[];
  savedAt?: string;
};

export async function loadLearningResourceLibraryBootstrap(input: { schoolId: string; academicYear: string }) {
  const graphQlLibrary = await loadGraphQlLearningResourceLibrary({
    educationUnitId: input.schoolId,
    academicYear: input.academicYear,
  });

  if (graphQlLibrary?.resources.items.length || graphQlLibrary?.taxonomyTree.length) {
    return mapGraphQlLibraryToBootstrap(graphQlLibrary, input);
  }

  if (!hasApiBase()) {
    return mockLibraryBootstrap(input);
  }

  return { schoolId: input.schoolId, academicYear: input.academicYear, subjects: [] };
}

export async function loadLearningResourceLibraryProgress(input: { schoolId: string; academicYear: string }) {
  const graphQlLibrary = await loadGraphQlLearningResourceLibrary({
    educationUnitId: input.schoolId,
    academicYear: input.academicYear,
  });

  if (graphQlLibrary?.progress.length) {
    return mapGraphQlLibraryToProgress(graphQlLibrary, input);
  }

  if (!hasApiBase()) {
    return { schoolId: input.schoolId, academicYear: input.academicYear, lessons: [] } satisfies LearningResourceLibraryProgressDTO;
  }

  return { schoolId: input.schoolId, academicYear: input.academicYear, lessons: [] } satisfies LearningResourceLibraryProgressDTO;
}

export async function saveExplorerOperation(operation: LearningResourceExplorerOperation): Promise<LearningResourceExplorerOperationResult> {
  return mockSaveExplorerOperation(operation);
}

export function saveCreateFolderOperation(input: Omit<CreateLearningResourceFolderOperation, "type">) {
  return saveExplorerOperation({ type: "create_folder", ...input });
}

export function saveCreateLectureOperation(input: Omit<CreateLearningResourceLectureOperation, "type">) {
  return saveExplorerOperation({ type: "create_lecture", ...input });
}

export function saveCreateExerciseOperation(input: Omit<CreateLearningResourceExerciseOperation, "type">) {
  return saveExplorerOperation({ type: "create_exercise", ...input });
}

export function saveMoveExplorerItemOperation(input: Omit<MoveLearningResourceExplorerItemOperation, "type">) {
  return saveExplorerOperation({ type: "move", ...input });
}

export function saveCopyExplorerItemOperation(input: Omit<CopyLearningResourceExplorerItemOperation, "type">) {
  return saveExplorerOperation({ type: "copy", ...input });
}

export function saveRenameExplorerItemOperation(input: Omit<RenameLearningResourceExplorerItemOperation, "type">) {
  return saveExplorerOperation({ type: "rename", ...input });
}

export function saveDeleteExplorerItemOperation(input: Omit<DeleteLearningResourceExplorerItemOperation, "type">) {
  return saveExplorerOperation({ type: "delete", ...input });
}

export async function loadLearningResourceLibrarySections(): Promise<LearningResourceResourceSection[]> {
  if (USE_LEARNING_RESOURCE_AUTHORING_MOCK) return getMockLearningResourceLibrarySections();

  const graphQlLibrary = await loadGraphQlLearningResourceLibrary();
  if (graphQlLibrary?.resources.items.length) {
    return mapGraphQlLibraryToSections(graphQlLibrary);
  }

  if (!hasApiBase()) return LEARNING_RESOURCE_LIBRARY_SECTIONS;

  try {
    const result = await listLearningResourceResources({ limit: 100 });
    const cards = result.data;
    return groupCardsBySection(cards.map(mapCardToResource));
  } catch (error) {
    if (hasApiBase()) throw error;
    return LEARNING_RESOURCE_LIBRARY_SECTIONS;
  }
}

export async function loadLearningResourceResourcesBySubject(subjectId: string): Promise<LearningResourceResource[]> {
  if (USE_LEARNING_RESOURCE_AUTHORING_MOCK) {
    return getMockLearningResourceLibrarySections()
      .flatMap((section) => section.resources)
      .filter((resource) => resource.subjectId === subjectId);
  }

  const graphQlLibrary = await loadGraphQlLearningResourceLibrary({ subjectId });
  if (graphQlLibrary?.resources.items.length) {
    return graphQlLibrary.resources.items
      .filter((resource) => !subjectId || resource.subjectId === subjectId)
      .map((resource, index) =>
        mapGraphQlLearningResourceToResource(resource, {
          subjectId: resource.subjectId || subjectId,
          groupId: resource.categoryId || resource.subjectId || subjectId,
          lessonId: resource.sectionId || resource.topicId || resource.categoryId || resource.subjectId || subjectId,
          sortOrder: index + 1,
        }),
      );
  }

  if (!hasApiBase()) {
    return LEARNING_RESOURCE_LIBRARY_SECTIONS.flatMap((section) => section.resources).filter((resource) => resource.subjectId === subjectId);
  }

  try {
    const result = await listLearningResourceResources({ subjectId, limit: 100 });
    const cards = result.data;
    return cards.map((card, index) => mapCardToResource(card, index));
  } catch (error) {
    if (hasApiBase()) throw error;
    return LEARNING_RESOURCE_LIBRARY_SECTIONS.flatMap((section) => section.resources).filter((resource) => resource.subjectId === subjectId);
  }
}

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

export function getMockLearningResourceLibrarySubjects(): LearningResourceSubject[] {
  return mockLearningResourceAuthoringTaxonomy.subjects.map((subject) => ({
    id: subject.id,
    label: subject.label,
  }));
}

export function getMockLearningResourceLibraryCategories(): LearningResourceCategory[] {
  const subjectRoots: LearningResourceCategory[] = mockLearningResourceAuthoringTaxonomy.subjects.map((subject) => ({
    id: subject.id,
    label: subject.label,
    icon: subject.id === "mock-stem" ? "stem" : "certificate",
  }));
  const categoryFolders: LearningResourceCategory[] = mockLearningResourceAuthoringTaxonomy.categories.map((category) => ({
    id: category.id,
    label: category.label,
    parentId: category.subjectId,
    icon: category.subjectId === "mock-stem" ? "stem" : "certificate",
  }));
  const sectionFolders: LearningResourceCategory[] = mockLearningResourceAuthoringTaxonomy.sections.map((section) => ({
    id: section.id,
    label: section.label,
    parentId: section.categoryId,
    icon: "document",
  }));

  return [...subjectRoots, ...categoryFolders, ...sectionFolders];
}

export function getDefaultMockLearningResourceLibrarySelection(gradeId: string) {
  const subjectId = mockLearningResourceAuthoringTaxonomy.subjects[0]?.id ?? "mock-ic3-gs6";

  return {
    gradeId,
    subjectId,
    categoryId: subjectId,
  };
}

function getMockLearningResourceLibrarySections(): LearningResourceResourceSection[] {
  return groupCardsBySection(mockLearningResourceAuthoringResources.map((resource, index) => mapCardToResource(resource, index)));
}

function groupCardsBySection(resources: LearningResourceResource[]): LearningResourceResourceSection[] {
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

async function mockSaveExplorerOperation(operation: LearningResourceExplorerOperation): Promise<LearningResourceExplorerOperationResult> {
  await Promise.resolve();

  return {
    operationId: `mock-explorer-op-${operation.type}-${mockOperationSuffix(operation)}`,
    status: "mock_saved",
    operation,
    item: mockOperationItem(operation),
    affectedIds: "targetId" in operation ? [operation.targetId] : undefined,
    savedAt: new Date(0).toISOString(),
  };
}

function mockOperationItem(operation: LearningResourceExplorerOperation): LearningResourceExplorerOperationItem | undefined {
  if (operation.type === "create_folder") {
    return {
      id: `folder-${slugify(operation.name)}`,
      type: "folder",
      name: operation.name,
      parentId: operation.parentId,
    };
  }

  if (operation.type === "create_lecture" || operation.type === "create_exercise") {
    return {
      id: `${operation.type === "create_lecture" ? "lecture" : "exercise"}-${slugify(operation.title)}`,
      type: operation.type === "create_lecture" ? "lecture" : "exercise",
      name: operation.title,
      parentId: operation.parentId,
    };
  }

  if (operation.type === "rename") {
    return {
      id: operation.targetId,
      type: "resource",
      name: operation.name,
    };
  }

  return undefined;
}

function mockOperationSuffix(operation: LearningResourceExplorerOperation) {
  if ("clientRequestId" in operation && operation.clientRequestId) return slugify(operation.clientRequestId);
  if ("name" in operation) return slugify(operation.name);
  if ("title" in operation) return slugify(operation.title);
  if ("targetId" in operation) return slugify(operation.targetId);
  return "operation";
}

