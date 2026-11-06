import type { StudioNode, StudioSubject } from "@/features/lcms/admin-operations/types/learning-resource-authoring";
import type { BuildCurriculumExplorerModelInput, CurriculumExplorerModel, CurriculumSelectionKind } from "@/features/lcms/admin-operations/utils/curriculum-view-model/types";
import { buildTopicContentGroups, emptyContentGroups } from "@/features/lcms/admin-operations/utils/curriculum-view-model/content-items";
import { nodeToFolder, subjectToFolder } from "@/features/lcms/admin-operations/utils/curriculum-view-model/folders";
import { getNodeFolderRole } from "@/features/lcms/admin-operations/utils/curriculum-view-model/node-matching";
import { summarizeFolder, summarizeSubjects } from "@/features/lcms/admin-operations/utils/curriculum-view-model/summary";

export function buildCurriculumExplorerModel({
  subjects,
  selectedSubject,
  selectedNode,
  selectedPath,
  localContentItems,
  resources,
  quizBankItems,
}: BuildCurriculumExplorerModelInput): CurriculumExplorerModel {
  const selectedKind = getSelectedKind(selectedSubject, selectedNode);
  const pathLabels = [selectedSubject?.label, ...selectedPath.map((node) => node.label)].filter(Boolean) as string[];
  const summary = selectedSubject
    ? summarizeFolder(selectedSubject, selectedNode, localContentItems, resources)
    : summarizeSubjects(subjects, localContentItems, resources);
  const folders = selectedSubject
    ? (selectedNode?.children ?? selectedSubject.tree).map((node) =>
        nodeToFolder({ node, pathLabels, resources, localContentItems, subject: selectedSubject }),
      )
    : subjects.map((subject) => subjectToFolder(subject, localContentItems, resources));
  const selectedFolder = selectedSubject
    ? selectedNode
      ? nodeToFolder({
          node: selectedNode,
          pathLabels: pathLabels.slice(0, -1),
          resources,
          localContentItems,
          subject: selectedSubject,
        })
      : subjectToFolder(selectedSubject, localContentItems, resources)
    : undefined;
  const contentGroups = selectedKind === "topic" && selectedSubject && selectedNode
    ? buildTopicContentGroups(selectedSubject, selectedNode, localContentItems, resources, quizBankItems)
    : emptyContentGroups();

  return {
    selectedKind,
    selectedFolder,
    folders,
    contentGroups,
    summary,
    pathLabels,
    searchPlaceholder: getSearchPlaceholder(selectedKind, selectedSubject),
  };
}

function getSelectedKind(subject?: StudioSubject, node?: StudioNode): CurriculumSelectionKind {
  if (!subject) return "none";
  if (!node) return "subject";
  return getNodeFolderRole(node);
}

function getSearchPlaceholder(selectedKind: CurriculumSelectionKind, subject?: StudioSubject) {
  if (selectedKind === "topic") return "Tìm trong chủ đề này";
  if (selectedKind === "level") return "Tìm trong level này";
  if (subject) return `Tìm trong ${subject.label}`;
  return "Tìm môn học, level, chủ đề";
}
