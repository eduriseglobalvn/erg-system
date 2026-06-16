import { memo, useEffect, useMemo, useState } from "react";
import { Button, Stack, Typography } from "@mui/material";
import { ChevronLeft, ChevronRight } from "@mui/icons-material";

import type { ClassroomSnapshot } from "@/features/lms/classroom/types/classroom-types";
import { lmsSubjectOptions } from "@/features/lms/components/lms-subject-options";
import { weeklyClassLogWeeks } from "@/features/lms/weekly-class-log/api/mock-weekly-class-log-data";
import type {
  WeeklyClassLogDay,
  WeeklyClassLogPeriod,
  WeeklyClassLogSummary,
  WeeklyClassLogWeek,
} from "@/features/lms/weekly-class-log/types/weekly-class-log-types";
import { getPersistedJsonValue, setPersistedJsonValue } from "@/stores/persisted-store";

type WeeklyClassLogPageProps = {
  selectedClass?: ClassroomSnapshot;
  selectedSchoolName: string;
  teacherName: string;
};

type PeriodCompletionState = "empty" | "complete" | "incomplete";

const STORAGE_KEY = "erg:lms:weekly-class-log:v5";
const morningPeriodCount = 5;

export function WeeklyClassLogPage({ selectedClass: _selectedClass, teacherName }: WeeklyClassLogPageProps) {
  const [weeks, setWeeks] = useState<WeeklyClassLogWeek[]>(() => loadStoredWeeks());
  const [selectedWeekId, setSelectedWeekId] = useState(weeks[0]?.id ?? "");
  const [selectedSubject, setSelectedSubject] = useState(lmsSubjectOptions[0] ?? "");
  const selectedWeek = weeks.find((week) => week.id === selectedWeekId) ?? weeks[0];
  const selectedWeekIndex = weeks.findIndex((week) => week.id === selectedWeek.id);
  const computedSummary = useMemo(() => buildWeeklySummary(selectedWeek), [selectedWeek]);
  const isLocked = selectedWeek.status === "locked";

  useEffect(() => {
    setPersistedJsonValue(STORAGE_KEY, weeks);
  }, [weeks]);

  function patchSelectedWeek(updater: (week: WeeklyClassLogWeek) => WeeklyClassLogWeek) {
    setWeeks((currentWeeks) =>
      currentWeeks.map((week) => (week.id === selectedWeek.id ? normalizeWeekSignatures(updater(week), teacherName) : week)),
    );
  }

  function updateDay(dayId: string, value: string) {
    if (isLocked) return;
    patchSelectedWeek((week) => ({
      ...week,
      status: "draft",
      days: week.days.map((day) => (day.id === dayId ? { ...day, date: value } : day)),
    }));
  }

  function updatePeriod(dayId: string, periodId: string, field: keyof WeeklyClassLogPeriod, value: string) {
    if (isLocked) return;
    patchSelectedWeek((week) => ({
      ...week,
      status: "draft",
      days: week.days.map((day) =>
        day.id === dayId
          ? {
              ...day,
              periods: day.periods.map((period) =>
                period.id === periodId ? { ...period, [field]: value } : period,
              ),
            }
          : day,
      ),
    }));
  }

  function goToWeek(offset: number) {
    const nextWeek = weeks[selectedWeekIndex + offset];
    if (nextWeek) setSelectedWeekId(nextWeek.id);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0, padding: 16 }}>
      {/* Header */}
      <div style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        marginBottom: 16,
        paddingBottom: 16,
        borderBottom: "1px solid #e5e7eb",
      }}>
        <Typography sx={{ fontSize: 22, fontWeight: 600 }}>Sổ Đầu Bài</Typography>

        <Stack direction="row" spacing={1.5} sx={{ flexWrap: "wrap" }}>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            style={{
              height: 40,
              padding: "0 12px",
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              fontSize: 14,
              minWidth: 160,
            }}
          >
            {lmsSubjectOptions.map((subject) => (
              <option key={subject} value={subject}>{subject}</option>
            ))}
          </select>

          <select
            value={selectedWeek.id}
            onChange={(e) => setSelectedWeekId(e.target.value)}
            style={{
              height: 40,
              padding: "0 12px",
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              fontSize: 14,
              minWidth: 200,
            }}
          >
            {weeks.map((week) => (
              <option key={week.id} value={week.id}>
                {week.label} · {compactWeekDateRange(week)}
              </option>
            ))}
          </select>

          <div style={{ display: "flex", borderRadius: 8, overflow: "hidden", border: "1px solid #e5e7eb" }}>
            <Button
              onClick={() => goToWeek(1)}
              disabled={selectedWeekIndex >= weeks.length - 1}
              startIcon={<ChevronLeft sx={{ fontSize: 18 }} />}
              sx={{
                borderRadius: 0,
                textTransform: "none",
                fontWeight: 600,
                minWidth: 100,
              }}
            >
              Trước
            </Button>
            <Button
              onClick={() => goToWeek(-1)}
              disabled={selectedWeekIndex <= 0}
              endIcon={<ChevronRight sx={{ fontSize: 18 }} />}
              sx={{
                borderRadius: 0,
                textTransform: "none",
                fontWeight: 600,
                minWidth: 100,
              }}
            >
              Sau
            </Button>
          </div>
        </Stack>
      </div>

      {/* Main Content */}
      <div style={{
        flex: 1,
        minHeight: 0,
        display: "flex",
        borderRadius: 8,
        backgroundColor: "white",
        border: "1px solid #e5e7eb",
        overflow: "hidden",
      }}>
        {/* Table Section */}
        <div style={{ flex: 1, minWidth: 0, overflow: "auto" }}>
          <table style={{
            width: "100%",
            minWidth: 1200,
            borderCollapse: "collapse",
            fontSize: 13,
            fontFamily: "inherit",
          }}>
            <thead>
              <tr style={{ backgroundColor: "#f8fafc" }}>
                <th style={thStyle(100)}>Thứ, ngày</th>
                <th style={thStyle(60)}>Buổi</th>
                <th style={thStyle(40)}>Tiết</th>
                <th style={thStyle(70)}>Lớp</th>
                <th style={thStyle(60)}>PPCT</th>
                <th style={thStyle(120)}>HS vắng</th>
                <th style={thStyle()}>Tên bài học, nội dung</th>
                <th style={thStyle()}>Nhận xét</th>
                <th style={thStyle(70)}>Kỷ luật</th>
                <th style={thStyle(80)}>GV ký</th>
              </tr>
            </thead>
            <tbody>
              {selectedWeek.days.map((day) => (
                <DayRows
                  key={day.id}
                  day={day}
                  disabled={isLocked}
                  teacherName={teacherName}
                  onUpdateDay={updateDay}
                  onUpdatePeriod={updatePeriod}
                />
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary Sidebar */}
        <div style={{
          width: 280,
          flexShrink: 0,
          borderLeft: "1px solid #e5e7eb",
          display: "flex",
          flexDirection: "column",
          overflow: "auto",
        }}>
          <div style={{
            padding: "12px 16px",
            textAlign: "center",
            borderBottom: "1px solid #e5e7eb",
            backgroundColor: "#f3f4f6",
            fontWeight: 600,
            fontSize: 14,
          }}>
            Tổng kết tuần
          </div>

          <div style={{ padding: "12px 16px", borderBottom: "1px solid #e5e7eb" }}>
            {[
              { label: "Vắng", field: "absence" as const },
              { label: "Đi muộn", field: "late" as const },
              { label: "Vi phạm", field: "otherViolation" as const },
              { label: "Điểm cuối tuần", field: "finalScore" as const },
              { label: "Học tập", field: "learning" as const },
              { label: "Kỷ luật", field: "discipline" as const },
              { label: "Vệ sinh", field: "hygiene" as const },
              { label: "Điểm trừ", field: "deduction" as const },
              { label: "Điểm TB", field: "average" as const },
              { label: "Đạt tuần tốt", field: "goodWeek" as const },
            ].map(({ label, field }) => (
              <div
                key={field}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "6px 0",
                  borderBottom: "1px dotted #e5e7eb",
                }}
              >
                <span style={{ fontSize: 12, color: "#6b7280" }}>{label}:</span>
                <span style={{ fontSize: 12, fontWeight: 600 }}>{computedSummary[field]}</span>
              </div>
            ))}
          </div>

          <div style={{ borderBottom: "1px solid #e5e7eb" }}>
            <div style={{ padding: "8px 16px", textAlign: "center", fontWeight: 600, fontSize: 13, borderBottom: "1px solid #e5e7eb" }}>
              Kiến nghị GVBM
            </div>
            <div style={{ padding: "12px 16px", fontSize: 12, color: "#6b7280", fontStyle: "italic" }}>
              {computedSummary.subjectTeacherProposal || "Không có"}
            </div>
          </div>

          <div>
            <div style={{ padding: "8px 16px", textAlign: "center", fontWeight: 600, fontSize: 13, borderBottom: "1px solid #e5e7eb" }}>
              Ý kiến GVCN
            </div>
            <div style={{ padding: "12px 16px", fontSize: 12, color: "#6b7280", fontStyle: "italic" }}>
              {computedSummary.homeroomTeacherOpinion || "Không có"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const DayRows = memo(function DayRows({
  day,
  disabled,
  onUpdateDay,
  onUpdatePeriod,
  teacherName,
}: {
  day: WeeklyClassLogDay;
  disabled: boolean;
  onUpdateDay: (dayId: string, value: string) => void;
  onUpdatePeriod: (dayId: string, periodId: string, field: keyof WeeklyClassLogPeriod, value: string) => void;
  teacherName: string;
}) {
  const dayState = getGroupedPeriodState(day.periods);

  return (
    <>
      {day.periods.map((period, index) => {
        const rowState = getPeriodCompletionState(period);
        const bgColor = rowState === "complete" ? "#dcfce7" : rowState === "incomplete" ? "#fee2e2" : "white";
        const isMorning = index < morningPeriodCount;

        return (
          <tr key={period.id} style={{ backgroundColor: bgColor }}>
            {/* Day/Date - merged for first period */}
            {index === 0 && (
              <td rowSpan={day.periods.length} style={{ ...tdStyle(100), verticalAlign: "middle", textAlign: "center" }}>
                <div style={{ fontSize: 11, fontWeight: 600 }}>{day.label}</div>
                <input
                  type="date"
                  value={day.date}
                  disabled={disabled}
                  onChange={(e) => onUpdateDay(day.id, e.target.value)}
                  style={{
                    marginTop: 4,
                    width: "100%",
                    padding: "2px 4px",
                    fontSize: 11,
                    borderRadius: 4,
                    border: "1px solid #e5e7eb",
                    textAlign: "center",
                  }}
                />
              </td>
            )}

            {/* Session */}
            {index === 0 && (
              <td rowSpan={morningPeriodCount} style={{ ...tdStyle(60), verticalAlign: "middle", textAlign: "center", backgroundColor: "#f3f4f6", fontWeight: 600 }}>
                Sáng
              </td>
            )}
            {index === morningPeriodCount && (
              <td rowSpan={day.periods.length - morningPeriodCount} style={{ ...tdStyle(60), verticalAlign: "middle", textAlign: "center", backgroundColor: "#f3f4f6", fontWeight: 600 }}>
                Chiều
              </td>
            )}

            {/* Period number */}
            <td style={{ ...tdStyle(40), textAlign: "center", fontWeight: 600 }}>
              {(index % morningPeriodCount) + 1}
            </td>

            {/* Class */}
            <EditableCell
              value={period.className}
              onChange={(v) => onUpdatePeriod(day.id, period.id, "className", v)}
              disabled={disabled}
              center
            />

            {/* PPCT */}
            <EditableCell
              value={period.ppct}
              onChange={(v) => onUpdatePeriod(day.id, period.id, "ppct", v)}
              disabled={disabled}
              center
            />

            {/* Absent */}
            <EditableCell
              value={period.absent}
              onChange={(v) => onUpdatePeriod(day.id, period.id, "absent", v)}
              disabled={disabled}
              multiline
            />

            {/* Lesson */}
            <EditableCell
              value={period.lesson}
              onChange={(v) => onUpdatePeriod(day.id, period.id, "lesson", v)}
              disabled={disabled}
              multiline
            />

            {/* Comment */}
            <EditableCell
              value={period.comment}
              onChange={(v) => onUpdatePeriod(day.id, period.id, "comment", v)}
              disabled={disabled}
              multiline
            />

            {/* Discipline Score */}
            <td style={{ ...tdStyle(70), textAlign: "center" }}>
              <select
                value={period.disciplineScore || ""}
                onChange={(e) => onUpdatePeriod(day.id, period.id, "disciplineScore", e.target.value)}
                disabled={disabled}
                style={{
                  fontSize: 11,
                  padding: "2px 4px",
                  borderRadius: 4,
                  border: "1px solid #e5e7eb",
                  backgroundColor: "transparent",
                  cursor: disabled ? "not-allowed" : "pointer",
                }}
              >
                <option value="">-</option>
                <option value="Đạt">Đạt</option>
                <option value="Chưa đạt">Chưa đạt</option>
              </select>
            </td>

            {/* Teacher Signature */}
            <td style={{ ...tdStyle(80), textAlign: "center", fontWeight: 600, fontSize: 11 }}>
              {period.className && period.ppct && period.lesson && period.comment && period.disciplineScore ? teacherName : ""}
            </td>
          </tr>
        );
      })}
    </>
  );
});

const EditableCell = memo(function EditableCell({
  value,
  onChange,
  disabled,
  center,
  multiline,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  center?: boolean;
  multiline?: boolean;
}) {
  const style: React.CSSProperties = {
    padding: "2px 4px",
    border: "1px solid transparent",
    fontSize: 11,
    width: "100%",
    backgroundColor: "transparent",
    textAlign: center ? "center" : "left",
    cursor: disabled ? "not-allowed" : "text",
  };

  if (multiline) {
    return (
      <td style={{ ...tdStyle(), padding: "2px 4px" }}>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          rows={1}
          style={{
            ...style,
            resize: "vertical",
            minHeight: 24,
            overflow: "hidden",
          }}
        />
      </td>
    );
  }

  return (
    <td style={{ ...tdStyle(), padding: "2px 4px" }}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        style={style}
      />
    </td>
  );
});

const thStyle = (width?: string | number) => ({
  padding: "10px 8px",
  border: "1px solid #e5e7eb",
  fontSize: 11,
  fontWeight: 700,
  textAlign: "center" as const,
  backgroundColor: "#f8fafc",
  whiteSpace: "nowrap" as const,
  width,
});

const tdStyle = (width?: string | number) => ({
  padding: "4px",
  border: "1px solid #e5e7eb",
  fontSize: 12,
  width,
});

function loadStoredWeeks() {
  const storedWeeks = getPersistedJsonValue<WeeklyClassLogWeek[]>(STORAGE_KEY, weeklyClassLogWeeks);
  return Array.isArray(storedWeeks) && storedWeeks.length ? migrateWeeks(storedWeeks) : migrateWeeks(weeklyClassLogWeeks);
}

function migrateWeeks(weeks: WeeklyClassLogWeek[]) {
  return weeks.map((week) => ({
    ...week,
    days: week.days.map((day) => ({
      ...day,
      periods: day.periods.map((period) => ({
        ...period,
        className: period.className || period.subject || "",
        subject: "",
        learningScore: "",
        hygieneScore: "",
        totalScore: "",
        disciplineScore: normalizeDisciplineValue(period.disciplineScore),
        teacherSignature: "",
      })),
    })),
  }));
}

function normalizeWeekSignatures(week: WeeklyClassLogWeek, teacherName: string) {
  return {
    ...week,
    days: week.days.map((day) => ({
      ...day,
      periods: day.periods.map((period) => ({
        ...period,
        teacherSignature: getTeacherSignature(period, teacherName),
      })),
    })),
  };
}

function normalizeDisciplineValue(value: string) {
  if (value === "Đạt") return "Đạt";
  if (value === "Chưa đạt") return "Chưa đạt";
  return value ? "Đạt" : "";
}

function getTeacherSignature(period: WeeklyClassLogPeriod, teacherName: string) {
  if (!isPeriodComplete(period)) return "";
  return teacherName;
}

function isPeriodComplete(period: WeeklyClassLogPeriod) {
  return Boolean(
    period.className.trim() &&
      period.ppct.trim() &&
      period.lesson.trim() &&
      period.comment.trim() &&
      period.disciplineScore.trim(),
  );
}

function getPeriodCompletionState(period: WeeklyClassLogPeriod): PeriodCompletionState {
  const requiredValues = [period.className, period.ppct, period.lesson, period.comment, period.disciplineScore];
  const hasAnyValue = [...requiredValues, period.absent].some((value) => value.trim());
  if (!hasAnyValue) return "empty";
  return requiredValues.every((value) => value.trim()) ? "complete" : "incomplete";
}

function getGroupedPeriodState(periods: WeeklyClassLogPeriod[]): PeriodCompletionState {
  const states = periods.map(getPeriodCompletionState);
  if (states.some((state) => state === "incomplete")) return "empty";
  if (states.some((state) => state === "complete")) return "complete";
  return "empty";
}

function buildWeeklySummary(week: WeeklyClassLogWeek): WeeklyClassLogSummary {
  const periods = week.days.flatMap((day) => day.periods);
  const filledPeriods = periods.filter((period) => period.className || period.ppct || period.lesson || period.comment || period.absent);
  const signedPeriods = filledPeriods.filter((period) => period.teacherSignature);
  const absentNotes = periods.map((period) => period.absent.trim()).filter(Boolean);
  const notAchievedCount = periods.filter((period) => period.disciplineScore === "Chưa đạt").length;
  const achievedCount = periods.filter((period) => period.disciplineScore === "Đạt").length;

  return {
    ...week.summary,
    absence: absentNotes.length ? absentNotes.join("; ") : "Không ghi nhận",
    late: "Không ghi nhận",
    otherViolation: notAchievedCount ? `${notAchievedCount} tiết chưa đạt` : "Không ghi nhận",
    finalScore: "",
    learning: "",
    discipline: filledPeriods.length ? `${achievedCount}/${filledPeriods.length} tiết đạt` : "",
    hygiene: "",
    deduction: notAchievedCount ? String(notAchievedCount) : "0",
    average: "",
    goodWeek: filledPeriods.length && notAchievedCount === 0 ? "Đạt" : "Chưa đủ dữ liệu",
    rank: "",
    unsignedSubjects: String(Math.max(0, filledPeriods.length - signedPeriods.length)),
    subjectNotes: selectedClassesFromPeriods(periods),
    subjectTeacherProposal: week.summary.subjectTeacherProposal || "",
    homeroomTeacherOpinion: week.summary.homeroomTeacherOpinion || "",
  };
}

function selectedClassesFromPeriods(periods: WeeklyClassLogPeriod[]) {
  const classes = Array.from(new Set(periods.map((period) => period.className.trim()).filter(Boolean)));
  return classes.join(", ");
}

function compactWeekDateRange(week: WeeklyClassLogWeek) {
  return `${week.fromDate.slice(0, 5)} - ${week.toDate.slice(0, 5)}`;
}
