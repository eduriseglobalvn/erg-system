import { classroomStudents } from "@/features/lms/classroom/api/mock-classroom-data";
import type { ClassroomStudent } from "@/features/lms/classroom/types/classroom-types";
import { cn } from "@/lib/utils";

export function getClassStudents(classId?: string) {
  return classroomStudents.filter((student) => !classId || student.classId === classId);
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
        "inline-flex rounded-md px-2.5 py-1 text-[11px] font-semibold",
        level === "Khá"
          ? "bg-emerald-50 text-emerald-600"
          : level === "Cần hỗ trợ"
            ? "bg-amber-50 text-amber-600"
            : "bg-slate-100 text-slate-500",
      )}
    >
      {level}
    </span>
  );
}
