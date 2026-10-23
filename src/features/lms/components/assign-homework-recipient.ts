import {
  resolveAssignHomeworkGradeStudentIds,
  type AssignHomeworkGroupOption,
} from "@/features/lms/components/assign-homework-student-utils";

export type AssignmentRecipientInput = {
  recipientMode: "class" | "group" | "students";
  classId?: string | null;
  groupId?: string | null;
  studentIds?: string[];
};

export function buildAssignmentRecipientInput({
  assignmentClassId,
  assignmentGroups,
  gradeStudentIdsByClass,
  selectedAssignmentGroupIds,
  selectedGradeClassIds,
  selectedGradeStudentIdsByClass,
  selectedGroupStudentIdsByGroup,
  selectedStudentIds,
  targetType,
}: {
  assignmentClassId?: string;
  assignmentGroups: AssignHomeworkGroupOption[];
  gradeStudentIdsByClass: Record<string, string[]>;
  selectedAssignmentGroupIds: Set<string>;
  selectedGradeClassIds: Set<string>;
  selectedGradeStudentIdsByClass: Record<string, string[]>;
  selectedGroupStudentIdsByGroup: Record<string, string[]>;
  selectedStudentIds: Set<string>;
  targetType: "grade" | "class" | "group";
}): AssignmentRecipientInput {
  if (targetType === "class") {
    return selectedStudentIds.size > 0
      ? {
          classId: assignmentClassId,
          recipientMode: "students",
          studentIds: Array.from(selectedStudentIds),
        }
      : {
          classId: assignmentClassId,
          recipientMode: "class",
        };
  }

  if (targetType === "group") {
    const groupIds = Array.from(selectedAssignmentGroupIds);
    const explicitStudentIds = uniqueValues(groupIds.flatMap((groupId) => selectedGroupStudentIdsByGroup[groupId] ?? []));
    if (groupIds.length === 1 && explicitStudentIds.length === 0) {
      return {
        groupId: groupIds[0],
        recipientMode: "group",
      };
    }
    const allGroupStudentIds = explicitStudentIds.length
      ? explicitStudentIds
      : uniqueValues(groupIds.flatMap((groupId) => assignmentGroups.find((group) => group.id === groupId)?.studentIds ?? []));
    return {
      recipientMode: "students",
      studentIds: allGroupStudentIds,
    };
  }

  const selectedGradeStudentIds = uniqueValues(
    resolveAssignHomeworkGradeStudentIds(
      selectedGradeClassIds,
      selectedGradeStudentIdsByClass,
      gradeStudentIdsByClass,
    ),
  );
  return {
    recipientMode: "students",
    studentIds: selectedGradeStudentIds,
  };
}

export function parseAssignDateTime(value: string) {
  const trimmed = value.trim();
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/.exec(trimmed);
  if (!match) {
    const fallback = new Date(trimmed);
    return Number.isNaN(fallback.getTime()) ? null : fallback.toISOString();
  }
  const [, day, month, year, hour = "0", minute = "0", second = "0"] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second));
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function createAssignmentIdempotencyKey({
  dueAt,
  quizIds,
  startAt,
  title,
}: {
  dueAt: string;
  quizIds: string[];
  startAt: string;
  title: string;
}) {
  return `assign:${slugPart(title)}:${quizIds.slice().sort().join(",")}:${startAt}:${dueAt}`;
}

function slugPart(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "untitled";
}

function uniqueValues(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}
