import { toast } from "sonner";

import { formatDateVi, todayInput } from "@/domain/formatters/format-date";
import { loadLmsMyTeachingCalendar } from "../../api/teaching-calendar-api";
import { buildIcs, icsFileName } from "../../domain/ics";
import { addDaysToDate } from "../../domain/schedule-copy";

/** «Thêm vào lịch điện thoại»: tải 10 tuần lịch đã áp dụng từ hôm nay và lưu file .ics. */
export async function exportTeacherIcs(tenantId: string) {
  try {
    const from = todayInput();
    const data = await loadLmsMyTeachingCalendar({ from, statuses: ["PUBLISHED"], tenantId, to: addDaysToDate(from, 70) });
    const ics = buildIcs(data.events.map((event) => ({
      date: event.date, description: event.myRole === "ASSISTANT" ? `Trợ giảng cho ${event.mainTeacherName ?? ""}`.trim() : undefined, endTime: event.endTime, id: event.id,
      location: [event.roomName, event.schoolName].filter(Boolean).join(", "), startTime: event.startTime,
      summary: `${event.className} · Tiết ${event.periodStart}${event.myRole === "ASSISTANT" ? " · Trợ giảng" : ""}`,
    })));
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
    link.download = icsFileName(formatDateVi(from));
    link.click();
    URL.revokeObjectURL(link.href);
  } catch {
    toast.error("Chưa tạo được file lịch. Thử lại sau.");
  }
}
