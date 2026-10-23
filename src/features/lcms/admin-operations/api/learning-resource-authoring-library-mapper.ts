import { launchModeFor, slugify } from "@/features/lcms/admin-operations/api/learning-resource-authoring-utils";
import type {
  LearningResourceResourceCard,
  LearningResourceResourceList,
  LearningResourceTaxonomyOption,
  LearningResourceTaxonomyResponse,
} from "@/features/lcms/admin-operations/api/learning-resource-authoring-domain-types";
import type {
  CurriculumTreeNodeResponse,
  CurriculumTreeResponse,
  LearningResourceLibraryGraphQl,
  LearningResourceLibraryGraphQlCard,
  LearningResourceLibraryGraphQlNode,
  LearningResourceStudioBootstrap,
  StudioResourceResponse,
} from "@/features/lcms/admin-operations/api/learning-resource-authoring-transport-types";

export function mapGraphQlLibraryToStudioBootstrap(library: LearningResourceLibraryGraphQl): LearningResourceStudioBootstrap {
  const taxonomy = mapGraphQlLibraryToTaxonomies(library);
  return {
    subjects: taxonomy.subjects,
    groups: taxonomy.categories,
    categories: taxonomy.categories,
    lessons: taxonomy.sections,
    sections: taxonomy.sections,
    resources: mapGraphQlLibraryToResources(library).data.map(mapCardToStudioResource),
    fileTypes: taxonomy.fileTypes,
    designerPresets: taxonomy.designerPresets,
  };
}

export function mapGraphQlLibraryToCurriculumTree(library: LearningResourceLibraryGraphQl): CurriculumTreeResponse {
  const taxonomy = mapGraphQlLibraryToTaxonomies(library);
  const levelsBySubject = groupBy(taxonomy.categories, (level) => level.subjectId || level.parentId || "");
  const topicsByLevel = groupBy(taxonomy.topics, (topic) => topic.categoryId || topic.parentId || "");
  const subjects = taxonomy.subjects.map((subject) => ({
    ...taxonomyToCurriculumNode(subject, "subject"),
    levels: (levelsBySubject.get(subject.id) ?? []).map((level) => ({
      ...taxonomyToCurriculumNode(level, "level"),
      topics: (topicsByLevel.get(level.id) ?? []).map((topic) => taxonomyToCurriculumNode(topic, "topic")),
    })),
  }));

  return {
    subjects,
    levels: taxonomy.categories.map((level) => taxonomyToCurriculumNode(level, "level")),
    topics: taxonomy.topics.map((topic) => taxonomyToCurriculumNode(topic, "topic")),
    fileTypes: taxonomy.fileTypes,
    designerPresets: taxonomy.designerPresets,
  };
}

export function mapGraphQlLibraryToTaxonomies(library: LearningResourceLibraryGraphQl): LearningResourceTaxonomyResponse {
  const nodes = library.taxonomyTree ?? [];
  const subjects = sortTaxonomies(
    nodes
      .filter((node) => graphQlNodeKind(node) === "subject")
      .map((node) => mapGraphQlTaxonomyNode(node)),
  );
  const subjectIdByLevel = new Map<string, string>();
  const categories = sortTaxonomies(
    nodes
      .filter((node) => graphQlNodeKind(node) === "level")
      .map((node) => {
        const subjectId = node.subjectId || node.parentId || undefined;
        if (subjectId) subjectIdByLevel.set(node.id, subjectId);
        return mapGraphQlTaxonomyNode(node, {
          subjectId,
          categoryId: node.id,
          parentId: subjectId,
        });
      }),
  );
  const sections = sortTaxonomies(
    nodes
      .filter((node) => graphQlNodeKind(node) === "topic")
      .map((node) => {
        const categoryId = node.categoryId || node.parentId || undefined;
        return mapGraphQlTaxonomyNode(node, {
          subjectId: node.subjectId || subjectIdByLevel.get(categoryId || ""),
          categoryId,
          parentId: categoryId,
          topicId: node.id,
        });
      }),
  );

  return {
    grades: [],
    subjects,
    categories,
    sections,
    bookSeries: [],
    topics: sections,
    fileTypes: ["PDF", "PPTX", "VIDEO", "AUDIO", "LINK", "QUIZ"],
    designerPresets: [],
  };
}

export function mapGraphQlLibraryToResources(
  library: LearningResourceLibraryGraphQl,
  scope: Record<string, unknown> = {},
): LearningResourceResourceList {
  const resources = library.resources;
  const data = (resources?.items ?? []).map((card) => mapGraphQlResourceCard(card, scope));
  return {
    data,
    total: resources?.totalItems ?? data.length,
    page: (resources?.page ?? 0) + 1,
    limit: resources?.size ?? data.length,
  };
}

export function mapGraphQlTaxonomyNode(
  node: LearningResourceLibraryGraphQlNode,
  fallback: Partial<LearningResourceTaxonomyOption> = {},
): LearningResourceTaxonomyOption {
  return {
    id: node.id,
    label: node.label || node.id,
    slug: node.slug || undefined,
    parentId: node.parentId || fallback.parentId,
    subjectId: node.subjectId || fallback.subjectId,
    categoryId: node.categoryId || fallback.categoryId,
    topicId: fallback.topicId,
    description: node.description || undefined,
    sortOrder: node.sortOrder ?? fallback.sortOrder,
    status: node.status || fallback.status,
    metadata: {
      kind: graphQlNodeKind(node),
      childCount: String(node.childCount ?? 0),
      resourceCount: String(node.resourceCount ?? 0),
    },
  };
}

export function mapGraphQlResourceCard(
  card: LearningResourceLibraryGraphQlCard,
  scope: Record<string, unknown> = {},
): LearningResourceResourceCard {
  const subjectId = card.subjectId || stringParam(scope.subjectId) || "curriculum";
  const categoryId = card.categoryId || stringParam(scope.categoryId || scope.levelId) || card.sectionId || card.topicId || subjectId;
  const sectionId = card.sectionId || card.topicId || stringParam(scope.sectionId) || categoryId;
  const topicId = card.topicId || stringParam(scope.topicId) || sectionId;
  const selectedFileType = fileTypeFromGraphQlCard(card);
  return {
    id: card.id,
    slug: card.slug || slugify(card.title || card.id),
    title: card.title || card.id,
    subtitle: card.subtitle || undefined,
    thumbnailUrl: card.thumbnailUrl || undefined,
    programSlug: subjectId,
    subjectId,
    gradeId: card.gradeId || stringParam(scope.gradeId),
    categoryId,
    sectionId,
    topicId,
    selectedFileType,
    fileTypeBadge: selectedFileType,
    launchMode: launchModeFor(selectedFileType),
    priceType: "free",
    accessState: "open",
    visibility: card.visibility || undefined,
    status: card.status || undefined,
    canDownload: false,
    updatedAt: card.updatedAt || card.publishedAt || undefined,
  };
}

function mapCardToStudioResource(card: LearningResourceResourceCard): StudioResourceResponse {
  return {
    id: card.id,
    title: card.title,
    subtitle: card.subtitle,
    thumbnailUrl: card.thumbnailUrl,
    subjectId: card.subjectId,
    categoryId: card.categoryId,
    sectionId: card.sectionId,
    fileType: card.selectedFileType,
    type: card.selectedFileType,
    status: card.status,
    visibility: card.visibility,
    updatedAt: card.updatedAt,
  };
}

function taxonomyToCurriculumNode(item: LearningResourceTaxonomyOption, kind: string): CurriculumTreeNodeResponse {
  return {
    id: item.id,
    label: item.label,
    name: item.label,
    slug: item.slug,
    parentId: item.parentId,
    subjectId: item.subjectId,
    categoryId: item.categoryId,
    topicId: item.topicId,
    description: item.description,
    sortOrder: item.sortOrder,
    status: item.status,
    kind,
    nodeType: kind,
    metadata: item.metadata,
  };
}

function fileTypeFromGraphQlCard(card: LearningResourceLibraryGraphQlCard) {
  const status = (card.status || "").toUpperCase();
  const title = (card.title || "").toUpperCase();
  if (status.includes("QUIZ") || title.endsWith(".QUIZ")) return "QUIZ";
  if (title.endsWith(".PPT") || title.endsWith(".PPTX")) return "PPTX";
  if (title.endsWith(".MP4") || title.endsWith(".MOV")) return "VIDEO";
  if (title.endsWith(".MP3") || title.endsWith(".WAV")) return "AUDIO";
  if (title.startsWith("HTTP://") || title.startsWith("HTTPS://")) return "LINK";
  return "PDF";
}

function sortTaxonomies(items: LearningResourceTaxonomyOption[]) {
  return [...items].sort((left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0) || left.label.localeCompare(right.label, "vi"));
}

function groupBy<T>(items: T[], keyFor: (item: T) => string) {
  const groups = new Map<string, T[]>();
  items.forEach((item) => {
    const key = keyFor(item);
    const group = groups.get(key) ?? [];
    group.push(item);
    groups.set(key, group);
  });
  return groups;
}

function graphQlNodeKind(node: LearningResourceLibraryGraphQlNode) {
  return (node.kind || "").toLowerCase();
}

export function stringParam(value: unknown) {
  if (value === undefined || value === null || value === "") return undefined;
  return String(value);
}
