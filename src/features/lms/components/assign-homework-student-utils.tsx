import { classroomStudents } from "@/features/lms/classroom/api/mock-classroom-data";
import type { ClassroomStudent } from "@/features/lms/classroom/types/classroom-types";
import type { LmsStudentGroup } from "@/features/lms/api/lms-assignment-command-api";
/* eslint-disable react-refresh/only-export-components */
import { cn } from "@/lib/utils";

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

export function getMockBirthDate(index: number) {
  const day = String((index % 27) + 1).padStart(2, "0");
  const month = String((index % 12) + 1).padStart(2, "0");
  const year = 2011 + (index % 3);
  return `${day}/${month}/${year}`;
}

export function getMockStudentLevel(status: ClassroomStudent["status"]) {
  if (status === "ahead") return "Khá";
  if (status === "support") return "Cần hỗ trợ";
  return "Đạt";
}

export function StudentLevelBadge({ level }: { level: string }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-lg border px-2.5 py-1 text-[13px] font-bold",
        level === "Khá"
          ? "border-[#B8EDF7] bg-[#E6F9FD] text-[#007A91]"
          : level === "Cần hỗ trợ"
            ? "border-amber-200 bg-amber-50 text-amber-700"
            : "border-slate-200 bg-slate-50 text-slate-700",
      )}
    >
      {level}
    </span>
  );
}
