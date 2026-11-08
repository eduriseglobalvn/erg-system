import { buildAssignmentRecipientInput } from "@/features/lms/components/assign-homework-recipient";
import type { AssignHomeworkController } from "@/features/lms/components/use-assign-homework-controller";

/** Students the submit would reach: the same recipient the wizard sends, counted. */
export function countAssignRecipients(model: AssignHomeworkController): number {
  const recipient = buildAssignmentRecipientInput({
    assignmentClassId: model.assignmentClass?.id,
    assignmentGroups: model.activeAssignmentGroups,
    gradeStudentIdsByClass: model.gradeStudentIdsByClass,
    selectedAssignmentGroupIds: model.selectedAssignmentGroupIds,
    selectedGradeClassIds: model.selectedGradeClassIds,
    selectedGradeStudentIdsByClass: model.selectedGradeStudentIdsByClass,
    selectedGroupStudentIdsByGroup: model.selectedGroupStudentIdsByGroup,
    selectedStudentIds: model.selectedStudentIds,
    targetType: model.targetType,
  });
  if (recipient.studentIds) return recipient.studentIds.length;
  if (recipient.recipientMode === "group") {
    return model.activeAssignmentGroups.find((group) => group.id === recipient.groupId)?.studentIds.length ?? 0;
  }
  return 0; // whole class without a student pick: the form blocks it ("chọn ít nhất một học sinh")
}
