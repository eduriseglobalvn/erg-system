import type { HocLieuResourceCard, HocLieuTaxonomyOption, HocLieuTaxonomyResponse } from "@/features/admin-operations/api/hoclieu-authoring-api";
import type { HocLieuResource } from "@/features/hoclieu/api/library-data";

export type HocLieuLearningNodeKind = "group" | "lesson" | "folder";
export type HocLieuLearningSourceKind = "category" | "topic" | "section" | "bookSeries" | "folder";

export type HocLieuLearningLocation = {
  categoryId?: string;
  topicId?: string;
  sectionId?: string;
  bookSeriesId?: string;
};

export type HocLieuLearningNode = {
  id: string;
  label: string;
  kind: HocLieuLearningNodeKind;
  sourceKind: HocLieuLearningSourceKind;
  optionId?: string;
  description?: string;
  status?: string;
  metadata?: Record<string, string>;
  location: HocLieuLearningLocation;
  children: HocLieuLearningNode[];
};

export type HocLieuLearningSubject = {
  id: string;
  label: string;
  description?: string;
  status?: string;
  metadata?: Record<string, string>;
  tree: HocLieuLearningNode[];
  groupCount: number;
  lessonCount: number;
  resourceCount: number;
};

function belongsToSubject(option: HocLieuTaxonomyOption, subjectId: string) {
  return option.subjectId === subjectId || option.id === subjectId || !option.subjectId;
}

function sortOptions<T extends HocLieuTaxonomyOption>(items: T[]) {
  return [...items].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || String(a.label ?? "").localeCompare(String(b.label ?? ""), "vi"));
}

function sectionNode(section: HocLieuTaxonomyOption, fallbackLocation: HocLieuLearningLocation = {}): HocLieuLearningNode {
  return {
    id: `lesson-${section.id}`,
    label: section.label,
    kind: "lesson",
    sourceKind: "section",
    optionId: section.id,
    description: section.description,
    status: section.status,
    metadata: section.metadata,
    location: {
      categoryId: section.categoryId || fallbackLocation.categoryId,
      sectionId: section.id,
    },
    children: [],
  };
}

function groupNode(
  sourceKind: Exclude<HocLieuLearningSourceKind, "section" | "folder">,
  option: HocLieuTaxonomyOption,
  lessons: HocLieuTaxonomyOption[],
  location: HocLieuLearningLocation,
): HocLieuLearningNode {
  return {
    id: `group-${sourceKind}-${option.id}`,
    label: option.label,
    kind: "group",
    sourceKind,
    optionId: option.id,
    description: option.description,
    status: option.status,
    metadata: option.metadata,
    location,
    children: sortOptions(lessons).map((lesson) => sectionNode(lesson, location)),
  };
}

function countGroups(nodes: HocLieuLearningNode[]): number {
  return nodes.reduce((total, node) => total + (node.kind === "group" ? 1 : 0) + countGroups(node.children), 0);
}

function countLessons(nodes: HocLieuLearningNode[]): number {
  return nodes.reduce((total, node) => total + (node.kind === "lesson" ? 1 : 0) + countLessons(node.children), 0);
}

export function buildHocLieuLearningSubjects(
  model: HocLieuTaxonomyResponse,
  resources: Array<Pick<HocLieuResourceCard, "subjectId"> | Pick<HocLieuResource, "subjectId">>,
): HocLieuLearningSubject[] {
  return sortOptions(model.subjects).map((subject) => {
    const categories = sortOptions(model.categories.filter((item) => belongsToSubject(item, subject.id)));
    const sections = sortOptions(model.sections.filter((item) => belongsToSubject(item, subject.id)));

    const usedSectionIds = new Set<string>();
    const groups: HocLieuLearningNode[] = [];

    for (const category of categories) {
      const categoryLessons = sections.filter((section) => section.categoryId === category.id && !usedSectionIds.has(section.id));
      const group = groupNode("category", category, categoryLessons, {
        categoryId: category.id,
      });
      categoryLessons.forEach((lesson) => usedSectionIds.add(lesson.id));
      groups.push(group);
    }

    const orphanLessons = sections.filter((section) => !usedSectionIds.has(section.id));
    if (orphanLessons.length) {
      groups.push({
        id: `group-folder-${subject.id}-uncategorized`,
        label: "Nhóm học liệu chưa xếp",
        kind: "group",
        sourceKind: "folder",
        description: "Các bài học chưa nằm trong nhóm học liệu chuẩn.",
        location: {},
        children: orphanLessons.map((lesson) => sectionNode(lesson)),
      });
    }

    const tree = groups;

    return {
      id: subject.id,
      label: subject.label,
      description: subject.description,
      status: subject.status,
      metadata: subject.metadata,
      tree,
      groupCount: countGroups(tree),
      lessonCount: countLessons(tree),
      resourceCount: resources.filter((resource) => resource.subjectId === subject.id).length,
    };
  });
}

export function countHocLieuLearningNodes(nodes: HocLieuLearningNode[]): number {
  return nodes.reduce((total, node) => total + 1 + countHocLieuLearningNodes(node.children), 0);
}

export function flattenHocLieuLearningNodes(nodes: HocLieuLearningNode[]): HocLieuLearningNode[] {
  return nodes.flatMap((node) => [node, ...flattenHocLieuLearningNodes(node.children)]);
}

export function findHocLieuLearningNode(nodes: HocLieuLearningNode[], nodeId: string): HocLieuLearningNode | undefined {
  for (const node of nodes) {
    if (node.id === nodeId) return node;
    const child = findHocLieuLearningNode(node.children, nodeId);
    if (child) return child;
  }
  return undefined;
}

export function findHocLieuLearningPath(nodes: HocLieuLearningNode[], nodeId: string, trail: HocLieuLearningNode[] = []): HocLieuLearningNode[] {
  for (const node of nodes) {
    const nextTrail = [...trail, node];
    if (node.id === nodeId) return nextTrail;
    const childPath = findHocLieuLearningPath(node.children, nodeId, nextTrail);
    if (childPath.length) return childPath;
  }
  return [];
}

export function collectHocLieuLearningLessonIds(node: HocLieuLearningNode): string[] {
  if (node.kind === "lesson") {
    return [node.optionId || node.id];
  }
  return node.children.flatMap((child) => collectHocLieuLearningLessonIds(child));
}

export function matchesResourceToLearningNode(resource: HocLieuResourceCard | { categoryId?: string; topicId?: string; sectionId?: string; bookSeriesId?: string }, node?: HocLieuLearningNode) {
  if (!node) return false;
  if (node.kind === "lesson") return resource.sectionId === node.location.sectionId;
  if (node.kind === "group") {
    if (node.sourceKind === "category") return resource.categoryId === node.location.categoryId;
  }
  return false;
}
