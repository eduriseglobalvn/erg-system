import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";

import { ergEnterpriseTokens as t } from "@/themes/erg-enterprise-tokens";
import type { MyTeachingMonth, TeachingRow } from "../../api/timekeeping-teaching-api";
import { columnTotal, dayMonthVi, groupTeachingRows, missingCells, weekCaptionVi, weekLabelVi } from "../domain/teaching-model";

const cell = { ...t.type.small, borderBottom: `1px solid ${t.color.divider}`, color: "text.primary", fontVariantNumeric: "tabular-nums", px: 1, py: "10px", textAlign: "right" } as const;
const headCell = { ...t.type.note, bgcolor: t.color.surfaceMuted, borderBottom: 0, color: "text.secondary", fontWeight: "fontWeightMedium", px: 1, py: "9px", textAlign: "right" } as const;
const edge = { px: 2, textAlign: "left" } as const;

type Weeks = NonNullable<MyTeachingMonth["weeks"]>;

type Props = {
  data: MyTeachingMonth;
  /** Rendered after the table notes (the «Xem từng tiết ›» link). */
  footer?: ReactNode;
  rows: readonly TeachingRow[];
  showCancelled?: boolean;
  title: string;
};

/** «Theo tuần và lớp» (6.3): one card, class × week, one block per «trường · môn · cấp»; a red cell = the class has a period of that week with no report. */
export function WeekMatrix({ data, footer, rows, showCancelled = true, title }: Props) {
  const weeks: Weeks = data.weeks ?? [];
  const missing = missingCells(data);
  const cancelled = (showCancelled ? data.cancelled ?? [] : []).filter((c) => rows.some((r) => r.className === c.className));
  const groups = groupTeachingRows(rows);
  return (
    <Box component="section" sx={{ bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: `${t.radius.card}px`, overflow: "hidden" }}>
      {groups.map((group, g) => (
        <Box key={group.key}>
          <Box sx={{ alignItems: "center", borderBottom: `1px solid ${t.color.divider}`, borderTop: g ? `1px solid ${t.color.divider}` : 0, display: "flex", gap: 1, px: 2, py: 1.5 }}>
            {g === 0 ? <Box component="h2" sx={{ fontSize: "inherit", fontWeight: t.type.label.fontWeight, m: 0 }}>{title}</Box> : null}
            <Box component="span" sx={{ ...t.type.note, color: "text.secondary" }}>{group.title}</Box>
          </Box>
          <TableContainer>
            <Table aria-label={group.title} sx={{ minWidth: 420 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ ...headCell, ...edge }}>Lớp</TableCell>
                  {weeks.map((week) => (
                    <TableCell key={week.index} sx={headCell}>Tuần {week.index}<br /><Box component="span" sx={{ fontWeight: t.type.note.fontWeight }}>{weekLabelVi(week.label)}</Box></TableCell>
                  ))}
                  <TableCell sx={{ ...headCell, ...edge, color: "text.primary", fontWeight: t.type.label.fontWeight, textAlign: "right" }}>Tổng</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {group.rows.map((row) => (
                  <TableRow key={row.className}>
                    <TableCell component="th" scope="row" sx={{ ...cell, ...edge, fontWeight: "fontWeightMedium" }}>{row.className}</TableCell>
                    {weeks.map((week, i) => {
                      const value = row.weekTotals?.[i] ?? 0;
                      const red = missing.has(`${i}|${row.className}`);
                      return (
                        <TableCell key={week.index} sx={{ ...cell, ...(red ? { bgcolor: t.statusTint.error.bg, color: t.statusTint.error.color, fontWeight: t.type.label.fontWeight } : value ? null : { color: "text.secondary" }) }}>{value || "–"}</TableCell>
                      );
                    })}
                    <TableCell sx={{ ...cell, ...edge, fontWeight: t.type.label.fontWeight, textAlign: "right" }}>{row.total ?? 0}</TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell component="th" scope="row" sx={{ ...cell, ...edge, bgcolor: t.color.surfaceMuted, borderBottom: 0, fontWeight: t.type.label.fontWeight }}>Cộng</TableCell>
                  {weeks.map((week, i) => <TableCell key={week.index} sx={{ ...cell, bgcolor: t.color.surfaceMuted, borderBottom: 0, fontWeight: t.type.label.fontWeight }}>{columnTotal(group.rows, i)}</TableCell>)}
                  <TableCell sx={{ ...cell, ...edge, bgcolor: t.color.surfaceMuted, borderBottom: 0, fontWeight: "fontWeightBold", textAlign: "right" }}>{group.rows.reduce((sum, r) => sum + (r.total ?? 0), 0)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      ))}
      <Box sx={{ ...t.type.note, color: "text.secondary", px: 2, py: "10px" }}>
        {showCancelled ? "Ô đỏ = tuần có tiết chưa báo giảng. " : ""}
        {cancelled.map((c) => `Buổi ${dayMonthVi(c.date)} lớp ${c.className} bị huỷ nên không tính. `)}
        {footer}
      </Box>
    </Box>
  );
}

/** Phone view (6.4): one row per week, «N tiết», with what is missing or cancelled under it. */
export function WeekList({ data }: { data: MyTeachingMonth }) {
  const weeks: Weeks = data.weeks ?? [];
  const rows = data.rows ?? [];
  return (
    <Box component="ul" sx={{ bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: `${t.radius.card}px`, listStyle: "none", m: 0, overflow: "hidden", p: 0 }}>
      {weeks.map((week, i) => {
        const missing = (data.missingReports ?? []).filter((m) => (m.date ?? "") >= (week.from ?? "") && (m.date ?? "") <= (week.to ?? "")).reduce((sum, m) => sum + (m.periodCount ?? 0), 0);
        const cancelled = (data.cancelled ?? []).filter((c) => (c.date ?? "") >= (week.from ?? "") && (c.date ?? "") <= (week.to ?? "")).length;
        const note = missing ? `Thiếu ${missing} tiết báo giảng` : cancelled ? `${cancelled} buổi huỷ, không tính` : "Đủ báo giảng";
        return (
          <Box component="li" key={week.index} sx={{ alignItems: "center", display: "flex", gap: "10px", minHeight: 52, px: 1.75, ...(i ? { borderTop: `1px solid ${t.color.divider}` } : null) }}>
            <Box sx={{ display: "flex", flex: 1, flexDirection: "column", minWidth: 0 }}>
              <Box component="span" sx={{ fontWeight: "fontWeightMedium" }}>Tuần {week.index} · {weekCaptionVi(week)}</Box>
              <Box component="span" sx={{ ...t.type.note, ...(missing ? { color: t.color.brandRed, fontWeight: t.type.label.fontWeight } : { color: "text.secondary" }) }}>{note}{missing && cancelled ? ` · ${cancelled} buổi huỷ, không tính` : ""}</Box>
            </Box>
            <Box component="strong" sx={{ fontVariantNumeric: "tabular-nums", fontWeight: t.type.label.fontWeight, whiteSpace: "nowrap" }}>{columnTotal(rows, i)} tiết</Box>
            <Box aria-hidden component="span" sx={{ color: "text.secondary" }}>›</Box>
          </Box>
        );
      })}
    </Box>
  );
}
