import { Fragment, useMemo } from "react";
import Box from "@mui/material/Box";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";

import { ErgTable } from "@/components/erg-mui/erg-table";
import type { TeachingOverviewGrid } from "@/features/teaching-calendar/api/teaching-calendar-overview-api";
import { buildOverviewRows, overviewCellKind, type OverviewCell } from "@/features/teaching-calendar/domain/overview-model";
import { addDaysToDate, dayLabel, weekdayName } from "@/features/teaching-calendar/domain/schedule-copy";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";
import { scheduleCellSx, scheduleTokens } from "../shared/schedule-cell-sx";

const FIXED = [56, 64, 48, 100] as const;
const LEFT = FIXED.map((_, index) => FIXED.slice(0, index).reduce((sum, width) => sum + width, 0));
const LINE = 28;
const ROW_FIELDS = ["className", "roomName", "teacherName", "assistantName"] as const;
const FIELD_LABELS = ["Lớp", "Phòng", "Giáo viên", "Trợ giảng"] as const;

type Props = { grid: TeachingOverviewGrid; onOpenCell: (cell: OverviewCell | null, schoolId: string, weekday: number, periodNo: number) => void };

const stickyLeft = (index: number, header = false) => ({
  bgcolor: "background.paper", left: LEFT[index], minWidth: FIXED[index], position: "sticky", width: FIXED[index], zIndex: header ? 4 : 2,
}) as const;

function Lines({ cells, field, off, onOpen }: { cells: readonly OverviewCell[]; field: (typeof ROW_FIELDS)[number]; off: boolean; onOpen: (cell: OverviewCell) => void }) {
  return (
    <>
      {cells.map((cell) => {
        const value = cell[field];
        const assistant = field === "assistantName";
        return (
          <Box
            key={cell.eventId ?? `${cell.className}-${cell.roomName}`} onDoubleClick={() => onOpen(cell)}
            sx={[{ alignItems: "center", display: "flex", height: LINE, px: 0.75, typography: "body2" }, scheduleCellSx(off ? "off" : overviewCellKind(cell)),
              assistant && value ? { color: scheduleTokens.published.text, fontWeight: 600 } : {}] as never}
          >
            {assistant && value ? `TG ${value}` : value ?? ""}
          </Box>
        );
      })}
    </>
  );
}

/** Luoi bang tong theo truong (6.6): 4 cot dinh trai (Thu/Buoi/Tiet/Gio), moi truong mot nhom Lop/Phong/GV/Tro giang, cot cuoi Ghi chu. */
export function OverviewSchoolGrid({ grid, onOpenCell }: Props) {
  const rows = useMemo(() => buildOverviewRows(grid), [grid]);
  const perDay = rows.filter((row) => row.weekday === 1).length;
  return (
    <TableContainer sx={{ border: 1, borderColor: "divider", borderRadius: `${ergEnterpriseTokens.radius.card}px`, maxHeight: "75vh" }}>
      <ErgTable aria-label="Bảng tổng thời khoá biểu" size="small" sx={{ borderCollapse: "separate", tableLayout: "fixed", width: "max-content" }}>
        <TableHead>
          <TableRow>
            {["Thứ", "Buổi", "Tiết", "Giờ"].map((label, index) => <TableCell key={label} rowSpan={2} sx={stickyLeft(index, true)}>{label}</TableCell>)}
            {grid.schools.map((school) => (
              <TableCell colSpan={4} key={school.schoolId} sx={{ borderLeft: 1, borderColor: "divider", textAlign: "center" }}>
                {school.schoolName} · {school.periodCount} tiết
              </TableCell>
            ))}
            <TableCell rowSpan={2} sx={{ borderLeft: 1, borderColor: "divider", width: 320 }}>Ghi chú</TableCell>
          </TableRow>
          <TableRow>
            {grid.schools.flatMap((school) => FIELD_LABELS.map((label, index) => (
              <TableCell key={`${school.schoolId}-${label}`} sx={{ borderLeft: index === 0 ? 1 : 0, borderColor: "divider", top: 37, width: 96 }}>{label}</TableCell>
            )))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, index) => {
            const firstOfDay = index % perDay === 0;
            const firstOfSession = firstOfDay || rows[index - 1].slot.session !== row.slot.session;
            const sessionSpan = rows.filter((other) => other.weekday === row.weekday && other.slot.session === row.slot.session).length;
            const lines = Math.max(1, ...grid.schools.map((school) => row.cells.get(school.schoolId)?.length ?? 0));
            const off = Boolean(row.holiday);
            return (
              <Fragment key={`${row.weekday}-${row.slot.periodNo}`}>
                <TableRow sx={{ "& td": { borderTop: firstOfDay ? 2 : undefined, verticalAlign: "top" } }}>
                  {firstOfDay ? (
                    <TableCell rowSpan={perDay} sx={stickyLeft(0)}>
                      <Typography sx={{ typography: "subtitle2" }}>{weekdayName(row.weekday)}</Typography>
                      <Typography sx={{ color: "text.secondary", typography: "caption" }}>{dayLabel(addDaysToDate(grid.weekStart, row.weekday - 1)).split(", ")[1]}</Typography>
                    </TableCell>
                  ) : null}
                  {firstOfSession ? <TableCell rowSpan={sessionSpan} sx={stickyLeft(1)}>{row.slot.session === "MORNING" ? "Sáng" : "Chiều"}</TableCell> : null}
                  <TableCell sx={stickyLeft(2)}>{row.slot.periodNo}</TableCell>
                  <TableCell sx={stickyLeft(3)}>{row.slot.startTime}–{row.slot.endTime}</TableCell>
                  {grid.schools.flatMap((school) => ROW_FIELDS.map((field, fieldIndex) => {
                    const cells = row.cells.get(school.schoolId) ?? [];
                    return (
                      <TableCell key={`${school.schoolId}-${field}`} onDoubleClick={() => !cells.length && onOpenCell(null, school.schoolId, row.weekday, row.slot.periodNo)} sx={{ borderLeft: fieldIndex === 0 ? 1 : 0, borderColor: "divider", minHeight: lines * LINE, p: 0, ...(off && !cells.length ? scheduleCellSx("off") : {}) } as never}>
                        <Lines cells={cells} field={field} off={off} onOpen={(cell) => onOpenCell(cell, school.schoolId, row.weekday, row.slot.periodNo)} />
                        {!cells.length ? <Box sx={{ height: LINE }} /> : null}
                      </TableCell>
                    );
                  }))}
                  <TableCell sx={{ borderLeft: 1, borderColor: "divider", color: row.note.startsWith("⚠") ? scheduleTokens.clash.text : "text.secondary", typography: "caption" }}>
                    {[row.holiday, row.note].filter(Boolean).join(" · ")}
                  </TableCell>
                </TableRow>
              </Fragment>
            );
          })}
        </TableBody>
      </ErgTable>
    </TableContainer>
  );
}
