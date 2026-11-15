import { formatDateVi, formatDateViHcm } from "@/domain/formatters/format-date";
import type { TeachingRole } from "../../api/timekeeping-teaching-api";

/** Sheet titles; the assistant table swaps «GIÁO VIÊN» for «TRỢ GIẢNG» (plan 2.8-5). */
export function teachingTitle(sheet: "total" | "month", role: TeachingRole): string {
  const who = role === "ASSISTANT" ? "TRỢ GIẢNG" : "GIÁO VIÊN";
  return sheet === "total" ? `BẢNG CHI TIẾT TKB ${who}` : `BẢNG THỐNG KÊ SỐ TIẾT ${who}`;
}

/** Chốt-card status line. `ended`: the month is over, so the only thing left to wait for is teachers. */
export function closeStatusText(status: string | undefined, ended: boolean, closedAt?: string): string {
  if (status === "CLOSED") return closedAt ? `Đã chốt ${formatDateViHcm(closedAt)}` : "Đã chốt";
  if (status === "READY") return "GV đã xác nhận đủ · sẵn sàng chốt";
  return ended ? "Chờ đủ giáo viên xác nhận" : "Tháng chưa kết thúc · đang thu thập số tiết";
}

/** «Đã xác nhận 16/11» / «Chờ GV» / «Báo sai sót» of the last column of the month sheet. */
export function confirmationText(status: string | undefined, confirmedAt: string | undefined): { label: string; tone: "success" | "warning" | "neutral" } {
  if (status === "CONFIRMED") {
    const full = formatDateVi(confirmedAt);
    const date = full ? ` ${full.slice(0, 5)}` : "";
    return { label: `Đã xác nhận${date}`, tone: "success" };
  }
  return status === "ISSUE_REPORTED" ? { label: "Báo sai sót", tone: "warning" } : { label: "Chờ GV", tone: "neutral" };
}
