import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";

import { ErgTable } from "@/components/erg-mui/erg-table";
import { ergEnterpriseTokens as t } from "@/themes/erg-enterprise-tokens";

import { weekdayVi, shortDateVi } from "../domain/class-log-week";
import { headCellSx } from "../components/class-log-ui";
import type { LessonReportMatrix, LessonReportRow } from "./lesson-report-api";
import { dayHead, reportText, rowRate, type ReportState } from "./lesson-report-model";

const tones: Record<ReportState, { bg: string; color: string }> = {
  ON_TIME: t.statusTint.success, LATE: t.statusTint.warning, MISSING: t.statusTint.error, NONE: t.statusTint.neutral,
};
const legend: ReportState[] = ["ON_TIME", "LATE", "MISSING", "NONE"];

export type CellPick = { teacherId: string; date: string };

type Props = { matrix: LessonReportMatrix; rows: ReadonlyArray<LessonReportRow>; picked: CellPick | null; onPick: (pick: CellPick) => void };

/** «Giáo viên × ngày dạy»: one coloured button per teacher and day, with the legend on top. */
export function LessonReportGrid({ matrix, rows, picked, onPick }: Props) {
  return (
    <Box sx={{ bgcolor: "background.paper", border: `1px solid ${t.color.border}`, borderRadius: `${t.radius.card}px`, flex: 1, minWidth: 0, overflow: "hidden" }}>
      <Box sx={{ alignItems: "center", borderBottom: `1px solid ${t.color.divider}`, color: t.color.textSecondary, display: "flex", flexWrap: "wrap", fontSize: t.type.label.fontSize, gap: 2, px: 2, py: 1.5 }}>
        <Box component="strong" sx={{ color: "text.primary", flex: 1, fontSize: t.type.small.fontSize, fontWeight: t.type.label.fontWeight }}>Giáo viên × ngày dạy</Box>
        {legend.map((state) => (
          <Box component="span" key={state} sx={{ alignItems: "center", display: "inline-flex", gap: 0.75 }}>
            <Box component="span" sx={{ bgcolor: tones[state].bg, borderRadius: "3px", display: "inline-block", height: 10, width: 10 }} />
            {reportText.states[state]}
          </Box>
        ))}
      </Box>
      <Box sx={{ overflowX: "auto" }}>
        <ErgTable aria-label="Báo giảng theo giáo viên và ngày" sx={{ minWidth: 640 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={headCellSx}>Giáo viên</TableCell>
              {matrix.days.map((date) => <TableCell key={date} sx={{ ...headCellSx, textAlign: "center" }}>{dayHead(date)}</TableCell>)}
              <TableCell sx={{ ...headCellSx, textAlign: "right" }}>Đúng hạn</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => {
              const rate = rowRate(row);
              return (
                <TableRow key={row.teacherId} selected={picked?.teacherId === row.teacherId}>
                  <TableCell sx={{ borderBottom: `1px solid ${t.color.divider}`, py: 1, px: 2 }}>
                    <Box sx={{ display: "flex", flexDirection: "column" }}>
                      <Box component="span" sx={{ fontSize: t.type.small.fontSize, fontWeight: t.type.label.fontWeight }}>{row.teacherName}</Box>
                      <Box component="span" sx={{ color: t.color.textMuted, fontSize: t.type.label.fontSize, fontWeight: t.type.small.fontWeight }}>{row.schoolName}</Box>
                    </Box>
                  </TableCell>
                  {row.cells.map((cell) => {
                    const on = picked?.teacherId === row.teacherId && picked.date === cell.date;
                    return (
                      <TableCell key={cell.date} sx={{ borderBottom: `1px solid ${t.color.divider}`, px: 0.5, py: 0.75 }}>
                        <ButtonBase
                          aria-label={`${row.teacherName} · ${weekdayVi(cell.date)} ${shortDateVi(cell.date)} · ${reportText.states[cell.state]}`}
                          aria-pressed={on}
                          onClick={() => onPick({ teacherId: row.teacherId, date: cell.date })}
                          sx={{ bgcolor: tones[cell.state].bg, color: tones[cell.state].color, ...t.type.label, borderRadius: "8px", height: 34, outline: on ? `2px solid ${t.color.primary}` : "none", width: "100%" }}
                        >
                          {reportText.marks[cell.state]}
                        </ButtonBase>
                      </TableCell>
                    );
                  })}
                  <TableCell sx={{ borderBottom: `1px solid ${t.color.divider}`, fontVariantNumeric: "tabular-nums", fontWeight: t.type.label.fontWeight, px: 2, py: 1, textAlign: "right" }}>
                    {rate === null ? "—" : `${rate}%`}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </ErgTable>
      </Box>
    </Box>
  );
}
