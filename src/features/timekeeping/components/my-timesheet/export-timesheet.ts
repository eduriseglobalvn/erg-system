import { formatDateVi } from "@/domain/formatters/format-date";
import type { MonthView } from "../../api/timekeeping-types";
import { dayCodeFor } from "../../model/day-codes";

/** Spreadsheet apps run text starting with = + - @ as a formula. */
const safeText = (value: string) => (/^[=+\-@]/.test(value) ? `'${value}` : value);

/** Rows of the personal sheet: one line per day, then the month totals. Dates and codes are text cells. */
export function timesheetRows(month: MonthView): string[][] {
  const days = (month.days ?? []).map((day) => {
    const code = day.status ? dayCodeFor(day.status, day.leaveKind) : null;
    return [formatDateVi(day.date), code?.code ?? "", code?.label ?? "", String(day.units ?? 0)];
  });
  return [
    ["Ngày", "Ký hiệu", "Trạng thái", "Công"],
    ...days,
    [],
    ["Công thực tế / chuẩn", `${month.actualUnits ?? 0} / ${month.standardUnits ?? 0}`],
    ["Số lần đi muộn", String(month.lateCount ?? 0)],
    ["Phút đi muộn", String(month.lateMinutes ?? 0)],
  ].map((row) => row.map(safeText));
}

export async function exportMyTimesheet(month: MonthView, period: string) {
  const XLSX = await import("xlsx");
  const sheet = XLSX.utils.aoa_to_sheet(timesheetRows(month));
  sheet["!cols"] = [{ wch: 22 }, { wch: 10 }, { wch: 22 }, { wch: 8 }];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Bảng công");
  XLSX.writeFile(workbook, `bang-cong-${period}.xlsx`);
}
