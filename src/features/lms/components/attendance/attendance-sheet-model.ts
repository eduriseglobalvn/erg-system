import type { ClassroomStudent } from "@/features/lms/classroom/types/classroom-types";
import type { CurriculumTreeSubject } from "@/features/lms/api/curriculum-tree-api";

export type AttendanceStatus = "present" | "absent" | "late" | "excused" | "";

export type AttendanceColumn = {
  id: string;
  day: string;
  date: string;
  fullDate: string;
  isFocusDate: boolean;
  isFutureDate: boolean;
  lessonIndex: number;
  session: string;
};

export type CurriculumItem = { topic: string; period: number; title: string };
export type CurriculumTeachingPlan = { startDate: string; teachingDays: number[]; sessionsPerDay: number };

export type AttendanceStudentDraft = {
  name: string;
  username: string;
  password: string;
  status: string;
  note: string;
};

export const DEFAULT_TEACHING_PLAN: CurriculumTeachingPlan = {
  startDate: "2026-05-29",
  teachingDays: [2, 4, 6],
  sessionsPerDay: 2,
};

export const curriculumProgram: CurriculumItem[] = [
  { topic: "Căn bản về công nghệ", period: 1, title: "Bài 1: Xác định yêu cầu hệ thống và yêu cầu phần mềm" },
  { topic: "Căn bản về công nghệ", period: 2, title: "Bài 1: Xác định yêu cầu hệ thống và yêu cầu phần mềm" },
  { topic: "Căn bản về công nghệ", period: 3, title: "Bài 2: Khắc phục sự cố máy tính" },
  { topic: "Căn bản về công nghệ", period: 4, title: "Bài 2: Khắc phục sự cố máy tính" },
  { topic: "Căn bản về công nghệ", period: 5, title: "Bài 3: Cấp phép phần mềm" },
  { topic: "Căn bản về công nghệ", period: 6, title: "Bài 4: Cài đặt mặc định phần mềm" },
  { topic: "Căn bản về công nghệ", period: 7, title: "Ôn tập 1" },
  { topic: "Công dân số", period: 8, title: "Bài 5: Báo cáo hành vi gây hại (1)" },
  { topic: "Công dân số", period: 9, title: "Bài 6: Báo cáo hành vi gây hại (2)" },
  { topic: "Công dân số", period: 10, title: "Bài 7: Một số hành vi bất hợp pháp trên môi trường kĩ thuật số" },
  { topic: "Công dân số", period: 11, title: "Bài 7: Một số hành vi bất hợp pháp trên môi trường kĩ thuật số" },
  { topic: "Công dân số", period: 12, title: "Bài 8: Cập nhật kiến thức kĩ thuật số (1)" },
  { topic: "Công dân số", period: 13, title: "Bài 9: Cập nhật kiến thức kĩ thuật số (2)" },
  { topic: "Công dân số", period: 14, title: "Ôn tập 2" },
  { topic: "Quản lý thông tin", period: 15, title: "Bài 10: Thu hẹp phạm vi tìm kiếm (1)" },
  { topic: "Quản lý thông tin", period: 16, title: "Bài 10: Thu hẹp phạm vi tìm kiếm (1)" },
  { topic: "Quản lý thông tin", period: 17, title: "Bài 11: Thu hẹp phạm vi tìm kiếm (2)" },
  { topic: "Quản lý thông tin", period: 18, title: "Bài 12: Đánh giá thông tin (1)" },
  { topic: "Quản lý thông tin", period: 19, title: "Bài 13: Đánh giá thông tin (2)" },
  { topic: "Quản lý thông tin", period: 20, title: "Ôn tập 3" },
  { topic: "Sáng tạo nội dung", period: 21, title: "Bài 14: Làm việc với phương tiện truyền thông kĩ thuật số" },
  { topic: "Sáng tạo nội dung", period: 22, title: "Bài 14: Làm việc với phương tiện truyền thông kĩ thuật số" },
  { topic: "Sáng tạo nội dung", period: 23, title: "Bài 15: Sử dụng dữ liệu trực quan (1)" },
  { topic: "Sáng tạo nội dung", period: 24, title: "Bài 16: Sử dụng dữ liệu trực quan (2)" },
  { topic: "Sáng tạo nội dung", period: 25, title: "Bài 17: Quản lí thông tin kĩ thuật số" },
  { topic: "Sáng tạo nội dung", period: 26, title: "Bài 18: Khả năng tiếp cận" },
  { topic: "Sáng tạo nội dung", period: 27, title: "Bài 18: Khả năng tiếp cận" },
  { topic: "Sáng tạo nội dung", period: 28, title: "Bài 19: Hiểu về sở hữu trí tuệ" },
  { topic: "Sáng tạo nội dung", period: 29, title: "Bài 20: Bảo vệ sở hữu trí tuệ (1)" },
  { topic: "Sáng tạo nội dung", period: 30, title: "Bài 21: Bảo vệ sở hữu trí tuệ (2)" },
  { topic: "Sáng tạo nội dung", period: 31, title: "Bài 22: Lập kế hoạch cho một dự án kĩ thuật số" },
  { topic: "Sáng tạo nội dung", period: 32, title: "Bài 22: Lập kế hoạch cho một dự án kĩ thuật số" },
  { topic: "Sáng tạo nội dung", period: 33, title: "Ôn tập 4" },
  { topic: "Giao tiếp kỹ thuật số", period: 34, title: "Bài 23: Sự mơ hồ (Ambiguity) trong giao tiếp kĩ thuật số" },
  { topic: "Giao tiếp kỹ thuật số", period: 35, title: "Bài 24: Giao tiếp kĩ thuật số để giải quyết vấn đề (1)" },
  { topic: "Giao tiếp kỹ thuật số", period: 36, title: "Bài 25: Giao tiếp kĩ thuật số để giải quyết vấn đề (2)" },
  { topic: "Giao tiếp kỹ thuật số", period: 37, title: "Bài 26: Tương tác phù hợp khi giao tiếp trên môi trường kĩ thuật số" },
  { topic: "Cộng tác", period: 38, title: "Bài 27: Cộng tác để giải quyết vấn đề" },
  { topic: "Cộng tác", period: 39, title: "Bài 27: Cộng tác để giải quyết vấn đề" },
  { topic: "Cộng tác", period: 40, title: "Bài 28: Đóng góp vào các dự án (1)" },
  { topic: "Cộng tác", period: 41, title: "Bài 29: Đóng góp vào các dự án (2)" },
  { topic: "Cộng tác", period: 42, title: "Ôn tập 5" },
  { topic: "An toàn và bảo mật", period: 43, title: "Bài 30: Bảo mật thiết bị của bạn" },
  { topic: "An toàn và bảo mật", period: 44, title: "Bài 30: Bảo mật thiết bị của bạn" },
  { topic: "An toàn và bảo mật", period: 45, title: "Bài 31: Dấu hiệu nhận biết và các phần mềm chống Virus (1)" },
  { topic: "An toàn và bảo mật", period: 46, title: "Bài 32: Dấu hiệu nhận biết và các phần mềm chống Virus (2)" },
  { topic: "An toàn và bảo mật", period: 47, title: "Bài 33: Đặt lại thiết bị" },
  { topic: "An toàn và bảo mật", period: 48, title: "Bài 34: Tác động của các công cụ và công nghệ kĩ thuật số (1)" },
  { topic: "An toàn và bảo mật", period: 49, title: "Bài 35: Tác động của các công cụ và công nghệ kĩ thuật số (2)" },
  { topic: "An toàn và bảo mật", period: 50, title: "Ôn tập 6" },
  { topic: "Tăng cường", period: 51, title: "Ôn tập" },
  { topic: "Tăng cường", period: 52, title: "Ôn tập" },
  { topic: "Tăng cường", period: 53, title: "Ôn tập" },
  { topic: "Tăng cường", period: 54, title: "Ôn tập" },
  { topic: "Tăng cường", period: 55, title: "Ôn tập" },
  { topic: "Tăng cường", period: 56, title: "Ôn tập" },
  { topic: "Tăng cường", period: 57, title: "Ôn tập" },
  { topic: "Tăng cường", period: 58, title: "Luyện thi" },
  { topic: "Tăng cường", period: 59, title: "Luyện thi" },
  { topic: "Tăng cường", period: 60, title: "Luyện thi" },
];

export function curriculumProgramFromTree(subject?: CurriculumTreeSubject): CurriculumItem[] {
  if (!subject) return [];
  let period = 0;
  return [...subject.levels]
    .sort((left, right) => (left.level.sortOrder ?? 0) - (right.level.sortOrder ?? 0))
    .flatMap((level) => [...level.topics]
      .sort((left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0))
      .map((topic) => ({ topic: level.level.name, period: ++period, title: topic.name })));
}

export function getCurriculumTopicSpans(items: CurriculumItem[]) {
  const counts = new Map<string, number>();
  const firstRows = new Map<string, number>();
  items.forEach((item, index) => {
    counts.set(item.topic, (counts.get(item.topic) ?? 0) + 1);
    if (!firstRows.has(item.topic)) firstRows.set(item.topic, index);
  });
  return { counts, firstRows };
}

export function buildAttendanceColumns(focusDateValue: string): AttendanceColumn[] {
  const focusDate = minDate(parseDateInput(focusDateValue), todayStart());
  const startDate = addDays(focusDate, -3);
  const attendedDayCount = daysBetween(startDate, focusDate) + 1;
  const attendedColumns = Array.from({ length: attendedDayCount }).flatMap((_, index) =>
    buildAttendanceColumnsForDate(addDays(startDate, index), focusDate),
  );
  const futureColumns: AttendanceColumn[] = [];
  for (let offset = 1; futureColumns.length < 5; offset += 1) {
    const nextColumns = buildAttendanceColumnsForDate(addDays(focusDate, offset), focusDate);
    futureColumns.push(...nextColumns.slice(0, 5 - futureColumns.length));
  }
  return [...attendedColumns, ...futureColumns];
}

function buildAttendanceColumnsForDate(currentDate: Date, focusDate: Date): AttendanceColumn[] {
  const id = formatInputDate(currentDate);
  return lessonsForDate(currentDate).map((session, lessonIndex) => ({
    id: `${id}-${lessonIndex + 1}`,
    day: weekdayLabel(currentDate),
    date: formatShortDate(currentDate),
    fullDate: formatFullDate(currentDate),
    isFocusDate: isSameDate(currentDate, focusDate),
    isFutureDate: currentDate > todayStart(),
    lessonIndex: lessonIndex + 1,
    session,
  }));
}

function lessonsForDate(date: Date): string[] {
  const day = date.getDay();
  if (day === 0) return ["Tiết 1"];
  if (day === 2 || day === 4 || day === 6) return ["Tiết 1", "Tiết 2"];
  return ["Tiết 1"];
}

export function countLessonsThroughDate(selectedDateValue: string, plan = DEFAULT_TEACHING_PLAN) {
  const startDate = parseDateInput(plan.startDate);
  const endDate = minDate(parseDateInput(selectedDateValue), todayStart());
  if (endDate < startDate) return 0;
  let total = 0;
  for (let currentDate = new Date(startDate); currentDate <= endDate; currentDate = addDays(currentDate, 1)) {
    total += plan.teachingDays.includes(currentDate.getDay()) ? plan.sessionsPerDay : 0;
  }
  return total;
}

export function getMockAttendanceStatus(studentIndex: number, columnIndex: number): AttendanceStatus {
  if ((studentIndex + columnIndex) % 17 === 0) return "late";
  if ((studentIndex * 3 + columnIndex) % 23 === 0) return "absent";
  if ((studentIndex + columnIndex * 2) % 29 === 0) return "excused";
  return "present";
}

export function nextAttendanceStatus(status: AttendanceStatus): Exclude<AttendanceStatus, ""> {
  if (status === "present") return "late";
  if (status === "late") return "absent";
  if (status === "absent") return "excused";
  return "present";
}

export function attendanceLabel(status: AttendanceStatus) {
  if (!status) return "—";
  if (status === "absent") return "V";
  if (status === "late") return "M";
  if (status === "excused") return "P";
  return "✓";
}

export function attendanceText(status: AttendanceStatus) {
  if (!status) return "Chưa điểm danh";
  if (status === "absent") return "Vắng";
  if (status === "late") return "Đi muộn";
  if (status === "excused") return "Có phép";
  return "Có mặt";
}

export function getAttendanceBgColor(status: AttendanceStatus, isFocusDate: boolean) {
  if (!status) return isFocusDate ? "#f9fafb" : "white";
  const colors = { present: "#dcfce7", late: "#fef3c7", absent: "#fee2e2", excused: "#EEF2FF" };
  return colors[status];
}

export function getAttendanceTextColor(status: AttendanceStatus) {
  if (!status) return "#9ca3af";
  const colors = { present: "#16a34a", late: "#d97706", absent: "#dc2626", excused: "#4f46e5" };
  return colors[status];
}

export function attendanceSummary(statuses: AttendanceStatus[]) {
  const absent = statuses.filter((status) => status === "absent").length;
  const present = statuses.filter((status) => status === "present" || status === "late").length;
  return { absent, present, total: statuses.length };
}

export function createAttendanceStudentDraft(student: ClassroomStudent): AttendanceStudentDraft {
  return {
    name: student.name,
    username: student.name.toLowerCase().replace(/[^a-z0-9]+/g, "."),
    password: `${student.avatarSeed.toLowerCase()}@2026`,
    status: student.status,
    note: student.mentorNote,
  };
}

function parseDateInput(value: string) {
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function todayStart() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

export function getTodayInputDate() {
  return formatInputDate(todayStart());
}

export function clampInputDateToToday(value: string) {
  return formatInputDate(minDate(parseDateInput(value), todayStart()));
}

function minDate(firstDate: Date, secondDate: Date) {
  return firstDate <= secondDate ? firstDate : secondDate;
}

function isSameDate(firstDate: Date, secondDate: Date) {
  return formatInputDate(firstDate) === formatInputDate(secondDate);
}

function daysBetween(startDate: Date, endDate: Date) {
  return Math.max(0, Math.round((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)));
}

function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function formatInputDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatShortDate(date: Date) {
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatFullDate(date: Date) {
  return `${formatShortDate(date)}/${date.getFullYear()}`;
}

function weekdayLabel(date: Date) {
  return ["CN", "T2", "T3", "T4", "T5", "T6", "T7"][date.getDay()];
}
