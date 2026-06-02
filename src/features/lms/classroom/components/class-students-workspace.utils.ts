import { assignmentRuns } from "@/features/lms/classroom/api/mock-classroom-data";
import type { ClassroomStudent, StudentStatus } from "@/features/lms/classroom/types/classroom-types";
import { assignmentCatalog, IC3_PROGRAM_LABEL } from "./class-students-workspace.constants";
import type { AssignmentCatalogItem, DeliveryBatch } from "./class-students-workspace.types";
import type { StudentCopy } from "./class-students-workspace.copy";

export function getProgressColor(value: number) {
  if (value >= 80) return "bg-emerald-500";
  if (value >= 45) return "bg-amber-500";
  return "bg-rose-500";
}

export function getStatusTone(status: StudentStatus) {
  if (status === "ahead") return "success";
  if (status === "support") return "warning";
  return "secondary";
}

export function getStudentAssignmentSubject(student: ClassroomStudent) {
  const matchedAssignment =
    assignmentCatalog.find((assignment) => assignment.title === student.currentAssignment) ??
    assignmentRuns.find((assignment) => assignment.title === student.currentAssignment);

  if (matchedAssignment) return matchedAssignment.subjectLabel;
  if (student.currentAssignment.toLowerCase().includes("ic3 gs6")) return IC3_PROGRAM_LABEL;
  return null;
}

export function formatSelectedStudentNames(names: string[], copy: StudentCopy) {
  if (names.length === 0) return copy.noStudentSelected;
  const visibleNames = names.slice(0, 5).join(", ");
  return names.length > 5 ? `${visibleNames}, ...` : visibleNames;
}

export function formatSelectedAssignmentsTitle(assignments: AssignmentCatalogItem[], copy: StudentCopy) {
  if (assignments.length === 0) return copy.noAssignmentSelectedTitle;
  if (assignments.length === 1) return assignments[0].title;
  return copy.deliveryBatchTitle(assignments.length, assignments[0].activityLabel);
}

export function formatDueDate(value: string) {
  if (!value) return "-";
  return value.replace("T", " ");
}

export function getInitialBatches(copy: StudentCopy): DeliveryBatch[] {
  return [
    {
      id: "seed-batch-1",
      assignmentTitle: "Reading sprint - daily routines",
      className: "Lớp 6A1",
      dueDate: "2026-04-30T20:30",
      recipients: 32,
    },
    {
      id: "seed-batch-2",
      assignmentTitle: copy.sampleAssignment,
      className: "Lớp 7B1",
      dueDate: "2026-05-02T09:00",
      recipients: 12,
    },
  ];
}

