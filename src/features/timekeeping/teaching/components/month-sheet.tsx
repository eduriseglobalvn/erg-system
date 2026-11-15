import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";

import { ErgStatusChip } from "@/components/erg-mui/erg-feedback";
import { formatDateVi } from "@/domain/formatters/format-date";
import { ergEnterpriseTokens as t } from "@/themes/erg-enterprise-tokens";
import type { TeachingMonthSheet, TeachingRole } from "../../api/timekeeping-teaching-api";
import { confirmationText, teachingTitle } from "../domain/teaching-copy";
import { monthRange } from "../domain/teaching-model";

const num = { fontVariantNumeric: "tabular-nums", textAlign: "center" } as const;
const head = { bgcolor: t.color.surfaceMuted, whiteSpace: "nowrap" } as const;

type Props = { data: TeachingMonthSheet; month: string; onOpenTeacher: (teacherId: string) => void; role: TeachingRole };

/** «Bảng thống kê số tiết»: one row per teacher, school and subject; the name opens that teacher's periods in Total. */
export function MonthSheet({ data, month, onOpenTeacher, role }: Props) {
  const weeks = data.weeks ?? [];
  const rows = data.rows ?? [];
  const range = monthRange(month);
  const weekSum = (i: number) => rows.reduce((sum, r) => sum + (r.weekTotals?.[i] ?? 0), 0);
  return (
    <Box sx={{ border: 1, borderColor: "divider", borderRadius: `${t.radius.card}px`, overflow: "hidden" }}>
      <Box sx={{ p: 2, textAlign: "center" }}>
        <Typography component="h2" variant="subtitle1">{teachingTitle("month", role)}</Typography>
        <Typography color="text.secondary" component="div" variant="body2">(Từ ngày {formatDateVi(range.from)} đến {formatDateVi(range.to)})</Typography>
        <Box sx={{ display: "flex", gap: 1, justifyContent: "center", mt: 1 }}>
          <ErgStatusChip dot={false} label="Quyền Trưởng phòng ĐT" tone="neutral" />
          <ErgStatusChip dot={false} label={`${weeks.length} tuần`} tone="info" />
        </Box>
      </Box>
      <TableContainer>
        <Table aria-label="Bảng thống kê số tiết" size="small" sx={{ minWidth: 960 }}>
          <TableHead>
            <TableRow>
              {["Stt", "Trường liên kết", "Họ và tên giáo viên", "Môn dạy", "Lớp dạy"].map((name) => <TableCell key={name} sx={head}>{name}</TableCell>)}
              {weeks.map((week) => <TableCell key={week.index} sx={{ ...head, ...num }}>{week.label}</TableCell>)}
              <TableCell sx={{ ...head, ...num }}>Tổng số tiết</TableCell>
              <TableCell sx={head}>Ghi chú</TableCell>
              <TableCell sx={head}>GV xác nhận</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, i) => {
              const state = confirmationText(row.confirmation?.status, row.confirmation?.confirmedAt);
              return (
                <TableRow key={`${row.teacherId}-${row.schoolName}-${row.subjectName}`}>
                  <TableCell sx={num}>{i + 1}</TableCell>
                  <TableCell>{row.schoolName}</TableCell>
                  <TableCell>
                    <Link component="button" disabled={!row.teacherId} onClick={() => row.teacherId && onOpenTeacher(row.teacherId)} sx={{ textAlign: "left" }} type="button">{row.teacherName}</Link>
                  </TableCell>
                  <TableCell>{row.subjectName}</TableCell>
                  <TableCell>{row.classNames}</TableCell>
                  {weeks.map((week, w) => <TableCell key={week.index} sx={num}>{row.weekTotals?.[w] || ""}</TableCell>)}
                  <TableCell sx={num}>{row.total ?? 0}</TableCell>
                  <TableCell>{row.note ?? row.confirmation?.issueNote}</TableCell>
                  <TableCell><ErgStatusChip label={state.label} tone={state.tone} /></TableCell>
                </TableRow>
              );
            })}
            <TableRow>
              <TableCell colSpan={5} sx={{ bgcolor: t.color.surfaceMuted }}>Tổng cộng</TableCell>
              {weeks.map((week, w) => <TableCell key={week.index} sx={{ ...num, bgcolor: t.color.surfaceMuted }}>{weekSum(w)}</TableCell>)}
              <TableCell sx={{ ...num, bgcolor: t.color.surfaceMuted }}>{rows.reduce((sum, r) => sum + (r.total ?? 0), 0)}</TableCell>
              <TableCell colSpan={2} sx={{ bgcolor: t.color.surfaceMuted, textAlign: "center" }}>Giáo viên<Typography color="text.secondary" component="div" variant="caption">(Ký tên)</Typography></TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
