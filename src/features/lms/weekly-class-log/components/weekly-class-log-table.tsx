import { memo } from "react";
import { ErgSelect } from "@/components/erg-mui";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

import type { WeeklyClassLogDay, WeeklyClassLogPeriod } from "@/features/lms/weekly-class-log/types/weekly-class-log-types";
import { getPeriodCompletionState } from "./weekly-class-log-model";
import type { WeeklyClassLogController } from "./use-weekly-class-log-controller";

const morningPeriodCount = 5;
const { color, statusTint } = ergEnterpriseTokens;
const border = `1px solid ${color.border}`;

export function WeeklyClassLogTable({ controller }: { controller: WeeklyClassLogController }) {
  return (
    <div style={{ flex: 1, minWidth: 0, overflow: "auto" }}>
      <table style={{ width: "100%", minWidth: 1200, borderCollapse: "collapse", fontFamily: "inherit" }}>
        <thead>
          <tr style={{ backgroundColor: color.surfaceSubtle }}>
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
          {controller.selectedWeek.days.map((day) => (
            <DayRows
              key={day.id}
              day={day}
              disabled={controller.isLocked}
              teacherName={controller.teacherName}
              onUpdatePeriod={controller.updatePeriod}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** "Thứ 2 · Tiết 1 · Lớp"; afternoon periods restart at 1, so they carry "chiều" to stay unique. */
export function periodAriaLabel(dayLabel: string, periodIndex: number, column: string) {
  const afternoon = periodIndex >= morningPeriodCount;
  return `${dayLabel} · Tiết ${(periodIndex % morningPeriodCount) + 1}${afternoon ? " chiều" : ""} · ${column}`;
}

const DayRows = memo(function DayRows({
  day,
  disabled,
  onUpdatePeriod,
  teacherName,
}: {
  day: WeeklyClassLogDay;
  disabled: boolean;
  onUpdatePeriod: (dayId: string, periodId: string, field: keyof WeeklyClassLogPeriod, value: string) => void;
  teacherName: string;
}) {
  return (
    <>
      {day.periods.map((period, index) => {
        const rowState = getPeriodCompletionState(period);
        const bgColor = rowState === "complete" ? statusTint.success.bg : rowState === "incomplete" ? statusTint.error.bg : color.surface;
        const label = (column: string) => periodAriaLabel(day.label, index, column);
        const edit = (field: keyof WeeklyClassLogPeriod) => (value: string) => onUpdatePeriod(day.id, period.id, field, value);
        return (
          <tr key={period.id} style={{ backgroundColor: bgColor }}>
            {index === 0 && (
              <td rowSpan={day.periods.length} style={{ ...tdStyle(100), verticalAlign: "middle", textAlign: "center" }}>
                <strong>{day.label}</strong>
                <div>{day.date}</div>
              </td>
            )}
            {index === 0 && (
              <td rowSpan={morningPeriodCount} style={{ ...tdStyle(60), ...sessionStyle }}>Sáng</td>
            )}
            {index === morningPeriodCount && (
              <td rowSpan={day.periods.length - morningPeriodCount} style={{ ...tdStyle(60), ...sessionStyle }}>Chiều</td>
            )}
            <td style={{ ...tdStyle(40), textAlign: "center", fontWeight: "bold" }}>{(index % morningPeriodCount) + 1}</td>
            <EditableCell label={label("Lớp")} value={period.className} onChange={edit("className")} disabled={disabled} center />
            <EditableCell label={label("PPCT")} value={period.ppct} onChange={edit("ppct")} disabled={disabled} center />
            <EditableCell label={label("HS vắng")} value={period.absent} onChange={edit("absent")} disabled={disabled} multiline />
            <EditableCell label={label("Tên bài học, nội dung")} value={period.lesson} onChange={edit("lesson")} disabled={disabled} multiline />
            <EditableCell label={label("Nhận xét")} value={period.comment} onChange={edit("comment")} disabled={disabled} multiline />
            <td style={{ ...tdStyle(70), textAlign: "center" }}>
              <ErgSelect
                size="small"
                fullWidth={false}
                value={period.disciplineScore || ""}
                onChange={(event) => onUpdatePeriod(day.id, period.id, "disciplineScore", String(event.target.value))}
                disabled={disabled}
                options={[{ value: "", label: "-" }, { value: "Đạt", label: "Đạt" }, { value: "Chưa đạt", label: "Chưa đạt" }]}
                slotProps={{ select: { displayEmpty: true, SelectDisplayProps: { "aria-label": label("Kỷ luật") } } }}
                sx={{ minWidth: 72, "& .MuiSelect-select": { py: 0.25, typography: "caption" } }}
              />
            </td>
            <td style={{ ...tdStyle(80), textAlign: "center", fontWeight: "bold" }}>
              {period.className && period.ppct && period.lesson && period.comment && period.disciplineScore ? teacherName : ""}
            </td>
          </tr>
        );
      })}
    </>
  );
});

const EditableCell = memo(function EditableCell({
  center,
  disabled,
  label,
  multiline,
  onChange,
  value,
}: {
  center?: boolean;
  disabled?: boolean;
  label: string;
  multiline?: boolean;
  onChange: (value: string) => void;
  value: string;
}) {
  const style = {
    backgroundColor: "transparent",
    border: "1px solid transparent",
    cursor: disabled ? "not-allowed" : "text",
    font: "inherit",
    padding: "2px 4px",
    textAlign: center ? ("center" as const) : ("left" as const),
    width: "100%",
  };
  return (
    <td style={{ ...tdStyle(), padding: "2px 4px" }}>
      {multiline ? (
        <textarea aria-label={label} value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} rows={1} style={{ ...style, resize: "vertical", minHeight: 24, overflow: "hidden" }} />
      ) : (
        <input aria-label={label} type="text" value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} style={style} />
      )}
    </td>
  );
});

const sessionStyle = { backgroundColor: color.surfaceMuted, fontWeight: "bold", textAlign: "center" as const, verticalAlign: "middle" as const };

const thStyle = (width?: string | number) => ({
  backgroundColor: color.surfaceSubtle,
  border,
  padding: "10px 8px",
  textAlign: "center" as const,
  whiteSpace: "nowrap" as const,
  width,
});

const tdStyle = (width?: string | number) => ({ border, padding: "4px", width });
