import { toast } from "sonner";

import { markLabels } from "./attendance-copy";
import type { AttendanceStudent, MarkMap } from "./attendance-model";

type Cell = string | number;

/** Spreadsheet apps run text starting with = + - @ as a formula. */
const safeText = (value: string): string => (/^[=+\-@]/.test(value) ? `'${value}` : value);

export function attendanceRows(students: readonly AttendanceStudent[], marks: MarkMap): Cell[][] {
  return [
    ["STT", "Học sinh", "Trạng thái"],
    ...students.map((student, index): Cell[] => [index + 1, safeText(student.name), markLabels[marks[student.id] ?? "present"]]),
  ];
}

export async function exportAttendance(rows: Cell[][], fileName: string) {
  try {
    const XLSX = await import("xlsx");
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(rows), "Điểm danh");
    XLSX.writeFile(workbook, fileName);
  } catch {
    toast.error("Không xuất được file Excel, thử lại.");
  }
}
