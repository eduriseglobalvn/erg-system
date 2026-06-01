import type { ClassroomSnapshot } from "@/features/classroom/types/classroom-types";

import { getTeachingScheduleCalendarColor } from "./teaching-schedule-calendars";
import type { TeachingScheduleDraft, TeachingScheduleEvent, TeachingScheduleStatus } from "./teaching-schedule-types";

const statusLabels: Record<TeachingScheduleStatus, string> = {
  confirmed: "Đã phân bổ",
  draft: "Lịch nháp",
  "needs-material": "Cần học liệu",
};

type SeedEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  school: string;
  className: string;
  room: string;
  lesson: string;
  status: TeachingScheduleStatus;
  note: string;
};

const seedEvents: SeedEvent[] = [
  event("schedule-01", "Tin học ứng dụng", "2026-06-01T07:30:00", "2026-06-01T08:15:00", "ERG Alpha Campus", "", "Lab 2", "Tiết 1", "confirmed"),
  event("schedule-02", "Thực hành Scratch", "2026-06-01T08:20:00", "2026-06-01T09:05:00", "ERG Alpha Campus", "Lớp 6A2", "Lab 2", "Tiết 2", "confirmed"),
  event("schedule-03", "Ôn tập IC3", "2026-06-01T09:20:00", "2026-06-01T10:50:00", "ERG Alpha Campus", "Lớp 7A2", "Lab 1", "Tiết 3-4", "needs-material", "Gắn bộ đề luyện IC3 trước giờ dạy."),
  event("schedule-04", "Kỹ năng số", "2026-06-01T13:30:00", "2026-06-01T15:00:00", "ERG East Learning Point", "Lớp 5C", "Phòng 304", "Tiết 7-8", "confirmed"),
  event("schedule-05", "Lớp MOS buổi tối", "2026-06-01T19:00:00", "2026-06-01T20:45:00", "Lịch cá nhân", "Lớp MOS 1", "Zoom 02", "Ca tối", "confirmed", "Lịch cá nhân của account giáo viên."),
  event("schedule-06", "Word căn bản", "2026-06-02T07:30:00", "2026-06-02T09:00:00", "ERG South Studio", "Lớp 6B1", "Lab 2", "Tiết 1-2", "confirmed", "Chuẩn bị file mẫu."),
  event("schedule-07", "Ôn tập IC3", "2026-06-02T09:15:00", "2026-06-02T10:45:00", "ERG South Studio", "Lớp 7B2", "Lab 1", "Tiết 3-4", "needs-material"),
  event("schedule-08", "Bổ trợ tiếng Anh số", "2026-06-02T11:00:00", "2026-06-02T11:45:00", "ERG Alpha Campus", "Lớp 6A1", "Phòng 201", "Tiết 5", "draft", "Chờ xác nhận phòng."),
  event("schedule-09", "Excel cơ bản", "2026-06-02T13:15:00", "2026-06-02T14:45:00", "ERG Alpha Campus", "Lớp MOS 1", "Lab 4", "Tiết 7-8", "confirmed"),
  event("schedule-10", "Chấm bài dự án", "2026-06-02T20:00:00", "2026-06-02T21:30:00", "Lịch cá nhân", "Lớp MOS 2", "Zoom 03", "Ca tối", "draft"),
  event("schedule-11", "An toàn số", "2026-06-03T07:45:00", "2026-06-03T08:30:00", "ERG East Learning Point", "Lớp 4A", "Phòng 301", "Tiết 1", "confirmed"),
  event("schedule-12", "PowerPoint dự án", "2026-06-03T08:35:00", "2026-06-03T10:05:00", "ERG East Learning Point", "Lớp 5B", "Lab 3", "Tiết 2-3", "confirmed", "Học sinh trình bày nhóm."),
  event("schedule-13", "Kiểm tra nhanh", "2026-06-03T10:20:00", "2026-06-03T11:05:00", "ERG Alpha Campus", "Lớp 6C1", "Lab 2", "Tiết 4", "needs-material", "Cần gắn quiz 15 phút."),
  event("schedule-14", "Kỹ năng số", "2026-06-03T13:30:00", "2026-06-03T15:00:00", "ERG East Learning Point", "Lớp 5C", "Phòng 304", "Tiết 7-8", "confirmed"),
  event("schedule-15", "Họp phân bổ giáo viên", "2026-06-03T16:00:00", "2026-06-03T16:45:00", "Lịch cá nhân", "Tổ Tin học", "Phòng họp 2", "Điều phối", "draft"),
  event("schedule-16", "Tin học ứng dụng", "2026-06-04T07:30:00", "2026-06-04T09:00:00", "ERG Alpha Campus", "Lớp 6C1", "Lab 2", "Tiết 1-2", "confirmed", "Ôn thao tác tệp."),
  event("schedule-17", "MOS Word", "2026-06-04T09:15:00", "2026-06-04T10:45:00", "ERG Alpha Campus", "Lớp MOS 1", "Lab 4", "Tiết 3-4", "confirmed"),
  event("schedule-18", "Bù bài Excel", "2026-06-04T11:00:00", "2026-06-04T11:45:00", "ERG Alpha Campus", "Lớp MOS 1", "Lab 4", "Tiết 5", "draft"),
  event("schedule-19", "Thực hành dự án", "2026-06-04T14:00:00", "2026-06-04T15:30:00", "ERG Alpha Campus", "Lớp 8A", "Lab 3", "Tiết 7-8", "confirmed", "Chuẩn bị rubric."),
  event("schedule-20", "Tư vấn phụ huynh", "2026-06-04T19:30:00", "2026-06-04T20:15:00", "Lịch cá nhân", "Lớp 6A1", "Google Meet", "Ngoài giờ", "draft"),
  event("schedule-21", "Thực hành dự án", "2026-06-05T07:30:00", "2026-06-05T09:00:00", "ERG Alpha Campus", "Lớp 8A", "Lab 3", "Tiết 1-2", "confirmed"),
  event("schedule-22", "Excel nâng cao", "2026-06-05T09:15:00", "2026-06-05T10:45:00", "ERG Alpha Campus", "Lớp MOS 2", "Lab 4", "Tiết 3-4", "confirmed", "Hàm điều kiện."),
  event("schedule-23", "Tạo học liệu", "2026-06-05T11:00:00", "2026-06-05T11:45:00", "ERG Alpha Campus", "Tổ Tin học", "Studio", "Chuẩn bị", "needs-material"),
  event("schedule-24", "Bồi dưỡng học sinh", "2026-06-05T15:45:00", "2026-06-05T17:15:00", "ERG Alpha Campus", "Nhóm nâng cao", "Lab 3", "Tiết 9-10", "draft"),
  event("schedule-25", "Workshop Canva", "2026-06-06T08:30:00", "2026-06-06T10:00:00", "ERG Alpha Campus", "CLB Tin học", "Studio", "Workshop", "confirmed"),
  event("schedule-26", "Bồi dưỡng học sinh", "2026-06-06T14:00:00", "2026-06-06T16:00:00", "Lịch cá nhân", "Nhóm nâng cao", "Zoom 01", "Ca chiều", "confirmed"),
  event("schedule-27", "Tổng kết tuần", "2026-06-07T19:30:00", "2026-06-07T20:30:00", "Lịch cá nhân", "Lớp 6A1", "Zoom 01", "Ca tối", "draft"),
  event("schedule-28", "Kiểm tra học kỳ", "2026-06-10T08:00:00", "2026-06-10T09:30:00", "ERG Alpha Campus", "Lớp 7A2", "Lab 1", "Ca kiểm tra", "needs-material"),
  event("schedule-29", "Dự giờ giáo viên", "2026-06-12T10:00:00", "2026-06-12T11:00:00", "ERG South Studio", "Lớp 6B1", "Lab 2", "Dự giờ", "confirmed"),
  event("schedule-30", "Đào tạo nội bộ", "2026-06-18T14:00:00", "2026-06-18T16:00:00", "Lịch cá nhân", "Giáo viên mới", "Phòng họp 1", "Training", "confirmed"),
  event("schedule-31", "Chốt lịch tháng 7", "2026-06-25T09:00:00", "2026-06-25T10:00:00", "Lịch cá nhân", "Điều phối", "Phòng họp 2", "Kế hoạch", "draft"),
];

export function getTeachingScheduleEvents({
  selectedClass,
  teacherName,
}: {
  selectedClass?: ClassroomSnapshot;
  teacherName: string;
}): TeachingScheduleEvent[] {
  const fallbackClassName = selectedClass?.className ?? "Lớp 6A1";

  return seedEvents.map((eventData) =>
    buildTeachingScheduleEvent({ ...eventData, className: eventData.className || fallbackClassName }, teacherName),
  );
}

export function buildTeachingScheduleEvent(draft: TeachingScheduleDraft, teacherName: string): TeachingScheduleEvent {
  const colors = getTeachingScheduleCalendarColor(draft.school);

  return {
    id: draft.id ?? `schedule-${Date.now()}`,
    title: draft.title,
    start: draft.start,
    end: draft.end,
    ...colors,
    extendedProps: {
      teacher: teacherName,
      school: draft.school,
      className: draft.className,
      room: draft.room,
      lesson: draft.lesson,
      period: `${formatTime(draft.start)} - ${formatTime(draft.end)}`,
      status: draft.status,
      statusLabel: statusLabels[draft.status],
      note: draft.note,
    },
  };
}

function event(
  id: string,
  title: string,
  start: string,
  end: string,
  school: string,
  className: string,
  room: string,
  lesson: string,
  status: TeachingScheduleStatus,
  note = "Lịch thuộc account giáo viên hiện tại.",
): SeedEvent {
  return { id, title, start, end, school, className, room, lesson, status, note };
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}
