import { useMemo, useRef, useState } from "react";
import { Box, Button, Chip, Stack, TextField } from "@mui/material";
import { Download, Search } from "@mui/icons-material";
import { toast } from "sonner";
import * as XLSX from "xlsx";

import type { ClassroomSnapshot, ClassroomStudent } from "@/features/lms/classroom/types/classroom-types";
import { lmsSubjectOptions } from "@/features/lms/components/lms-subject-options";
import { MobileAttendanceSheetPanel } from "@/features/lms/components/attendance/mobile-attendance-sheet-panel";
import { StudentAttendanceContextMenu } from "@/features/lms/components/student-attendance-context-menu";
import { StudentProfileDetailDrawer } from "@/features/lms/classroom/components/student-profile-detail-drawer";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useIsMobile } from "@/hooks/use-mobile";
import { useVirtualList } from "@/hooks/use-virtual-list";

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

type AttendanceSheetPanelProps = {
  selectedClass?: ClassroomSnapshot;
  selectedSchoolName: string;
  students: ClassroomStudent[];
};

const COURSE_START_DATE = "2026-05-29";

export type CurriculumItem = {
  topic: string;
  period: number;
  title: string;
};

const curriculumProgram: CurriculumItem[] = [
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

export function AttendanceSheetPanel({ selectedClass, students }: AttendanceSheetPanelProps) {
  const isMobile = useIsMobile();
  const [attendanceOverrides, setAttendanceOverrides] = useState<Record<string, AttendanceStatus>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState(lmsSubjectOptions[0] ?? "");
  const [selectedDate, setSelectedDate] = useState(getTodayInputDate());
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; student: ClassroomStudent } | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [studentDrafts, setStudentDrafts] = useState<Record<string, { name: string; username: string; password: string; status: string; note: string }>>({});
  const [notice, setNotice] = useState<string | null>(null);
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const debouncedSearchQuery = useDebouncedValue(searchQuery);

  const todayInputDate = getTodayInputDate();
  const dateColumns = useMemo(() => buildAttendanceColumns(selectedDate), [selectedDate]);
  const taughtLessonCount = countLessonsThroughDate(selectedDate);
  const selectedStudent = students.find((s) => s.id === selectedStudentId) ?? null;
  const curriculumTopicSpans = useMemo(() => getCurriculumTopicSpans(curriculumProgram), []);

  const filteredStudents = useMemo(() => {
    if (!debouncedSearchQuery) return students;
    const query = debouncedSearchQuery.toLowerCase();
    return students.filter((s) => s.name.toLowerCase().includes(query));
  }, [students, debouncedSearchQuery]);

  const rowVirtualizer = useVirtualList({
    count: filteredStudents.length,
    estimateSize: 32,
    overscan: 10,
    scrollRef: tableScrollRef,
  });
  const measuredVirtualRows = rowVirtualizer.getVirtualItems();

  function statusFor(studentId: string, studentIndex: number, column: AttendanceColumn, columnIndex: number) {
    if (column.isFutureDate) return "";
    return attendanceOverrides[`${studentId}:${column.id}`] ?? getMockAttendanceStatus(studentIndex, columnIndex);
  }

  function updateAttendance(studentId: string, studentIndex: number, column: AttendanceColumn, columnIndex: number) {
    if (column.isFutureDate) return;
    const currentStatus = statusFor(studentId, studentIndex, column, columnIndex);
    setAttendanceOverrides((current) => ({
      ...current,
      [`${studentId}:${column.id}`]: nextAttendanceStatus(currentStatus),
    }));
  }

  function openStudentDetail(student: ClassroomStudent) {
    setSelectedStudentId(student.id);
    setStudentDrafts((current) => ({
      ...current,
      [student.id]: current[student.id] ?? createStudentDraft(student),
    }));
  }

  function exportXlsx() {
    const header = ["STT", "Học sinh", "Tổng vắng", ...dateColumns.map((col) => `${col.day} ${col.date} ${col.session}`)];
    const rows = filteredStudents.map((student, idx) => {
      const statuses = dateColumns.map((col, cIdx) => statusFor(student.id, idx, col, cIdx));
      const summary = attendanceSummary(statuses);
      return [String(idx + 1), student.name, String(summary.absent), ...statuses.map((s) => attendanceText(s))];
    });
    const worksheet = XLSX.utils.aoa_to_sheet([header, ...rows]);
    worksheet["!cols"] = [{ wch: 6 }, { wch: 28 }, { wch: 10 }, ...dateColumns.map(() => ({ wch: 18 }))];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Điểm danh");
    XLSX.writeFile(workbook, `diem-danh-${selectedClass?.className ?? "lop"}-${selectedDate}.xlsx`);
  }

  function showAction(message: string) {
    setNotice(message);
    toast.info(message);
  }

  if (isMobile) {
    return (
      <>
        <MobileAttendanceSheetPanel
          attendanceSummary={attendanceSummary}
          curriculumProgram={curriculumProgram}
          exportXlsx={exportXlsx}
          filteredStudents={filteredStudents}
          getStatus={(sid, si, col, ci) => statusFor(sid, si, col, ci)}
          onOpenStudentDetail={openStudentDetail}
          onSearchQueryChange={setSearchQuery}
          onSelectedDateChange={(v) => setSelectedDate(clampInputDateToToday(v))}
          onSetAttendanceStatus={(sid, cid, s) => setAttendanceOverrides((c) => ({ ...c, [`${sid}:${cid}`]: s }))}
          searchQuery={searchQuery}
          selectedClass={selectedClass}
          selectedDate={selectedDate}
          todayInputDate={todayInputDate}
          taughtLessonCount={taughtLessonCount}
          visibleColumns={dateColumns}
        />
        {selectedStudent && (
          <StudentProfileDetailDrawer
            draft={studentDrafts[selectedStudent.id] ?? createStudentDraft(selectedStudent)}
            onClose={() => setSelectedStudentId(null)}
            onUpdate={(patch) => setStudentDrafts((c) => ({ ...c, [selectedStudent.id]: { ...c[selectedStudent.id], ...patch } }))}
            onStatusChange={(status) => setStudentDrafts((c) => ({ ...c, [selectedStudent.id]: { ...c[selectedStudent.id], status } }))}
            statusOptions={[
              { label: "Vượt tiến độ", value: "ahead" },
              { label: "Ổn định", value: "steady" },
              { label: "Cần hỗ trợ", value: "support" },
            ]}
            statusValue={(studentDrafts[selectedStudent.id] ?? createStudentDraft(selectedStudent)).status}
            student={selectedStudent}
          />
        )}
      </>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0, padding: 16, gap: 16 }}>
      {/* Header */}
      <div style={{
        padding: 16,
        borderRadius: 8,
        backgroundColor: "white",
        border: "1px solid #e5e7eb",
      }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 16 }}>
          {/* Left info */}
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 14, color: "#696CFF", fontStyle: "italic" }}>
              Gv phụ trách: <strong>{selectedClass?.homeroomTeacher ?? ""}</strong>
            </div>
            <div style={{ fontSize: 13, color: "#6b7280" }}>
              Số tiết đã dạy: <strong style={{ color: "#ef4444" }}>{taughtLessonCount}</strong>
            </div>
          </div>

          {notice && (
            <div style={{
              fontSize: 13,
              color: "#696CFF",
              fontWeight: 600,
              padding: "4px 12px",
              backgroundColor: "#EEF2FF",
              borderRadius: 4,
            }}>
              {notice}
            </div>
          )}

          <Stack direction="row" spacing={1.5} sx={{ flexWrap: "wrap" }}>
            <TextField
              size="small"
              placeholder="Tìm học sinh"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: <Search sx={{ fontSize: 18, color: "#696CFF" }} />,
                },
              }}
              sx={{ minWidth: 180 }}
            />

            <TextField
              size="small"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(clampInputDateToToday(e.target.value))}
              sx={{ minWidth: 140 }}
            />

            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              style={{
                height: 40,
                padding: "0 12px",
                borderRadius: 8,
                border: "1px solid #e5e7eb",
                fontSize: 14,
                minWidth: 140,
              }}
            >
              {lmsSubjectOptions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <Button
              variant="contained"
              startIcon={<Download sx={{ fontSize: 18 }} />}
              onClick={exportXlsx}
              sx={{
                borderRadius: 1.5,
                textTransform: "none",
                fontWeight: 600,
                backgroundColor: "#696CFF",
                "&:hover": { backgroundColor: "#5a5ce6" },
              }}
            >
              Xuất Excel
            </Button>
          </Stack>
        </div>
      </div>

      {/* Legend */}
      <Stack direction="row" spacing={1} sx={{ px: 2 }}>
        <Chip label="Có mặt ✓" size="small" sx={{ bgcolor: "#dcfce7", color: "#16a34a", fontSize: 11 }} />
        <Chip label="Đi muộn M" size="small" sx={{ bgcolor: "#fef3c7", color: "#d97706", fontSize: 11 }} />
        <Chip label="Vắng V" size="small" sx={{ bgcolor: "#fee2e2", color: "#dc2626", fontSize: 11 }} />
        <Chip label="Có phép P" size="small" sx={{ bgcolor: "#EEF2FF", color: "#4f46e5", fontSize: 11 }} />
      </Stack>

      <Box
        sx={{
          display: "grid",
          flex: 1,
          gap: 2,
          gridTemplateColumns: { lg: "minmax(0, 1fr) minmax(430px, 500px)", xl: "minmax(0, 1fr) minmax(500px, 560px)", xs: "1fr" },
          minHeight: 0,
        }}
      >
        {/* Table Container */}
        <div
          ref={tableScrollRef}
          style={{
            minHeight: 0,
            overflow: "auto",
            backgroundColor: "white",
            border: "1px solid #e5e7eb",
            borderRadius: 8,
          }}
        >
          <table style={{
            width: "100%",
            minWidth: 800,
            borderCollapse: "collapse",
            fontSize: 13,
            fontFamily: "inherit",
          }}>
            <thead style={{ position: "sticky", top: 0, zIndex: 10 }}>
              <tr style={{ backgroundColor: "#f8fafc" }}>
                <th style={thStyle(40)}>STT</th>
                <th style={thStyle(180)}>Học sinh</th>
                <th style={thStyle(56)}>Vắng</th>
                {dateColumns.map((col) => (
                  <th
                    key={col.id}
                    style={{
                      ...thStyle(44),
                      backgroundColor: col.isFocusDate ? "#EEF2FF" : "#f8fafc",
                      borderLeft: col.isFocusDate ? "2px solid #696CFF" : "none",
                    }}
                  >
                    <div style={{ fontSize: 11, fontWeight: 700 }}>{col.day}</div>
                    <div style={{ fontSize: 10, fontWeight: 500, color: "#6b7280" }}>{col.date}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {measuredVirtualRows.map((virtualRow) => {
                const idx = virtualRow.index;
                const student = filteredStudents[idx];
                if (!student) return null;

                const statuses = dateColumns.map((col, cIdx) => statusFor(student.id, idx, col, cIdx));
                const summary = attendanceSummary(statuses);

                return (
                  <tr
                    key={student.id}
                    style={{
                      height: virtualRow.end - virtualRow.start,
                    }}
                  >
                    <td style={tdStyle(40, "center")}>{idx + 1}</td>
                    <td style={tdStyle(180)}>
                      <button
                        onClick={() => openStudentDetail(student)}
                        onContextMenu={(e) => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, student }); }}
                        style={{
                          background: "none",
                          border: "none",
                          padding: 0,
                          fontSize: 13,
                          fontWeight: 600,
                          color: "#696CFF",
                          cursor: "pointer",
                          textAlign: "left",
                        }}
                      >
                        {studentDrafts[student.id]?.name ?? student.name}
                      </button>
                    </td>
                    <td style={tdStyle(56, "center")}>
                      <span style={{
                        display: "inline-block",
                        padding: "2px 8px",
                        borderRadius: 12,
                        fontSize: 12,
                        fontWeight: 700,
                        backgroundColor: summary.absent ? "#fee2e2" : "#dcfce7",
                        color: summary.absent ? "#dc2626" : "#16a34a",
                      }}>
                        {summary.absent}
                      </span>
                    </td>
                    {dateColumns.map((col, cIdx) => {
                      const status = statuses[cIdx];
                      return (
                        <td
                          key={col.id}
                          style={{
                            ...tdStyle(44, "center"),
                            backgroundColor: getAttendanceBgColor(status, col.isFocusDate),
                            borderLeft: col.isFocusDate ? "2px solid #696CFF" : "none",
                            cursor: col.isFutureDate ? "not-allowed" : "pointer",
                          }}
                        >
                          <button
                            onClick={() => updateAttendance(student.id, idx, col, cIdx)}
                            disabled={col.isFutureDate}
                            style={{
                              width: "100%",
                              height: 28,
                              border: "none",
                              borderRadius: 4,
                              backgroundColor: "transparent",
                              cursor: col.isFutureDate ? "not-allowed" : "pointer",
                              fontSize: 13,
                              fontWeight: 700,
                              color: getAttendanceTextColor(status),
                            }}
                          >
                            {attendanceLabel(status)}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Curriculum Panel */}
        <div
          style={{
            minHeight: 0,
            backgroundColor: "white",
            border: "1px solid #D9E2EF",
            borderRadius: 10,
            boxShadow: "0 10px 26px rgba(15,23,42,0.04)",
            overflow: "auto",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, color: "#1C252E" }}>
            <thead>
              <tr>
                <th colSpan={3} style={curriculumTitleCellStyle}>
                  KHUNG CHƯƠNG TRÌNH TIN HỌC QUỐC TẾ
                </th>
              </tr>
              <tr>
                <th colSpan={3} style={curriculumSubtitleCellStyle}>
                  {selectedSubject} LEVEL 3 - TIN HỌC 8
                </th>
              </tr>
              <tr>
                <th style={curriculumHeadCellStyle("27%")}>Chủ đề</th>
                <th style={curriculumHeadCellStyle(44)}>Tiết</th>
                <th style={curriculumHeadCellStyle()}>Tên bài học</th>
              </tr>
            </thead>
            <tbody>
              {curriculumProgram.map((item, index) => {
                const isCurrent = item.period === taughtLessonCount;
                const isDone = item.period < taughtLessonCount;
                const showTopicCell = curriculumTopicSpans.firstRows.get(item.topic) === index;
                return (
                  <tr
                    key={item.period}
                    style={{
                      backgroundColor: isCurrent ? "#F3F4FF" : isDone ? "#F8FAFC" : "white",
                    }}
                  >
                    {showTopicCell ? (
                      <td rowSpan={curriculumTopicSpans.counts.get(item.topic)} style={curriculumTopicCellStyle}>
                        {item.topic}
                      </td>
                    ) : null}
                    <td
                      style={{
                        ...curriculumBodyCellStyle("center"),
                        backgroundColor: isCurrent ? "#696CFF" : undefined,
                        borderColor: isCurrent ? "#696CFF" : "#D9E2EF",
                        color: isCurrent ? "#FFFFFF" : undefined,
                        fontWeight: isCurrent ? 800 : 400,
                      }}
                    >
                      {item.period}
                    </td>
                    <td
                      style={{
                        ...curriculumBodyCellStyle("left"),
                        backgroundColor: isCurrent ? "#EEF0FF" : undefined,
                        border: isCurrent ? "2px solid #696CFF" : "1px solid #D9E2EF",
                        color: isCurrent ? "#3033B8" : undefined,
                        fontStyle: isCurrent ? "italic" : undefined,
                        fontWeight: isCurrent ? 800 : 400,
                      }}
                    >
                      {item.title}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Box>

      {/* Context Menu */}
      <StudentAttendanceContextMenu
        menu={contextMenu}
        onClose={() => setContextMenu(null)}
        onAddStudent={() => showAction("Đã mở thao tác thêm học sinh mới")}
        onAddNote={(student) => showAction(`Đã thêm note nhanh cho ${student.name}`)}
        onChangeStatus={(student) => {
          const statuses = ["ahead", "steady", "support"] as const;
          const current = (studentDrafts[student.id]?.status ?? student.status) as typeof statuses[number];
          const next = statuses[(statuses.indexOf(current) + 1) % statuses.length];
          setStudentDrafts((c) => ({ ...c, [student.id]: { ...c[student.id], status: next } }));
          showAction(`Đã đổi trạng thái ${student.name}`);
        }}
        onOpenNote={(student) => openStudentDetail(student)}
      />

      {/* Student Detail Drawer */}
      {selectedStudent && (
        <StudentProfileDetailDrawer
          draft={studentDrafts[selectedStudent.id] ?? createStudentDraft(selectedStudent)}
          onClose={() => setSelectedStudentId(null)}
          onUpdate={(patch) => setStudentDrafts((c) => ({ ...c, [selectedStudent.id]: { ...c[selectedStudent.id], ...patch } }))}
          onStatusChange={(status) => setStudentDrafts((c) => ({ ...c, [selectedStudent.id]: { ...c[selectedStudent.id], status } }))}
          statusOptions={[
            { label: "Vượt tiến độ", value: "ahead" },
            { label: "Ổn định", value: "steady" },
            { label: "Cần hỗ trợ", value: "support" },
          ]}
          statusValue={(studentDrafts[selectedStudent.id] ?? createStudentDraft(selectedStudent)).status}
          student={selectedStudent}
        />
      )}
    </div>
  );
}

const thStyle = (width?: string | number) => ({
  padding: "8px 4px",
  border: "1px solid #e5e7eb",
  borderTop: "none",
  fontSize: 11,
  fontWeight: 700,
  textAlign: "center" as const,
  position: "sticky" as const,
  top: 0,
  zIndex: 1,
  width,
});

const tdStyle = (width?: string | number, textAlign: "left" | "center" = "left") => ({
  padding: "4px",
  border: "1px solid #e5e7eb",
  textAlign,
  width,
});

const curriculumTitleCellStyle = {
  background: "linear-gradient(180deg, #FFFFFF 0%, #F7F8FF 100%)",
  border: "1px solid #D9E2EF",
  color: "#1C252E",
  fontSize: 15,
  fontWeight: 800,
  lineHeight: "22px",
  padding: "7px 10px 4px",
  textAlign: "center" as const,
};

const curriculumSubtitleCellStyle = {
  ...curriculumTitleCellStyle,
  fontSize: 14,
};

const curriculumHeadCellStyle = (width?: string | number) => ({
  backgroundColor: "#F4F6F8",
  border: "1px solid #D9E2EF",
  color: "#52616F",
  fontSize: 12,
  fontWeight: 700,
  lineHeight: "18px",
  padding: "2px 6px",
  textAlign: "center" as const,
  width,
});

const curriculumTopicCellStyle = {
  backgroundColor: "#FBFCFF",
  border: "1px solid #D9E2EF",
  color: "#334155",
  fontSize: 12,
  fontWeight: 700,
  lineHeight: "18px",
  padding: "2px 6px",
  textAlign: "center" as const,
  verticalAlign: "middle" as const,
  width: "27%",
};

const curriculumBodyCellStyle = (textAlign: "left" | "center") => ({
  border: "1px solid #D9E2EF",
  color: "#334155",
  fontSize: 12,
  fontWeight: 600,
  lineHeight: "17px",
  padding: "1px 5px",
  textAlign,
  verticalAlign: "middle" as const,
});

function getCurriculumTopicSpans(items: CurriculumItem[]) {
  const counts = new Map<string, number>();
  const firstRows = new Map<string, number>();
  items.forEach((item, index) => {
    counts.set(item.topic, (counts.get(item.topic) ?? 0) + 1);
    if (!firstRows.has(item.topic)) firstRows.set(item.topic, index);
  });
  return { counts, firstRows };
}

function buildAttendanceColumns(focusDateValue: string): AttendanceColumn[] {
  const focusDate = minDate(parseDateInput(focusDateValue), todayStart());
  const startDate = addDays(focusDate, -3);
  const attendedDayCount = daysBetween(startDate, focusDate) + 1;
  const attendedColumns = Array.from({ length: attendedDayCount }).flatMap((_, idx) =>
    buildAttendanceColumnsForDate(addDays(startDate, idx), focusDate),
  );
  const futureColumns: AttendanceColumn[] = [];
  for (let offset = 1; futureColumns.length < 5; offset += 1) {
    const currentDate = addDays(focusDate, offset);
    const nextColumns = buildAttendanceColumnsForDate(currentDate, focusDate);
    const availableSlots = 5 - futureColumns.length;
    futureColumns.push(...nextColumns.slice(0, availableSlots));
  }
  return [...attendedColumns, ...futureColumns];
}

function buildAttendanceColumnsForDate(currentDate: Date, focusDate: Date): AttendanceColumn[] {
  const id = formatInputDate(currentDate);
  return lessonsForDate(currentDate).map((session, lessonIdx) => ({
    id: `${id}-${lessonIdx + 1}`,
    day: weekdayLabel(currentDate),
    date: formatShortDate(currentDate),
    fullDate: formatFullDate(currentDate),
    isFocusDate: isSameDate(currentDate, focusDate),
    isFutureDate: currentDate > todayStart(),
    lessonIndex: lessonIdx + 1,
    session,
  }));
}

function lessonsForDate(date: Date): string[] {
  const day = date.getDay();
  if (day === 0) return ["Tiết 1"];
  if (day === 2 || day === 4 || day === 6) return ["Tiết 1", "Tiết 2"];
  return ["Tiết 1"];
}

function countLessonsThroughDate(selectedDateValue: string) {
  const startDate = parseDateInput(COURSE_START_DATE);
  const endDate = minDate(parseDateInput(selectedDateValue), todayStart());
  if (endDate < startDate) return 0;
  let total = 0;
  for (let currentDate = new Date(startDate); currentDate <= endDate; currentDate = addDays(currentDate, 1)) {
    total += lessonsForDate(currentDate).length;
  }
  return total;
}

function getMockAttendanceStatus(studentIndex: number, columnIndex: number): AttendanceStatus {
  if ((studentIndex + columnIndex) % 17 === 0) return "late";
  if ((studentIndex * 3 + columnIndex) % 23 === 0) return "absent";
  if ((studentIndex + columnIndex * 2) % 29 === 0) return "excused";
  return "present";
}

function nextAttendanceStatus(status: AttendanceStatus): AttendanceStatus {
  if (status === "present") return "late";
  if (status === "late") return "absent";
  if (status === "absent") return "excused";
  return "present";
}

function attendanceLabel(status: AttendanceStatus) {
  if (!status) return "—";
  if (status === "absent") return "V";
  if (status === "late") return "M";
  if (status === "excused") return "P";
  return "✓";
}

function attendanceText(status: AttendanceStatus) {
  if (!status) return "Chưa điểm danh";
  if (status === "absent") return "Vắng";
  if (status === "late") return "Đi muộn";
  if (status === "excused") return "Có phép";
  return "Có mặt";
}

function getAttendanceBgColor(status: AttendanceStatus, isFocusDate: boolean) {
  if (!status) return isFocusDate ? "#f9fafb" : "white";
  switch (status) {
    case "present": return "#dcfce7";
    case "late": return "#fef3c7";
    case "absent": return "#fee2e2";
    case "excused": return "#EEF2FF";
    default: return "white";
  }
}

function getAttendanceTextColor(status: AttendanceStatus) {
  if (!status) return "#9ca3af";
  switch (status) {
    case "present": return "#16a34a";
    case "late": return "#d97706";
    case "absent": return "#dc2626";
    case "excused": return "#4f46e5";
    default: return "#374151";
  }
}

function attendanceSummary(statuses: AttendanceStatus[]) {
  const absent = statuses.filter((s) => s === "absent").length;
  const present = statuses.filter((s) => s === "present" || s === "late").length;
  return { absent, present, total: statuses.length };
}

function createStudentDraft(student: ClassroomStudent) {
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

function getTodayInputDate() {
  return formatInputDate(todayStart());
}

function clampInputDateToToday(value: string) {
  return formatInputDate(minDate(parseDateInput(value), todayStart()));
}

function minDate(firstDate: Date, secondDate: Date) {
  return firstDate <= secondDate ? firstDate : secondDate;
}

function isSameDate(firstDate: Date, secondDate: Date) {
  return formatInputDate(firstDate) === formatInputDate(secondDate);
}

function daysBetween(startDate: Date, endDate: Date) {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.max(0, Math.round((endDate.getTime() - startDate.getTime()) / msPerDay));
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
  const labels = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  return labels[date.getDay()];
}
