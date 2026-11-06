import type { AttachedResourceItem, LocalContentItem, StudioNode, StudioSubject } from "@/features/lcms/admin-operations/types/learning-resource-authoring";
import type { ContentSummary } from "@/features/lcms/admin-operations/utils/curriculum-view-model/types";
import { classifyAttachedResource } from "@/features/lcms/admin-operations/utils/curriculum-view-model/content-items";
import { countNodesByRole, localContentBelongsToNode, resourceBelongsToNode } from "@/features/lcms/admin-operations/utils/curriculum-view-model/node-matching";

const EMPTY_SUMMARY: ContentSummary = {
  levels: 0,
  topics: 0,
  lectures: 0,
  documents: 0,
  exercises: 0,
  totalContent: 0,
  published: 0,
  draft: 0,
  hidden: 0,
};

export function emptyContentSummary(): ContentSummary {
  return { ...EMPTY_SUMMARY };
}

export function summarizeSubjects(subjects: StudioSubject[], localContentItems: LocalContentItem[], resources: AttachedResourceItem[]): ContentSummary {
  return subjects.reduce((summary, subject) => mergeSummary(summary, summarizeFolder(subject, undefined, localContentItems, resources)), emptyContentSummary());
}

export function summarizeFolder(
  subject: StudioSubject,
  node: StudioNode | undefined,
  localContentItems: LocalContentItem[],
  resources: AttachedResourceItem[],
): ContentSummary {
  const summary = emptyContentSummary();
  const nodes = node ? node.children : subject.tree;
  summary.levels = countNodesByRole(nodes, "level");
  summary.topics = countNodesByRole(nodes, "topic");

  const matchingLocalItems = localContentItems.filter(
    (item) => item.subjectId === subject.id && (!node || localContentBelongsToNode(item, node)),
  );
  const matchingResources = resources.filter(
    (resource) => resource.subjectId === subject.id && (!node || resourceBelongsToNode(resource, node)),
  );

  matchingLocalItems.forEach((item) => {
    if (item.kind === "lecture") summary.lectures += 1;
    if (item.kind === "exercise") summary.exercises += 1;
    addStatusCount(summary, item.status);
  });

  matchingResources.forEach((resource) => {
    const kind = classifyAttachedResource(resource);
    if (kind === "lecture") summary.lectures += 1;
    if (kind === "exercise") summary.exercises += 1;
    if (kind === "resource") summary.documents += 1;
    addStatusCount(summary, resource.status);
  });

  summary.totalContent = summary.lectures + summary.documents + summary.exercises;
  return summary;
}

function mergeSummary(left: ContentSummary, right: ContentSummary): ContentSummary {
  return {
    levels: left.levels + right.levels,
    topics: left.topics + right.topics,
    lectures: left.lectures + right.lectures,
    documents: left.documents + right.documents,
    exercises: left.exercises + right.exercises,
    totalContent: left.totalContent + right.totalContent,
    published: left.published + right.published,
    draft: left.draft + right.draft,
    hidden: left.hidden + right.hidden,
  };
}

function addStatusCount(summary: ContentSummary, status?: string) {
  const normalized = status?.toLowerCase();
  if (normalized === "hidden") {
    summary.hidden += 1;
    return;
  }
  if (normalized === "draft" || normalized === "reviewing") {
    summary.draft += 1;
    return;
  }
  summary.published += 1;
}
