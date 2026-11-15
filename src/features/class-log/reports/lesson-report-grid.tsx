import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";

import { ergEnterpriseTokens as t } from "@/themes/erg-enterprise-tokens";

import { weekdayVi, shortDateVi } from "../domain/class-log-week";
import type { LessonReportMatrix, LessonReportRow } from "./lesson-report-api";
import { dayHead, rateTone, reportText, rowRate, type ReportState } from "./lesson-report-model";

/** Cell tints of the board: green on time, amber late, red missing, grey no class. */
export const reportTones: Record<ReportState, { bg: string; color: string }> = {
  ON_TIME: t.classLog.present,
  LATE: t.classLog.late,
  MISSING: t.statusTint.error,
  NONE: { bg: t.color.surfaceSubtle, color: t.color.textMuted },
};
const legend: ReportState[] = ["ON_TIME", "LATE", "MISSING", "NONE"];
const rateColor = { good: t.classLog.present.color, warn: t.classLog.late.color, bad: t.color.brandRed } as const;
const th = { ...t.type.smallStrong, bgcolor: t.color.surfaceMuted, borderBottom: 0, color: t.color.textSecondary, py: "10px" } as const;
const td = { ...t.type.small, borderBottom: 0, borderTop: `1px solid ${t.color.divider}`, py: 1 } as const;

export type CellPick = { teacherId: string; date: string };

type Props = { matrix: LessonReportMatrix; rows: ReadonlyArray<LessonReportRow>; picked: CellPick | null; onPick: (pick: CellPick) => void };

/** «Giáo viên × ngày dạy»: one coloured button per teacher and day, with the legend on top. */
export function LessonReportGrid({ matrix, rows, picked, onPick }: Props) {
  return (
    <Box sx={{ bgcolor: "background.paper", border: `1px solid ${t.color.border}`, borderRadius: `${t.radius.card}px`, flex: 1, minWidth: 0, overflow: "hidden" }}>
      <Box sx={{ ...t.type.note, alignItems: "center", borderBottom: `1px solid ${t.color.divider}`, color: t.color.textSecondary, display: "flex", flexWrap: "wrap", gap: "14px", px: 2, py: 1.5 }}>
        <Box component="strong" sx={{ color: "text.primary", flex: 1, typography: "subtitle2" }}>Giáo viên × ngày dạy</Box>
        {legend.map((state) => (
          <Box component="span" key={state} sx={{ alignItems: "center", display: "inline-flex", gap: 0.75 }}>
            <Box component="span" sx={{ bgcolor: reportTones[state].bg, borderRadius: "3px", display: "inline-block", height: 10, width: 10 }} />
            {reportText.states[state]}
          </Box>
        ))}
      </Box>
      <Box sx={{ overflowX: "auto" }}>
        <Table aria-label="Báo giảng theo giáo viên và ngày" sx={{ minWidth: 640 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ ...th, px: 2 }}>Giáo viên</TableCell>
              {matrix.days.map((date) => <TableCell key={date} sx={{ ...th, px: 1, textAlign: "center" }}>{dayHead(date)}</TableCell>)}
              <TableCell sx={{ ...th, px: 2, textAlign: "right" }}>Đúng hạn</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => {
              const rate = rowRate(row);
              const rowOn = picked?.teacherId === row.teacherId;
              return (
                <TableRow key={row.teacherId} sx={rowOn ? { "& td": { bgcolor: t.color.primarySofter } } : undefined}>
                  <TableCell sx={{ ...td, px: 2 }}>
                    <Box sx={{ display: "flex", flexDirection: "column" }}>
                      <Box component="span" sx={{ fontWeight: "fontWeightMedium" }}>{row.teacherName}</Box>
                      <Box component="span" sx={{ ...t.type.note, color: t.color.textMuted }}>{row.schoolName}</Box>
                    </Box>
                  </TableCell>
                  {row.cells.map((cell) => {
                    const on = rowOn && picked.date === cell.date;
                    return (
                      <TableCell key={cell.date} sx={{ ...td, px: 0.5, py: 0.75 }}>
                        <ButtonBase
                          aria-label={`${row.teacherName} · ${weekdayVi(cell.date)} ${shortDateVi(cell.date)} · ${reportText.states[cell.state]}`}
                          aria-pressed={on}
                          onClick={() => onPick({ teacherId: row.teacherId, date: cell.date })}
                          sx={{ bgcolor: reportTones[cell.state].bg, color: reportTones[cell.state].color, ...t.type.label, borderRadius: "8px", height: 34, outline: on ? `2px solid ${t.color.primary}` : "none", width: "100%" }}
                        >
                          {reportText.marks[cell.state]}
                        </ButtonBase>
                      </TableCell>
                    );
                  })}
                  <TableCell sx={{ ...td, fontVariantNumeric: "tabular-nums", fontWeight: t.type.label.fontWeight, px: 2, textAlign: "right", ...(rate === null ? null : { color: rateColor[rateTone(rate)] }) }}>
                    {rate === null ? "—" : `${rate}%`}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Box>
    </Box>
  );
}
