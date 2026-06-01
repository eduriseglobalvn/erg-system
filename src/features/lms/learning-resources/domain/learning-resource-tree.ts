import type { HocLieuResourceCard, HocLieuTaxonomyOption, HocLieuTaxonomyResponse } from "@/features/admin-operations/api/learning-resource-authoring-api";
import type { HocLieuResource } from "@/features/lms/learning-resources/api/learning-resource-data";

export type LearningResourceNodeKind = "group" | "lesson" | "folder";
export type LearningResourceSourceKind = "category" | "topic" | "section" | "bookSeries" | "folder";

export type LearningResourceLocation = {
  categoryId?: string;
  topicId?: string;
  sectionId?: string;
  bookSeriesId?: string;
};

export type LearningResourceNode = {
  id: string;
  label: string;
  kind: LearningResourceNodeKind;
  sourceKind: LearningResourceSourceKind;
  optionId?: string;
  description?: string;
  status?: string;
  metadata?: Record<string, string>;
  location: LearningResourceLocation;
  children: LearningResourceNode[];
};

export type LearningResourceSubject = {
  id: string;
  label: string;
  description?: string;
  status?: string;
  metadata?: Record<string, string>;
  tree: LearningResourceNode[];
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

function sectionNode(section: HocLieuTaxonomyOption, fallbackLocation: LearningResourceLocation = {}): LearningResourceNode {
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
  sourceKind: Exclude<LearningResourceSourceKind, "section" | "folder">,
  option: HocLieuTaxonomyOption,
  lessons: HocLieuTaxonomyOption[],
  location: LearningResourceLocation,
): LearningResourceNode {
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

function countGroups(nodes: LearningResourceNode[]): number {
  return nodes.reduce((total, node) => total + (node.kind === "group" ? 1 : 0) + countGroups(node.children), 0);
}

function countLessons(nodes: LearningResourceNode[]): number {
  return nodes.reduce((total, node) => total + (node.kind === "lesson" ? 1 : 0) + countLessons(node.children), 0);
}

export function buildLearningResourceSubjects(
  model: HocLieuTaxonomyResponse,
  resources: Array<Pick<HocLieuResourceCard, "subjectId"> | Pick<HocLieuResource, "subjectId">>,
): LearningResourceSubject[] {
  return sortOptions(model.subjects).map((subject) => {
    const categories = sortOptions(model.categories.filter((item) => belongsToSubject(item, subject.id)));
    const sections = sortOptions(model.sections.filter((item) => belongsToSubject(item, subject.id)));

    const usedSectionIds = new Set<string>();
    const groups: LearningResourceNode[] = [];

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
        label: "NhÃ³m há»c liá»‡u chÆ°a xáº¿p",
        kind: "group",
        sourceKind: "folder",
        description: "CÃ¡c bÃ i há»c chÆ°a náº±m trong nhÃ³m há»c liá»‡u chuáº©n.",
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

export function countLearningResourceNodes(nodes: LearningResourceNode[]): number {
  return nodes.reduce((total, node) => total + 1 + countLearningResourceNodes(node.children), 0);
}

export function flattenLearningResourceNodes(nodes: LearningResourceNode[]): LearningResourceNode[] {
  return nodes.flatMap((node) => [node, ...flattenLearningResourceNodes(node.children)]);
}

export function findLearningResourceNode(nodes: LearningResourceNode[], nodeId: string): LearningResourceNode | undefined {
  for (const node of nodes) {
    if (node.id === nodeId) return node;
    const child = findLearningResourceNode(node.children, nodeId);
    if (child) return child;
  }
  return undefined;
}

export function findLearningResourcePath(nodes: LearningResourceNode[], nodeId: string, trail: LearningResourceNode[] = []): LearningResourceNode[] {
  for (const node of nodes) {
    const nextTrail = [...trail, node];
    if (node.id === nodeId) return nextTrail;
    const childPath = findLearningResourcePath(node.children, nodeId, nextTrail);
    if (childPath.length) return childPath;
  }
  return [];
}

export function collectLearningResourceLessonIds(node: LearningResourceNode): string[] {
  if (node.kind === "lesson") {
    return [node.optionId || node.id];
  }
  return node.children.flatMap((child) => collectLearningResourceLessonIds(child));
}

export function matchesResourceToLearningNode(resource: HocLieuResourceCard | { categoryId?: string; topicId?: string; sectionId?: string; bookSeriesId?: string }, node?: LearningResourceNode) {
  if (!node) return false;
  if (node.kind === "lesson") return resource.sectionId === node.location.sectionId;
  if (node.kind === "group") {
    if (node.sourceKind === "category") return resource.categoryId === node.location.categoryId;
  }
  return false;
}
