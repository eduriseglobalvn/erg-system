import { useMemo, useState } from "react";
import DownloadIcon from "@mui/icons-material/Download";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Typography from "@mui/material/Typography";
import { alpha, type Theme } from "@mui/material/styles";

import { ErgButton, ErgIconButton, ErgSearchField } from "@/components/erg-mui";
import type { ClassroomSnapshot, ClassroomStudent } from "@/domain/school/classroom-types";
import {
  attendanceLabel,
  attendanceText,
  bulkPresentTargets,
  nextAttendanceStatus,
  type AttendanceColumn,
  type AttendanceStatus,
  type CurriculumItem,
} from "@/features/lms/components/attendance/attendance-sheet-model";
import { formatDateVi } from "@/domain/formatters/format-date";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";
import { AttendanceDateField } from "./attendance-date-field";

type MobileAttendanceMode = "today" | "week" | "program";

type MobileAttendanceSheetPanelProps = {
  attendanceSummary: (statuses: AttendanceStatus[]) => { absent: number; present: number; total: number };
  curriculumProgram: CurriculumItem[];
  exportXlsx: () => void;
  filteredStudents: ClassroomStudent[];
  getStatus: (studentId: string, studentIndex: number, column: AttendanceColumn, columnIndex: number) => AttendanceStatus;
  onOpenStudentDetail: (student: ClassroomStudent) => void;
  onSearchQueryChange: (value: string) => void;
  onSelectedDateChange: (value: string) => void;
  onSetAttendanceStatus: (studentId: string, columnId: string, status: AttendanceStatus) => void;
  offlinePending?: boolean;
  searchQuery: string;
  selectedClass?: ClassroomSnapshot;
  selectedDate: string;
  todayInputDate: string;
  taughtLessonCount: number;
  visibleColumns: AttendanceColumn[];
};

const primaryTint = (theme: Theme) => alpha(theme.palette.primary.main, 0.1);
const cardSx = { border: 1, borderColor: "divider", borderRadius: 2, bgcolor: "background.paper", boxShadow: ergEnterpriseTokens.shadow.sm } as const;
const gridCellSx = { borderBottom: 1, borderRight: 1, borderColor: "divider" } as const;
const lineClamp2 = { display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" } as const;

export function MobileAttendanceSheetPanel({
  attendanceSummary,
  curriculumProgram,
  exportXlsx,
  filteredStudents,
  getStatus,
  onOpenStudentDetail,
  onSearchQueryChange,
  onSelectedDateChange,
  onSetAttendanceStatus,
  offlinePending,
  searchQuery,
  selectedClass,
  selectedDate,
  taughtLessonCount,
  todayInputDate,
  visibleColumns,
}: MobileAttendanceSheetPanelProps) {
  const [mode, setMode] = useState<MobileAttendanceMode>("today");
  const focusColumns = useMemo(() => visibleColumns.filter((column) => column.isFocusDate && !column.isFutureDate), [visibleColumns]);
  const todayColumns = focusColumns.length ? focusColumns : visibleColumns.filter((column) => !column.isFutureDate).slice(-1);
  const primaryColumn = todayColumns[0] ?? visibleColumns[0];
  const weekColumns = visibleColumns.slice(0, 7);
  const currentProgramItems = curriculumProgram.filter((item) => item.period >= Math.max(1, taughtLessonCount - 2) && item.period <= taughtLessonCount + 5);

  function markAllPresent() {
    // Fill only students without a status so exceptions already marked are kept.
    bulkPresentTargets(filteredStudents, todayColumns, getStatus).forEach((target) => onSetAttendanceStatus(target.studentId, target.columnId, "present"));
  }

  function setStatusForToday(student: ClassroomStudent, status: AttendanceStatus) {
    todayColumns.forEach((column) => onSetAttendanceStatus(student.id, column.id, status));
  }

  return (
    <Box sx={{ display: "flex", height: "100%", minHeight: 0, flexDirection: "column", overflow: "hidden", bgcolor: "background.default" }}>
      <Box component="section" sx={{ flexShrink: 0, borderBottom: 1, borderColor: "divider", bgcolor: "background.paper", px: 1.5, py: 1.5, boxShadow: ergEnterpriseTokens.shadow.xs }}>
        <Box sx={{ display: "flex", minWidth: 0, alignItems: "flex-start", gap: 1.5 }}>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="subtitle1" noWrap sx={{ fontWeight: "fontWeightBold" }}>{selectedClass?.className ?? "Lớp học"}</Typography>
            <Typography variant="caption" component="div" noWrap sx={{ mt: 0.25, color: "text.secondary", fontWeight: "fontWeightMedium" }}>
              {filteredStudents.length} học sinh · {formatDateVi(selectedDate)} · {primaryColumn?.session ?? "Tiết"}
            </Typography>
          </Box>
          <ErgIconButton
            label="Xuất Excel điểm danh"
            onClick={exportXlsx}
            sx={{ width: 44, height: 44, flexShrink: 0, borderRadius: 1.5, bgcolor: "primary.main", color: "primary.contrastText", "&:hover": { bgcolor: "primary.dark" } }}
          >
            <DownloadIcon fontSize="small" />
          </ErgIconButton>
        </Box>

        <Box sx={{ mt: 1.5, display: "grid", gridTemplateColumns: "minmax(0,1fr) 160px", gap: 1 }}>
          <ErgSearchField
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
            placeholder="Tìm học sinh"
            sx={{ minWidth: 0, "& .MuiInputBase-root": { height: 44, bgcolor: "background.paper" } }}
          />
          <AttendanceDateField maxDate={todayInputDate} minHeight={44} onChange={onSelectedDateChange} value={selectedDate} />
        </Box>

        {offlinePending ? (
          <Typography variant="caption" component="div" sx={{ mt: 1, borderRadius: 1.5, bgcolor: "warning.light", color: "warning.main", px: 1.5, py: 1, fontWeight: "fontWeightBold" }}>
            Đang chờ đồng bộ
          </Typography>
        ) : null}

        <Box sx={{ mt: 1.5, display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 0.5, borderRadius: 2, bgcolor: primaryTint, p: 0.75 }}>
          {[
            ["today", "Hôm nay"],
            ["week", "Tuần"],
            ["program", "CT"],
          ].map(([value, label]) => (
            <ButtonBase
              key={value}
              onClick={() => setMode(value as MobileAttendanceMode)}
              sx={[
                { minHeight: 44, borderRadius: 1.5, px: 1, typography: "body2", fontWeight: "fontWeightBold", color: "text.secondary", transition: "all 0.15s ease" },
                mode === value && { bgcolor: "background.paper", color: "primary.main", boxShadow: ergEnterpriseTokens.shadow.xs },
              ]}
            >
              {label}
            </ButtonBase>
          ))}
        </Box>
      </Box>

      {mode === "today" ? (
        <Box sx={{ minHeight: 0, flex: 1, overflow: "auto", px: 1.5, py: 1.5 }}>
          <Box sx={{ mb: 1.5, display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 1 }}>
            <ErgButton variant="contained" color="success" onClick={markAllPresent} sx={{ minHeight: 44, borderRadius: 1.5 }}>
              Tất cả có mặt
            </ErgButton>
            <ErgButton variant="outlined" onClick={exportXlsx} sx={{ minHeight: 44, borderRadius: 1.5 }}>
              Xuất Excel
            </ErgButton>
          </Box>
          <Box sx={{ display: "grid", gap: 1.5 }}>
            {filteredStudents.map((student, studentIndex) => {
              const statuses = todayColumns.map((column, columnIndex) => getStatus(student.id, studentIndex, column, columnIndex));
              const summary = attendanceSummary(statuses);
              const currentStatus = statuses[0] ?? "";
              return (
                <Box component="article" key={student.id} sx={{ ...cardSx, display: "flex", minHeight: 56, alignItems: "center", gap: 1, p: 1 }}>
                  <ButtonBase
                    onClick={() => onOpenStudentDetail(student)}
                    aria-label={`Mở hồ sơ ${student.name}`}
                    sx={{ minHeight: 44, minWidth: 0, flex: 1, px: 0.5, display: "block", textAlign: "left" }}
                  >
                    <Typography variant="subtitle1" component="span" noWrap sx={{ display: "block", fontWeight: "fontWeightBold" }}>{student.name}</Typography>
                    <Typography variant="caption" component="span" sx={{ mt: 0.25, display: "block", color: "text.secondary", fontWeight: "fontWeightMedium" }}>
                      Có mặt {summary.present}/{summary.total} · Vắng {summary.absent}
                    </Typography>
                  </ButtonBase>
                  <ButtonBase
                    onClick={() => setStatusForToday(student, nextAttendanceStatus(currentStatus))}
                    aria-label={`${student.name}: ${attendanceText(currentStatus)}. Chạm để đổi trạng thái`}
                    sx={[
                      { minHeight: 44, width: 112, flexShrink: 0, borderRadius: 1.5, border: 1, px: 1, typography: "body2", fontWeight: "fontWeightBold", transition: "all 0.15s ease" },
                      attendanceToneSx(currentStatus),
                    ]}
                  >
                    {attendanceLabel(currentStatus)} {attendanceText(currentStatus)}
                  </ButtonBase>
                </Box>
              );
            })}
          </Box>
        </Box>
      ) : null}

      {mode === "week" ? (
        <Box sx={{ minHeight: 0, flex: 1, overflow: "auto", bgcolor: "background.paper" }}>
          <Box sx={{ display: "grid", minWidth: "max-content", gridTemplateColumns: `150px repeat(${weekColumns.length}, 56px)` }}>
            <Typography variant="caption" component="div" sx={{ ...gridCellSx, position: "sticky", left: 0, top: 0, zIndex: 20, bgcolor: "background.default", px: 1, py: 1, fontWeight: "fontWeightBold", color: "text.secondary" }}>
              Học sinh
            </Typography>
            {weekColumns.map((column) => (
              <Typography
                key={column.id}
                variant="caption"
                component="div"
                sx={[
                  { ...gridCellSx, position: "sticky", top: 0, zIndex: 10, bgcolor: "background.default", px: 0.5, py: 1, textAlign: "center", fontWeight: "fontWeightBold" },
                  Boolean(column.isFocusDate) && { bgcolor: primaryTint, color: "primary.main" },
                ]}
              >
                <Box component="span" sx={{ display: "block" }}>{column.date}</Box>
                <Box component="span" sx={{ display: "block" }}>{column.session.replace("Tiết ", "T")}</Box>
              </Typography>
            ))}
            {filteredStudents.map((student, studentIndex) => (
              <Box key={student.id} sx={{ display: "contents" }}>
                <ButtonBase
                  onClick={() => onOpenStudentDetail(student)}
                  sx={{ ...gridCellSx, position: "sticky", left: 0, zIndex: 10, minHeight: 48, bgcolor: "background.paper", px: 1, justifyContent: "flex-start", textAlign: "left", typography: "caption", fontWeight: "fontWeightBold", color: "primary.main" }}
                >
                  <Box component="span" sx={lineClamp2}>{student.name}</Box>
                </ButtonBase>
                {weekColumns.map((column, columnIndex) => {
                  const status = getStatus(student.id, studentIndex, column, columnIndex);
                  return (
                    <ButtonBase
                      key={`${student.id}-${column.id}`}
                      disabled={column.isFutureDate}
                      onClick={() => onSetAttendanceStatus(student.id, column.id, nextAttendanceStatus(status))}
                      aria-label={`${student.name} ${column.fullDate} ${column.session}`}
                      sx={[
                        { ...gridCellSx, minHeight: 48, typography: "body2", fontWeight: "fontWeightBold" },
                        attendanceToneSx(status),
                        { "&.Mui-disabled": { bgcolor: "action.disabledBackground", color: "text.disabled" } },
                      ]}
                    >
                      {attendanceLabel(status)}
                    </ButtonBase>
                  );
                })}
              </Box>
            ))}
          </Box>
        </Box>
      ) : null}

      {mode === "program" ? (
        <Box sx={{ minHeight: 0, flex: 1, overflow: "auto", px: 1.5, py: 1.5 }}>
          <Box sx={{ ...cardSx, mb: 1.5, p: 1.5 }}>
            <Typography variant="body2" sx={{ fontWeight: "fontWeightBold", color: "text.secondary" }}>Số tiết đã dạy</Typography>
            <Typography variant="h5" sx={{ mt: 0.5, fontWeight: "fontWeightBold", color: "primary.main" }}>{taughtLessonCount}</Typography>
          </Box>
          <Box sx={{ display: "grid", gap: 1 }}>
            {currentProgramItems.map((item) => (
              <Box
                component="article"
                key={item.period}
                sx={[{ ...cardSx, p: 1.5 }, item.period === taughtLessonCount && { borderColor: "primary.main", bgcolor: primaryTint }]}
              >
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                  <Typography
                    variant="body2"
                    component="span"
                    sx={{ display: "grid", width: 40, height: 40, flexShrink: 0, placeItems: "center", borderRadius: 1.5, bgcolor: "background.paper", fontWeight: "fontWeightBold", color: "primary.main", boxShadow: ergEnterpriseTokens.shadow.xs }}
                  >
                    {item.period}
                  </Typography>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography variant="caption" component="div" sx={{ fontWeight: "fontWeightBold", color: "text.secondary" }}>{item.topic}</Typography>
                    <Typography variant="body2" sx={{ mt: 0.5, fontWeight: "fontWeightBold" }}>{item.title}</Typography>
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      ) : null}
    </Box>
  );
}

function attendanceToneSx(status: AttendanceStatus) {
  const tone = status === "absent" ? "error" : status === "late" ? "warning" : status === "excused" ? "info" : status === "present" ? "success" : null;
  if (!tone) return { borderColor: "divider", bgcolor: "background.paper", color: "text.disabled" };
  return { borderColor: `${tone}.main`, bgcolor: `${tone}.light`, color: `${tone}.main` };
}
