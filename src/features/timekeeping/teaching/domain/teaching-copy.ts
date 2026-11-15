import { formatDateVi, formatDateViHcm } from "@/domain/formatters/format-date";
import type { MyTeachingMonth, TeachingRole } from "../../api/timekeeping-teaching-api";
import { dayMonthVi, type MyMonthState } from "./teaching-model";

/** Sheet titles; the assistant table swaps «GIÁO VIÊN» for «TRỢ GIẢNG» (plan 2.8-5). */
export function teachingTitle(sheet: "total" | "month", role: TeachingRole): string {
  const who = role === "ASSISTANT" ? "TRỢ GIẢNG" : "GIÁO VIÊN";
  return sheet === "total" ? `BẢNG CHI TIẾT TKB ${who}` : `BẢNG THỐNG KÊ SỐ TIẾT ${who}`;
}

/** Status line of the month strip. `ended`: the month is over, so the only thing left to wait for is teachers. */
export function closeStatusText(status: string | undefined, ended: boolean, confirmed: number, teachers: number, closedAt?: string): string {
  if (status === "CLOSED") return closedAt ? `Đã chốt ${formatDateViHcm(closedAt)}` : "Đã chốt";
  if (status === "READY") return "GV đã xác nhận đủ · sẵn sàng chốt";
  if (!ended) return "Tháng chưa kết thúc · đang thu thập số tiết";
  return `Đã xác nhận ${confirmed}/${teachers} · còn ${teachers - confirmed} chờ GV`;
}

/** «Đã xác nhận 16/11» / «Chờ GV» / «Báo sai sót» of the last column of the month sheet. */
export function confirmationText(status: string | undefined, confirmedAt: string | undefined): { label: string; tone: "success" | "warning" | "error" } {
  if (status === "CONFIRMED") {
    const full = formatDateVi(confirmedAt);
    const date = full ? ` ${full.slice(0, 5)}` : "";
    return { label: `Đã xác nhận${date}`, tone: "success" };
  }
  return status === "ISSUE_REPORTED" ? { label: "Báo sai sót", tone: "error" } : { label: "Chờ GV", tone: "warning" };
}

export type MyBanner = { tone: "notice" | "info" | "ok"; title: string; hint: string };

/** Banner of «Công của tôi» · «Tiết dạy». The phone board words the waiting state shorter than the desktop one. */
export function myBanner(state: MyMonthState, data: Pick<MyTeachingMonth, "deadline" | "closedAt">, month: string, mobile: boolean): MyBanner {
  const m = month.slice(5);
  const due = dayMonthVi(data.deadline);
  if (state === "AWAITING") {
    return mobile
      ? { tone: "notice", title: `Chờ bạn xác nhận · hạn ${due}`, hint: "Số tiết tự tính từ lịch dạy. Sai thì bấm «Báo sai sót»." }
      : { tone: "notice", title: `Bảng công tháng ${m} đang chờ bạn xác nhận · hạn ${due}`, hint: "Kiểm tra số tiết. Sai thì bấm «Báo sai sót» để trưởng phòng đào tạo sửa lịch; không sửa số tay." };
  }
  if (state === "ISSUE") return { tone: "notice", title: `Bạn đã báo sai sót tháng ${m}`, hint: "Chờ trưởng phòng đào tạo sửa lịch. Số tiết đổi thì bạn xác nhận lại." };
  if (state === "CONFIRMED") return { tone: "ok", title: `Bạn đã xác nhận bảng công tháng ${m}`, hint: "Chờ HR chốt tháng." };
  if (state === "CLOSED") {
    const closed = formatDateViHcm(data.closedAt).slice(0, 5);
    return { tone: "ok", title: closed ? `Đã chốt · ${closed}` : "Đã chốt", hint: "HR đã gửi tính lương" };
  }
  return { tone: "info", title: `Tháng ${m} chưa kết thúc`, hint: "Số tiết tự tính từ lịch dạy đã áp dụng và còn thay đổi." };
}
