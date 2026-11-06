import type { AttachedResourceItem, LocalContentItem, StudioNode, StudioSubject } from "@/features/lcms/admin-operations/types/learning-resource-authoring";
import type { CurriculumFolder } from "@/features/lcms/admin-operations/utils/curriculum-view-model/types";
import { getNodeFolderRole } from "@/features/lcms/admin-operations/utils/curriculum-view-model/node-matching";
import { emptyContentSummary, summarizeFolder } from "@/features/lcms/admin-operations/utils/curriculum-view-model/summary";

export function subjectToFolder(subject: StudioSubject, localContentItems: LocalContentItem[], resources: AttachedResourceItem[]): CurriculumFolder {
  return {
    id: `subject-${subject.id}`,
    role: "subject",
    title: subject.label,
    description: subject.description,
    status: subject.status,
    target: { type: "subject", id: subject.id },
    pathLabels: [subject.label],
    summary: summarizeFolder(subject, undefined, localContentItems, resources),
  };
}

export function nodeToFolder({
  localContentItems,
  node,
  pathLabels,
  resources,
  subject,
}: {
  localContentItems: LocalContentItem[];
  node: StudioNode;
  pathLabels: string[];
  resources: AttachedResourceItem[];
  subject?: StudioSubject;
}): CurriculumFolder {
  return {
    id: node.id,
    role: getNodeFolderRole(node),
    title: node.label,
    description: node.description,
    status: node.status,
    sourceKind: node.sourceKind,
    target: { type: "node", id: node.id },
    pathLabels: [...pathLabels, node.label],
    summary: subject ? summarizeFolder(subject, node, localContentItems, resources) : emptyContentSummary(),
  };
}
