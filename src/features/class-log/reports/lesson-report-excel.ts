import { toast } from "sonner";

import type { LessonReportMatrix, LessonReportRow } from "./lesson-report-api";
import { sheetRows } from "./lesson-report-model";

/** Builds the workbook in the browser (xlsx is loaded on click) and downloads «bao-giang-<tuần>.xlsx». */
export async function exportLessonReportExcel(matrix: LessonReportMatrix, rows: ReadonlyArray<LessonReportRow>) {
  try {
    const XLSX = await import("xlsx");
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(sheetRows(matrix, rows)), "Báo giảng");
    XLSX.writeFile(workbook, `bao-giang-${matrix.weekStart}.xlsx`);
  } catch {
    toast.error("Không xuất được file Excel. Thử lại.");
  }
}
