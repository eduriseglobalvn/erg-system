import type { AttachedResourceItem, LocalContentItem, StudioNode } from "@/features/lcms/admin-operations/types/learning-resource-authoring";
import type { CurriculumFolderRole } from "@/features/lcms/admin-operations/utils/curriculum-view-model/types";

export function getNodeFolderRole(node: StudioNode): Exclude<CurriculumFolderRole, "subject"> {
  if (node.metadata?.taxonomyRole === "level" || node.kind === "group" || node.kind === "category" || node.kind === "bookSeries") {
    return "level";
  }
  return "topic";
}

export function countNodesByRole(nodes: StudioNode[], role: CurriculumFolderRole): number {
  return nodes.reduce((total, node) => {
    const current = getNodeFolderRole(node) === role ? 1 : 0;
    return total + current + countNodesByRole(node.children, role);
  }, 0);
}

export function collectTopicNodes(nodes: StudioNode[]): StudioNode[] {
  return nodes.flatMap((node) =>
    getNodeFolderRole(node) === "topic" ? [node] : collectTopicNodes(node.children),
  );
}

export function findDescendant(nodes: StudioNode[], predicate: (node: StudioNode) => boolean): StudioNode | undefined {
  for (const node of nodes) {
    if (predicate(node)) return node;
    const nested = findDescendant(node.children, predicate);
    if (nested) return nested;
  }
  return undefined;
}

export function localContentBelongsToNode(item: LocalContentItem, node: StudioNode) {
  if (node.kind === "lesson" || node.kind === "section" || node.kind === "topic") {
    return item.parentOptionId === node.optionId || item.parentNodeId === node.id;
  }

  const lessonIds = collectLessonOptionIds(node);
  return lessonIds.has(item.parentOptionId);
}

export function resourceBelongsToNode(resource: AttachedResourceItem, node: StudioNode) {
  if (node.kind === "lesson" || node.kind === "section" || node.kind === "topic") {
    return Boolean(
      (node.location.sectionId && resource.sectionId === node.location.sectionId) ||
      (node.optionId && resource.sectionId === node.optionId) ||
      (node.location.topicId && resource.topicId === node.location.topicId),
    );
  }

  if (node.location.categoryId && resource.categoryId === node.location.categoryId) return true;
  const lessonIds = collectLessonOptionIds(node);
  return Boolean(resource.sectionId && lessonIds.has(resource.sectionId));
}

function collectLessonOptionIds(node: StudioNode): Set<string> {
  const ids = new Set<string>();
  const visit = (current: StudioNode) => {
    if ((current.kind === "lesson" || current.kind === "section" || current.kind === "topic") && current.optionId) {
      ids.add(current.optionId);
    }
    current.children.forEach(visit);
  };
  visit(node);
  return ids;
}

export function normalizeForMatch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
