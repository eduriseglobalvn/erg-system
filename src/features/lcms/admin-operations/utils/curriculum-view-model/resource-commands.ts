import type { AttachedResourceItem, StudioSubject } from "@/features/lcms/admin-operations/types/learning-resource-authoring";
import type { CurriculumSelectionKind, ResourceCommandSpec, ResourceCurriculumLocation } from "@/features/lcms/admin-operations/utils/curriculum-view-model/types";
import { findDescendant } from "@/features/lcms/admin-operations/utils/curriculum-view-model/node-matching";

export function resolveResourceCurriculumLocation(
  subjects: StudioSubject[],
  resource: Pick<AttachedResourceItem, "subjectId" | "categoryId" | "levelId" | "sectionId" | "topicId">,
): ResourceCurriculumLocation {
  const subject = subjects.find((candidate) => candidate.id === resource.subjectId);
  if (!subject) {
    return {
      subjectLabel: "Chưa xác định môn học",
      pathLabels: ["Chưa xác định môn học"],
      isResolved: false,
    };
  }

  const expectedLevelId = resource.levelId || resource.categoryId;
  const level = subject.tree.find((node) =>
    node.optionId === expectedLevelId
    || node.location.categoryId === expectedLevelId,
  );
  const topic = level
    ? findDescendant(level.children, (node) =>
        node.optionId === resource.sectionId
        || node.optionId === resource.topicId
        || node.location.sectionId === resource.sectionId
        || node.location.topicId === resource.topicId,
      )
    : undefined;
  const pathLabels = [subject.label, level?.label, topic?.label].filter(Boolean) as string[];

  return {
    subjectLabel: subject.label,
    levelLabel: level?.label,
    topicLabel: topic?.label,
    pathLabels,
    isResolved: Boolean(level && topic),
  };
}

export function getResourceCommandSpecs({
  canDeleteSelection,
  canEditSelection,
  hasSelectedSubject,
  selectedKind,
}: {
  canDeleteSelection: boolean;
  canEditSelection: boolean;
  hasSelectedSubject: boolean;
  selectedKind: CurriculumSelectionKind;
}): ResourceCommandSpec[] {
  const createCommand: ResourceCommandSpec =
    !hasSelectedSubject || selectedKind === "none"
      ? { id: "create-subject", label: "Tạo môn học", enabled: true, tone: "primary" }
      : selectedKind === "subject"
        ? { id: "create-level", label: "Tạo level", enabled: true, tone: "primary" }
        : selectedKind === "level"
          ? { id: "create-topic", label: "Tạo chủ đề", enabled: true, tone: "primary" }
          : { id: "add-lecture", label: "Thêm bài giảng", enabled: true, tone: "primary" };

  return [
    createCommand,
    { id: "add-lecture", label: "Thêm bài giảng", enabled: selectedKind === "topic", tone: "blue" },
    { id: "add-resource", label: "Gắn tài liệu", enabled: selectedKind === "topic", tone: "blue" },
    { id: "add-exercise", label: "Gắn bài tập từ Quiz bank", enabled: selectedKind === "topic", tone: "red" },
    { id: "copy-url", label: "Copy URL", enabled: hasSelectedSubject, tone: "neutral" },
    { id: "edit", label: "Sửa", enabled: canEditSelection, tone: "neutral" },
    { id: "delete", label: "Xem tác động", enabled: canDeleteSelection, tone: "danger" },
  ];
}
