import { memo } from "react";
import Box from "@mui/material/Box";
import InputBase from "@mui/material/InputBase";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";

import { ErgTable } from "@/components/erg-mui/erg-table";
import { ergEnterpriseTokens as t } from "@/themes/erg-enterprise-tokens";

import type { ClassLogPeriod, ClassLogWeek } from "../api/class-log-api";
import { absenteesText, classLogText, lagText } from "../domain/class-log-copy";
import { buildTeacherRows, type DayRow } from "../domain/class-log-model";
import type { EntryPatch } from "../hooks/use-lesson-log-editor";
import { ActualPeriodSelect } from "./actual-period-select";
import { bodyCellSx, ConfirmPill, headCellSx, LagNote } from "./class-log-ui";

const columns: ReadonlyArray<{ label: string; width: number; center?: boolean }> = [
  { label: "Tiết", width: 56, center: true }, { label: "Lớp", width: 64 }, { label: "Môn học", width: 110 },
  { label: "Học sinh vắng", width: 150 }, { label: "PPCT", width: 64, center: true }, { label: "Tiết thực tế", width: 110 },
  { label: "Bài dạy (tự tra KCT)", width: 0 }, { label: "Nhận xét", width: 180 }, { label: "Xác nhận", width: 140 },
];

type Props = {
  week: ClassLogWeek;
  drafts: Record<string, EntryPatch>;
  onEdit: (period: ClassLogPeriod, patch: EntryPatch) => void;
};

export function TeacherWeekTable({ week, drafts, onEdit }: Props) {
  return (
    <Box sx={{ flex: 1, minHeight: 0, overflow: "auto" }}>
      <ErgTable aria-label="Sổ đầu bài theo tuần" sx={{ minWidth: 1040, tableLayout: "fixed" }}>
        <TableHead>
          <TableRow>
            {columns.map((c) => (
              <TableCell key={c.label} sx={{ ...headCellSx, textAlign: c.center ? "center" : "left", width: c.width || undefined }}>{c.label}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {buildTeacherRows(week).map((row) =>
            row.kind === "day" ? <DayHeading key={row.date} row={row} /> : (
              <PeriodRowView key={row.key} draft={drafts[row.key]} onEdit={onEdit} period={row.period} />
            ))}
        </TableBody>
      </ErgTable>
    </Box>
  );
}

function DayHeading({ row }: { row: DayRow }) {
  return (
    <TableRow>
      <TableCell colSpan={columns.length} sx={{ bgcolor: t.color.surfaceSubtle, borderBottom: `1px solid ${t.color.divider}`, fontSize: t.type.note.fontSize, py: 1, px: 1.5 }}>
        <Box component="strong" sx={{ color: "text.primary", fontWeight: t.type.label.fontWeight }}>{row.weekday}</Box>
        <Box component="span" sx={{ color: t.color.textMuted, ml: 1 }}>{row.shortDate}</Box>
        <Box component="span" sx={{ color: row.empty ? t.color.textSoft : t.color.textMuted, ml: 1.5 }}>{row.meta}</Box>
      </TableCell>
    </TableRow>
  );
}

const PeriodRowView = memo(function PeriodRowView({ period, draft, onEdit }: { period: ClassLogPeriod; draft?: EntryPatch; onEdit: Props["onEdit"] }) {
  const actual = draft?.actualPeriod ?? period.actualPeriod;
  const comment = draft?.comment ?? period.comment ?? "";
  const lag = lagText(period.ppctPeriod, actual);
  const warn = actual !== period.ppctPeriod;
  const absent = period.absentees.length > 0;
  const label = `${period.className} · tiết ${period.periodNo}`;
  const cell = { ...bodyCellSx, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } as const;
  return (
    <TableRow sx={warn ? { bgcolor: t.classLog.rowLag } : undefined}>
      <TableCell sx={{ ...cell, color: t.color.textMuted, textAlign: "center" }}>{period.periodNo}</TableCell>
      <TableCell sx={{ ...cell, fontWeight: t.type.label.fontWeight }}>{period.className}</TableCell>
      <TableCell sx={{ ...cell, color: "text.secondary" }}>{period.subjectName}</TableCell>
      <TableCell sx={{ ...cell, color: absent ? t.classLog.absentK.color : t.classLog.placeholder }}>{absenteesText(period.absentees)}</TableCell>
      <TableCell sx={{ ...cell, color: t.color.textMuted, textAlign: "center" }}>{period.ppctPeriod}</TableCell>
      <TableCell sx={cell}>
        <ActualPeriodSelect actual={actual} label={`Tiết thực tế · ${label}`} lagging={warn} onChange={(value) => onEdit(period, { actualPeriod: value })} ppct={period.ppctPeriod} />
      </TableCell>
      <TableCell sx={{ ...bodyCellSx, py: 0.5 }}>
        <Typography noWrap sx={{ fontSize: t.type.small.fontSize }}>{period.lessonTitle ?? classLogText.noLesson}</Typography>
        {lag ? <LagNote text={lag} /> : null}
      </TableCell>
      <TableCell sx={cell}>
        <InputBase
          fullWidth
          inputProps={{ "aria-label": `Nhận xét · ${label}`, maxLength: 500 }}
          onChange={(event) => onEdit(period, { comment: event.target.value })}
          placeholder={classLogText.commentPlaceholder}
          sx={{ color: t.color.textSecondary, fontSize: t.type.small.fontSize }}
          value={comment}
        />
      </TableCell>
      <TableCell sx={cell}><ConfirmPill confirmed={period.status === "CONFIRMED"} late={period.late} /></TableCell>
    </TableRow>
  );
});
