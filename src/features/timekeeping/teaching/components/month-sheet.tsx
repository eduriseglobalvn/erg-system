import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";

import { ErgStatusChip } from "@/components/erg-mui/erg-feedback";
import { formatDateVi, todayInput } from "@/domain/formatters/format-date";
import { ergEnterpriseTokens as t } from "@/themes/erg-enterprise-tokens";
import type { TeachingMonthSheet, TeachingRole } from "../../api/timekeeping-teaching-api";
import { confirmationText, teachingTitle } from "../domain/teaching-copy";
import { monthRange, schoolSpans, weekLabelVi, weekNotStarted } from "../domain/teaching-model";
import { gridTd, gridTh } from "./teaching-sheet-styles";

const center = { textAlign: "center" } as const;
const foot = { ...gridTd, bgcolor: t.color.surfaceMuted, fontWeight: "fontWeightBold" } as const;

type Props = { data: TeachingMonthSheet; month: string; onOpenTeacher: (teacherId: string) => void; role: TeachingRole };

/** «Bảng thống kê số tiết» (CongThang boards): two header rows, one row per teacher × school × subject, the school cell merged, a total row and the «Giáo viên (Ký tên)» box. */
export function MonthSheet({ data, month, onOpenTeacher, role }: Props) {
  const weeks = data.weeks ?? [];
  const rows = data.rows ?? [];
  const range = monthRange(month);
  const today = todayInput();
  const spans = schoolSpans(rows);
  const weekSum = (i: number) => rows.reduce((sum, r) => sum + (r.weekTotals?.[i] ?? 0), 0);
  const fixed = (label: string, width: number) => <TableCell key={label} rowSpan={2} sx={{ ...gridTh, width }}>{label}</TableCell>;
  return (
    <Box sx={{ px: 3, py: 2.5 }}>
      <Box sx={{ ...t.type.label, color: t.color.textSecondary, lineHeight: 1.5 }}>CTY TNHH EDURISE GLOBAL<br />TRUNG TÂM TIN HỌC ERG</Box>
      <Box sx={{ mb: 2, mt: 1.5, textAlign: "center" }}>
        <Box component="h2" sx={{ fontSize: "1rem", fontWeight: "fontWeightBold", m: 0 }}>{teachingTitle("month", role)}</Box>
        <Box sx={{ ...t.type.small, color: t.color.textSecondary, mt: 0.5 }}>(Từ ngày {formatDateVi(range.from)} đến {formatDateVi(range.to)})</Box>
      </Box>
      <Box sx={{ ...t.type.small, alignItems: "center", bgcolor: t.color.primarySofter, borderRadius: `${t.radius.control}px`, color: t.statusTint.info.color, display: "flex", gap: "10px", mb: 1.5, px: "14px", py: "10px" }}>
        <Box component="strong" sx={{ fontWeight: t.type.label.fontWeight }}>Quyền Trưởng phòng ĐT</Box>
        <Box component="span" sx={{ color: t.color.textSecondary, ml: "auto" }}>{weeks.length} tuần</Box>
      </Box>
      <TableContainer>
        <Table aria-label="Bảng thống kê số tiết" sx={{ fontVariantNumeric: "tabular-nums", minWidth: 960 }}>
          <TableHead>
            <TableRow>
              {fixed("Stt", 40)}
              {fixed("Trường liên kết", 120)}
              {fixed("Họ và tên giáo viên", 150)}
              {fixed("Môn dạy", 96)}
              <TableCell rowSpan={2} sx={gridTh}>Lớp dạy</TableCell>
              <TableCell colSpan={Math.max(weeks.length, 1)} sx={gridTh}>Tháng {month.slice(5)}</TableCell>
              {fixed("Tổng số tiết", 60)}
              {fixed("Ghi chú", 120)}
              {fixed("GV xác nhận", 92)}
            </TableRow>
            <TableRow>
              {weeks.map((week) => <TableCell key={week.index} sx={{ ...gridTh, width: 48 }}>{weekLabelVi(week.label)}</TableCell>)}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, i) => {
              const state = confirmationText(row.confirmation?.status, row.confirmation?.confirmedAt);
              return (
                <TableRow key={`${row.teacherId}-${row.schoolName}-${row.subjectName}`}>
                  <TableCell sx={{ ...gridTd, ...center }}>{i + 1}</TableCell>
                  {spans[i] > 0 ? <TableCell rowSpan={spans[i]} sx={{ ...gridTd, fontWeight: "fontWeightMedium" }}>{row.schoolName}</TableCell> : null}
                  <TableCell sx={gridTd}>
                    <Link color="inherit" component="button" disabled={!row.teacherId} onClick={() => row.teacherId && onOpenTeacher(row.teacherId)} sx={{ font: "inherit", fontWeight: "fontWeightMedium", textAlign: "left", textDecoration: "none" }} title="Xem từng tiết trong bảng Total" type="button">{row.teacherName}</Link>
                  </TableCell>
                  <TableCell sx={gridTd}>{row.subjectName}</TableCell>
                  <TableCell sx={{ ...gridTd, whiteSpace: "normal" }}>{row.classNames}</TableCell>
                  {weeks.map((week, w) => {
                    const value = row.weekTotals?.[w] ?? 0;
                    if (!value && weekNotStarted(week, today)) return <TableCell key={week.index} sx={{ ...gridTd, bgcolor: t.color.surfaceMuted }} />;
                    return <TableCell key={week.index} sx={{ ...gridTd, ...center, ...(value ? null : { color: t.classLog.placeholder }) }}>{value || "–"}</TableCell>;
                  })}
                  <TableCell sx={{ ...gridTd, ...center, fontWeight: "fontWeightBold" }}>{row.total ?? 0}</TableCell>
                  <TableCell sx={{ ...gridTd, color: t.color.textSecondary, whiteSpace: "normal" }}>{row.note ?? row.confirmation?.issueNote}</TableCell>
                  <TableCell sx={{ ...gridTd, ...center }}>
                    <ErgStatusChip dot={false} label={state.label} sx={{ "& .MuiChip-label": { px: "10px" } }} tone={state.tone} />
                  </TableCell>
                </TableRow>
              );
            })}
            <TableRow>
              <TableCell colSpan={5} sx={{ ...foot, textAlign: "right" }}>Tổng cộng</TableCell>
              {weeks.map((week, w) => <TableCell key={week.index} sx={{ ...foot, ...center }}>{!weekSum(w) && weekNotStarted(week, today) ? "" : weekSum(w)}</TableCell>)}
              <TableCell sx={{ ...foot, ...center }}>{rows.reduce((sum, r) => sum + (r.total ?? 0), 0)}</TableCell>
              <TableCell colSpan={2} sx={foot} />
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
      <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
        <Box sx={{ ...t.type.small, textAlign: "center", width: 240 }}>
          <Box sx={{ fontWeight: "fontWeightBold" }}>Giáo viên</Box>
          <Box sx={{ color: "text.secondary", fontStyle: "italic" }}>(Ký tên)</Box>
        </Box>
      </Box>
    </Box>
  );
}
