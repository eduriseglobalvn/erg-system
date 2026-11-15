import Box from "@mui/material/Box";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";

import { ergEnterpriseTokens as t } from "@/themes/erg-enterprise-tokens";
import type { MyTeachingMonth, TeachingRow } from "../../api/timekeeping-teaching-api";
import { columnTotal, dayMonthVi, groupTeachingRows, missingCells } from "../domain/teaching-model";

const num = { fontVariantNumeric: "tabular-nums", textAlign: "center" } as const;
const warnCell = { bgcolor: t.statusTint.error.bg, color: t.statusTint.error.color } as const;

type Weeks = NonNullable<MyTeachingMonth["weeks"]>;

/** «Theo tuần và lớp»: one table per «trường · môn · cấp», class × week, red cell = a period of that class still has no report. */
export function WeekMatrix({ data, rows, showCancelled = true, title }: { data: MyTeachingMonth; rows: readonly TeachingRow[]; showCancelled?: boolean; title: string }) {
  const weeks: Weeks = data.weeks ?? [];
  const missing = missingCells(data);
  const cancelled = (showCancelled ? data.cancelled ?? [] : []).filter((c) => rows.some((r) => r.className === c.className));
  return (
    <Box component="section" sx={{ border: 1, borderColor: "divider", borderRadius: `${t.radius.card}px`, p: 2 }}>
      <Typography component="h2" sx={{ mb: 1.5 }} variant="subtitle1">{title}</Typography>
      <Box sx={{ display: "grid", gap: 2 }}>
        {groupTeachingRows(rows).map((group) => (
          <TableContainer key={group.key}>
            <Table aria-label={group.title} size="small" sx={{ minWidth: 420 }}>
              <TableHead>
                <TableRow>
                  <TableCell>{group.title}</TableCell>
                  {weeks.map((week) => <TableCell key={week.index} sx={num}>Tuần {week.index}<Typography color="text.secondary" component="div" variant="caption">{week.label}</Typography></TableCell>)}
                  <TableCell sx={num}>Tổng</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {group.rows.map((row) => (
                  <TableRow key={row.className}>
                    <TableCell component="th" scope="row">{row.className}</TableCell>
                    {weeks.map((week, i) => (
                      <TableCell key={week.index} sx={{ ...num, ...(missing.has(`${i}|${row.className}`) ? warnCell : null) }}>{row.weekTotals?.[i] || "–"}</TableCell>
                    ))}
                    <TableCell sx={num}>{row.total ?? 0}</TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell component="th" scope="row">Cộng</TableCell>
                  {weeks.map((week, i) => <TableCell key={week.index} sx={num}>{columnTotal(group.rows, i)}</TableCell>)}
                  <TableCell sx={num}>{group.rows.reduce((sum, r) => sum + (r.total ?? 0), 0)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        ))}
      </Box>
      {cancelled.map((c) => (
        <Typography color="text.secondary" key={`${c.eventId}-${c.date}`} sx={{ mt: 1 }} variant="caption" component="div">
          Buổi {dayMonthVi(c.date)} lớp {c.className} bị huỷ nên không tính.
        </Typography>
      ))}
    </Box>
  );
}

/** Phone view (MyCongMobile): one row per week, «N tiết», with what is missing or cancelled under it. */
export function WeekList({ data }: { data: MyTeachingMonth }) {
  const weeks: Weeks = data.weeks ?? [];
  const rows = data.rows ?? [];
  return (
    <Box component="ul" sx={{ border: 1, borderColor: "divider", borderRadius: `${t.radius.card}px`, listStyle: "none", m: 0, p: 0 }}>
      {weeks.map((week, i) => {
        const missing = (data.missingReports ?? []).filter((m) => (m.date ?? "") >= (week.from ?? "") && (m.date ?? "") <= (week.to ?? "")).reduce((sum, m) => sum + (m.periodCount ?? 0), 0);
        const cancelled = (data.cancelled ?? []).filter((c) => (c.date ?? "") >= (week.from ?? "") && (c.date ?? "") <= (week.to ?? "")).length;
        const note = missing ? `Thiếu ${missing} tiết báo giảng` : cancelled ? `${cancelled} buổi huỷ, không tính` : "Đủ báo giảng";
        return (
          <Box component="li" key={week.index} sx={{ alignItems: "center", display: "flex", gap: 1, justifyContent: "space-between", p: 1.5, "& + &": { borderTop: 1, borderColor: "divider" } }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography component="div" variant="subtitle2">Tuần {week.index} · {week.label}</Typography>
              <Typography color={missing ? "error" : "text.secondary"} component="div" variant="caption">{note}{missing && cancelled ? ` · ${cancelled} buổi huỷ, không tính` : ""}</Typography>
            </Box>
            <Typography component="div" sx={{ fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }} variant="subtitle2">{columnTotal(rows, i)} tiết</Typography>
          </Box>
        );
      })}
    </Box>
  );
}
