import { memo, type CSSProperties } from "react";

import type { WeeklyClassLogDay, WeeklyClassLogPeriod } from "@/features/lms/weekly-class-log/types/weekly-class-log-types";
import { getPeriodCompletionState } from "./weekly-class-log-model";
import type { WeeklyClassLogController } from "./use-weekly-class-log-controller";

const morningPeriodCount = 5;

export function WeeklyClassLogTable({ controller }: { controller: WeeklyClassLogController }) {
  return (
    <div style={{ flex: 1, minWidth: 0, overflow: "auto" }}>
      <table style={{ width: "100%", minWidth: 1200, borderCollapse: "collapse", fontSize: 13, fontFamily: "inherit" }}>
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
          {controller.selectedWeek.days.map((day) => (
            <DayRows
              key={day.id}
              day={day}
              disabled={controller.isLocked}
              teacherName={controller.teacherName}
              onUpdateDay={controller.updateDay}
              onUpdatePeriod={controller.updatePeriod}
            />
          ))}
        </tbody>
      </table>
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
  return (
    <>
      {day.periods.map((period, index) => {
        const rowState = getPeriodCompletionState(period);
        const bgColor = rowState === "complete" ? "#dcfce7" : rowState === "incomplete" ? "#fee2e2" : "white";
        return (
          <tr key={period.id} style={{ backgroundColor: bgColor }}>
            {index === 0 && (
              <td rowSpan={day.periods.length} style={{ ...tdStyle(100), verticalAlign: "middle", textAlign: "center" }}>
                <div style={{ fontSize: 11, fontWeight: 600 }}>{day.label}</div>
                <input
                  type="date"
                  value={day.date}
                  disabled={disabled}
                  onChange={(event) => onUpdateDay(day.id, event.target.value)}
                  style={{ marginTop: 4, width: "100%", padding: "2px 4px", fontSize: 11, borderRadius: 4, border: "1px solid #e5e7eb", textAlign: "center" }}
                />
              </td>
            )}
            {index === 0 && (
              <td rowSpan={morningPeriodCount} style={{ ...tdStyle(60), verticalAlign: "middle", textAlign: "center", backgroundColor: "#f3f4f6", fontWeight: 600 }}>Sáng</td>
            )}
            {index === morningPeriodCount && (
              <td rowSpan={day.periods.length - morningPeriodCount} style={{ ...tdStyle(60), verticalAlign: "middle", textAlign: "center", backgroundColor: "#f3f4f6", fontWeight: 600 }}>Chiều</td>
            )}
            <td style={{ ...tdStyle(40), textAlign: "center", fontWeight: 600 }}>{(index % morningPeriodCount) + 1}</td>
            <EditableCell value={period.className} onChange={(value) => onUpdatePeriod(day.id, period.id, "className", value)} disabled={disabled} center />
            <EditableCell value={period.ppct} onChange={(value) => onUpdatePeriod(day.id, period.id, "ppct", value)} disabled={disabled} center />
            <EditableCell value={period.absent} onChange={(value) => onUpdatePeriod(day.id, period.id, "absent", value)} disabled={disabled} multiline />
            <EditableCell value={period.lesson} onChange={(value) => onUpdatePeriod(day.id, period.id, "lesson", value)} disabled={disabled} multiline />
            <EditableCell value={period.comment} onChange={(value) => onUpdatePeriod(day.id, period.id, "comment", value)} disabled={disabled} multiline />
            <td style={{ ...tdStyle(70), textAlign: "center" }}>
              <select
                value={period.disciplineScore || ""}
                onChange={(event) => onUpdatePeriod(day.id, period.id, "disciplineScore", event.target.value)}
                disabled={disabled}
                style={{ fontSize: 11, padding: "2px 4px", borderRadius: 4, border: "1px solid #e5e7eb", backgroundColor: "transparent", cursor: disabled ? "not-allowed" : "pointer" }}
              >
                <option value="">-</option>
                <option value="Đạt">Đạt</option>
                <option value="Chưa đạt">Chưa đạt</option>
              </select>
            </td>
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
  const style: CSSProperties = {
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
        <textarea value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} rows={1} style={{ ...style, resize: "vertical", minHeight: 24, overflow: "hidden" }} />
      </td>
    );
  }
  return <td style={{ ...tdStyle(), padding: "2px 4px" }}><input type="text" value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} style={style} /></td>;
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

const tdStyle = (width?: string | number) => ({ padding: "4px", border: "1px solid #e5e7eb", fontSize: 12, width });
