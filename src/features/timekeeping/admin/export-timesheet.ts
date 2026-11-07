import { toast } from "sonner";

import { timekeepingAdminApi } from "../api/timekeeping-admin-api";
import type { RecentPunch, Timesheet } from "../api/timekeeping-types";
import { PUNCH_STATUS, punchTimeText, verifyText } from "./punch-status";

type Cell = string | number;

/** Spreadsheet apps run text starting with = + - @ as a formula. */
const safeText = (value: string | undefined): string => {
  const text = value ?? "";
  return /^[=+\-@]/.test(text) ? `'${text}` : text;
};

const daysIn = (period: string) => {
  const [year, month] = period.split("-").map(Number);
  return new Date(year, month, 0).getDate();
};

/** Header + one row per person: name, team, a code per day ("" = day off), then the totals (numbers stay numbers). */
export function timesheetToRows(t: Timesheet): Cell[][] {
  const length = daysIn(t.period ?? "");
  const header: Cell[] = ["Nhân sự", "Tổ", ...Array.from({ length }, (_, i) => i + 1), "Công", "Muộn", "Phép", "KP/KC", "Tiết dạy", "Phút trừ"];
  const rows = (t.rows ?? []).map((row): Cell[] => {
    const codes = new Map((row.days ?? []).map((day) => [day.d, day.code ?? ""]));
    return [
      safeText(row.name),
      safeText(row.team),
      ...Array.from({ length }, (_, i) => safeText(codes.get(i + 1))),
      row.work ?? 0,
      row.late ?? 0,
      row.leave ?? 0,
      row.kpKc ?? 0,
      row.periods ?? 0,
      row.deductMinutes ?? 0,
    ];
  });
  return [header, ...rows];
}

export function todayPunchRows(punches: readonly RecentPunch[]): Cell[][] {
  return [
    ["Nhân sự", "Cơ sở", "Giờ", "Xác thực", "Trạng thái"],
    ...punches.map((p): Cell[] => [safeText(p.userName), safeText(p.siteName), punchTimeText(p), verifyText(p), PUNCH_STATUS[p.status ?? "VALID"].label]),
  ];
}

async function save(rows: Cell[][], sheetName: string, fileName: string) {
  try {
    const XLSX = await import("xlsx");
    const sheet = XLSX.utils.aoa_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, sheetName);
    XLSX.writeFile(workbook, fileName);
  } catch {
    toast.error("Không xuất được file Excel, thử lại.");
  }
}

const EXPORT_PAGE = 200; // backend cap per page

/** Payroll sheet: the whole school (ignores the search and team filters), fetched page by page. */
export async function exportTimesheet(schoolId: string, period: string) {
  try {
    const first = await timekeepingAdminApi.timesheet({ schoolId, period, page: 0, size: EXPORT_PAGE });
    const rows = [...(first.rows ?? [])];
    for (let page = 1; rows.length < (first.total ?? 0) && page < 100; page += 1) {
      const next = await timekeepingAdminApi.timesheet({ schoolId, period, page, size: EXPORT_PAGE });
      if (!next.rows?.length) break;
      rows.push(...next.rows);
    }
    if (rows.length < (first.total ?? 0)) toast.warning(`Chỉ xuất được ${rows.length}/${first.total} nhân sự do vượt giới hạn trang, hãy kiểm tra file trước khi dùng tính lương.`);
    await save(timesheetToRows({ ...first, rows }), "Bảng công", `bang-cong-${period}.xlsx`);
  } catch {
    toast.error("Không xuất được file Excel, thử lại.");
  }
}

export const exportTodayPunches = (punches: readonly RecentPunch[], date: string) =>
  save(todayPunchRows(punches), "Chấm công", `cham-cong-${date}.xlsx`);
