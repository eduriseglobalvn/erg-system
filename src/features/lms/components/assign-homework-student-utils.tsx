
import type { LmsStudentGroup } from "@/features/lms/api/lms-assignment-command-api";
import { classroomStudents } from "@/features/lms/classroom/api/mock-classroom-data";
import type { ClassroomStudent } from "@/features/lms/classroom/types/classroom-types";

export function getClassStudents(classId?: string) {
  return classroomStudents.filter((student) => !classId || student.classId === classId);
}

export function resolveAssignHomeworkClassStudents(
  workspaceStudents: ClassroomStudent[] | undefined,
  fallbackStudents: ClassroomStudent[],
  apiBacked: boolean,
) {
  if (apiBacked) return workspaceStudents ?? [];
  return workspaceStudents?.length ? workspaceStudents : fallbackStudents;
}

export type AssignHomeworkGroupOption = {
  id: string;
  name: string;
  color: string;
  source: string;
  studentIds: string[];
};

export function mapLmsStudentGroupsToAssignHomeworkGroups(groups: LmsStudentGroup[]): AssignHomeworkGroupOption[] {
  return groups.map((group) => ({
    id: group.id,
    name: group.name,
    color: group.color || "var(--erg-blue)",
    source: group.note || "BE student groups",
    studentIds: group.studentIds,
  }));
}

export function resolveAssignHomeworkGroups(
  apiGroups: AssignHomeworkGroupOption[] | undefined,
  fallbackGroups: AssignHomeworkGroupOption[],
  apiBacked: boolean,
): AssignHomeworkGroupOption[] {
  if (apiBacked) return apiGroups ?? [];
  return apiGroups?.length ? apiGroups : fallbackGroups;
}

export function resolveAssignHomeworkGradeStudentIds(
  selectedClassIds: Set<string>,
  selectedStudentIdsByClass: Record<string, string[]>,
  availableStudentIdsByClass: Record<string, string[]>,
) {
  return Array.from(
    new Set(
      Array.from(selectedClassIds)
        .flatMap((classId) => selectedStudentIdsByClass[classId] ?? availableStudentIdsByClass[classId] ?? [])
        .filter(Boolean),
    ),
  );
}
