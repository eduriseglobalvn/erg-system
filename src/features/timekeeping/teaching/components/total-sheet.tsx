import Box from "@mui/material/Box";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";

import { ergEnterpriseTokens as t } from "@/themes/erg-enterprise-tokens";
import type { TeachingPeriodPage, TeachingRole } from "../../api/timekeeping-teaching-api";
import { dayShading, groupByDay, hmVi, totalSummary, weekdayVi } from "../domain/teaching-model";
import { teachingTitle } from "../domain/teaching-copy";
import { gridTd, gridTh } from "./teaching-sheet-styles";

/** Column label and width in px, as the Total board (identical to the Excel «Total» sheet). Width 0 = the free column. */
const COLUMNS: ReadonlyArray<readonly [string, number, "center" | "left"]> = [
  ["Tháng", 52, "center"], ["Ngày", 48, "center"], ["Thứ", 40, "center"], ["Tiết", 40, "center"], ["Trường", 124, "left"], ["Từ", 56, "center"], ["Đến", 56, "center"],
  ["Lớp", 48, "center"], ["Cấp", 40, "center"], ["Môn", 72, "left"], ["Nội dung giảng dạy", 0, "left"], ["Giáo viên", 168, "left"],
];
const num = (value: string | undefined) => (value ? String(Number(value)) : "");

type Props = { data: TeachingPeriodPage; onPage: (page: number) => void; role: TeachingRole };

/** «Bảng chi tiết TKB» (Main board): header block, one grid row per period, Tháng/Ngày/Thứ merged over the periods of a day, alternate days shaded. */
export function TotalSheet({ data, onPage, role }: Props) {
  const rows = data.rows ?? [];
  const cells = groupByDay(rows);
  const shaded = dayShading(cells);
  const total = data.total ?? 0;
  return (
    <Box>
      <Box sx={{ alignItems: "flex-end", display: "flex", justifyContent: "space-between", pb: 1.5, pt: 2, px: 2 }}>
        <Box sx={{ ...t.type.label, color: t.color.textSecondary, lineHeight: 1.5 }}>CTY TNHH EDURISE GLOBAL<br />TRUNG TÂM TIN HỌC ERG</Box>
        <Box component="h2" sx={{ fontSize: "1rem", fontWeight: "fontWeightBold", m: 0, textTransform: "uppercase" }}>{teachingTitle("total", role)}</Box>
        <Box sx={{ ...t.type.note, color: "text.secondary", lineHeight: 1.5, textAlign: "right", width: 180 }}>{totalSummary(rows, total)}</Box>
      </Box>
      <TableContainer sx={{ maxHeight: "60vh" }}>
        <Table aria-label="Bảng chi tiết tiết dạy" stickyHeader sx={{ fontVariantNumeric: "tabular-nums", minWidth: 1100, tableLayout: "auto" }}>
          <TableHead>
            <TableRow>
              {COLUMNS.map(([name, width, align]) => <TableCell key={name} sx={{ ...gridTh, textAlign: align, ...(width ? { width } : null) }}>{name}</TableCell>)}
            </TableRow>
          </TableHead>
          <TableBody>
            {cells.map(({ daySpan, row }, i) => {
              const bg = shaded[i] ? { bgcolor: t.color.surfaceMuted } : null;
              return (
                <TableRow key={`${row.date}-${row.periodNo}-${row.className}-${i}`}>
                  {daySpan > 0 ? (
                    <>
                      <TableCell rowSpan={daySpan} sx={{ ...gridTd, ...bg, textAlign: "center" }}>{num((row.date ?? "").slice(5, 7))}</TableCell>
                      <TableCell rowSpan={daySpan} sx={{ ...gridTd, ...bg, textAlign: "center" }}>{num((row.date ?? "").slice(8, 10))}</TableCell>
                      <TableCell rowSpan={daySpan} sx={{ ...gridTd, ...bg, fontWeight: "fontWeightMedium", textAlign: "center" }}>{weekdayVi(row.weekday)}</TableCell>
                    </>
                  ) : null}
                  <TableCell sx={{ ...gridTd, ...bg, textAlign: "center" }}>{row.periodNo}</TableCell>
                  <TableCell sx={{ ...gridTd, ...bg }}>{row.schoolName}</TableCell>
                  <TableCell sx={{ ...gridTd, ...bg, textAlign: "center" }}>{hmVi(row.from)}</TableCell>
                  <TableCell sx={{ ...gridTd, ...bg, textAlign: "center" }}>{hmVi(row.to)}</TableCell>
                  <TableCell sx={{ ...gridTd, ...bg, textAlign: "center" }}>{row.className}</TableCell>
                  <TableCell sx={{ ...gridTd, ...bg, textAlign: "center" }}>{row.level}</TableCell>
                  <TableCell sx={{ ...gridTd, ...bg }}>{row.subjectName}</TableCell>
                  <TableCell sx={{ ...gridTd, ...bg, color: t.color.textSecondary }}>{row.lessonContent}</TableCell>
                  <TableCell sx={{ ...gridTd, ...bg }}>{row.teacherName}</TableCell>
                </TableRow>
              );
            })}
            <TableRow>
              <TableCell colSpan={COLUMNS.length - 1} sx={{ ...gridTd, bgcolor: t.color.surfaceSubtle, fontWeight: "fontWeightBold", textAlign: "right" }}>Tổng cộng</TableCell>
              <TableCell sx={{ ...gridTd, bgcolor: t.color.surfaceSubtle, fontWeight: "fontWeightBold" }}>{total} tiết</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
      {total > (data.size ?? 100) ? (
        <TablePagination
          component="div"
          count={total}
          labelDisplayedRows={({ count, from, to }) => `${from}–${to} / ${count}`}
          onPageChange={(_, next) => onPage(next)}
          page={data.page ?? 0}
          rowsPerPage={data.size ?? 100}
          rowsPerPageOptions={[]}
        />
      ) : null}
    </Box>
  );
}
