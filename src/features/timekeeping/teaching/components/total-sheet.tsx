import Box from "@mui/material/Box";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableFooter from "@mui/material/TableFooter";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";

import { ergEnterpriseTokens as t } from "@/themes/erg-enterprise-tokens";
import type { TeachingPeriodPage, TeachingRole } from "../../api/timekeeping-teaching-api";
import { groupByDay, hhmm, weekdayVi } from "../domain/teaching-model";
import { teachingTitle } from "../domain/teaching-copy";

const COLUMNS = ["Tháng", "Ngày", "Thứ", "Tiết", "Trường", "Từ", "Đến", "Lớp", "Cấp", "Môn", "Nội dung giảng dạy", "Giáo viên"];
const mono = { fontVariantNumeric: "tabular-nums" } as const;
const merged = { borderRight: 1, borderColor: "divider", textAlign: "center", verticalAlign: "top", ...mono } as const;

type Props = { data: TeachingPeriodPage; onPage: (page: number) => void; role: TeachingRole };

/** «Bảng chi tiết TKB»: one row per period, Tháng/Ngày/Thứ merged over the periods of the same day. */
export function TotalSheet({ data, onPage, role }: Props) {
  const cells = groupByDay(data.rows ?? []);
  return (
    <Box sx={{ border: 1, borderColor: "divider", borderRadius: `${t.radius.card}px`, overflow: "hidden" }}>
      <Box sx={{ p: 2, textAlign: "center" }}>
        <Typography component="div" variant="subtitle2">CTY TNHH EDURISE GLOBAL</Typography>
        <Typography component="div" variant="subtitle2">TRUNG TÂM TIN HỌC ERG</Typography>
        <Typography component="h2" sx={{ textTransform: "uppercase" }} variant="subtitle1">{teachingTitle("total", role)}</Typography>
      </Box>
      <TableContainer sx={{ maxHeight: "60vh" }}>
        <Table aria-label="Bảng chi tiết tiết dạy" size="small" stickyHeader sx={{ minWidth: 1100 }}>
          <TableHead>
            <TableRow>{COLUMNS.map((name) => <TableCell key={name} sx={{ bgcolor: t.color.surfaceMuted, whiteSpace: "nowrap" }}>{name}</TableCell>)}</TableRow>
          </TableHead>
          <TableBody>
            {cells.map(({ daySpan, row }, i) => (
              <TableRow key={`${row.date}-${row.periodNo}-${row.className}-${i}`}>
                {daySpan > 0 ? (
                  <>
                    <TableCell rowSpan={daySpan} sx={merged}>{(row.date ?? "").slice(5, 7)}</TableCell>
                    <TableCell rowSpan={daySpan} sx={merged}>{(row.date ?? "").slice(8, 10)}</TableCell>
                    <TableCell rowSpan={daySpan} sx={merged}>{weekdayVi(row.weekday)}</TableCell>
                  </>
                ) : null}
                <TableCell sx={{ ...mono, textAlign: "center" }}>{row.periodNo}</TableCell>
                <TableCell>{row.schoolName}</TableCell>
                <TableCell sx={mono}>{hhmm(row.from)}</TableCell>
                <TableCell sx={mono}>{hhmm(row.to)}</TableCell>
                <TableCell>{row.className}</TableCell>
                <TableCell>{row.level}</TableCell>
                <TableCell>{row.subjectName}</TableCell>
                <TableCell>{row.lessonContent}</TableCell>
                <TableCell>{row.teacherName}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter sx={{ bottom: 0, position: "sticky" }}>
            <TableRow>
              <TableCell colSpan={COLUMNS.length} sx={{ bgcolor: t.color.surfaceMuted, color: "text.primary" }}>Tổng cộng · {data.total ?? 0} tiết</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </TableContainer>
      {(data.total ?? 0) > (data.size ?? 100) ? (
        <TablePagination
          component="div"
          count={data.total ?? 0}
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
