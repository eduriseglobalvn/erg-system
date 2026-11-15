import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";

import { ErgTable } from "@/components/erg-mui/erg-table";
import type { TeachingReusePreview } from "@/features/teaching-calendar/api/teaching-calendar-reuse-api";
import { conflictLines } from "@/features/teaching-calendar/domain/conflict-copy";
import { compactWeekRange } from "@/features/teaching-calendar/domain/schedule-copy";
import { formatDateVi } from "@/domain/formatters/format-date";

type Week = TeachingReusePreview["weeks"][number];

/** Cot «Chi tiết» (6.5): ngay le + so tiet bo, hoac cau trung dau tien, hoac «Như tuần gốc». */
export function reuseWeekDetail(week: Week): string {
  const holiday = week.holidays[0];
  if (holiday && week.skipped > 0) return `${formatDateVi(holiday.date).slice(0, 5)} ${holiday.name} · bỏ ${week.skipped} tiết`;
  const first = week.conflictDetails[0];
  if (first) {
    const source = first.other?.batchLabel ? ` (${first.other.batchLabel}, ${first.other.batchStatus === "PUBLISHED" ? "đã xuất bản" : "nháp"})` : "";
    return `${conflictLines(first).otherLine}${source}`;
  }
  return "Như tuần gốc";
}

/** Bang xem truoc (6.5): Tuan | Sẽ tạo | Bỏ qua | Trùng | Chi tiết. */
export function ReusePreviewTable({ weeks }: { weeks: readonly Week[] }) {
  return (
    <ErgTable aria-label="Xem trước các tuần sẽ tạo" size="small">
      <TableHead>
        <TableRow>
          <TableCell>Tuần</TableCell>
          <TableCell align="right">Sẽ tạo</TableCell>
          <TableCell align="right">Bỏ qua</TableCell>
          <TableCell align="right">Trùng</TableCell>
          <TableCell>Chi tiết</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {weeks.map((week) => (
          <TableRow key={week.weekStart}>
            <TableCell>{compactWeekRange(week.weekStart)}</TableCell>
            <TableCell align="right">{week.toCreate}</TableCell>
            <TableCell align="right">{week.skipped}</TableCell>
            <TableCell align="right">{week.conflicts}</TableCell>
            <TableCell sx={{ maxWidth: 360 }}>
              <Typography noWrap sx={{ typography: "body2" }} title={reuseWeekDetail(week)}>{reuseWeekDetail(week)}</Typography>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </ErgTable>
  );
}
