import Box from "@mui/material/Box";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";

import { ErgTable } from "@/components/erg-mui/erg-table";
import { ergEnterpriseTokens as t } from "@/themes/erg-enterprise-tokens";

import type { ClassLogWeek } from "../api/class-log-api";
import { absenteesText, classLogText } from "../domain/class-log-copy";
import { summarizeClassWeek } from "../domain/class-log-model";
import { shortDateVi, weekdayVi } from "../domain/class-log-week";

const line = `1px solid ${t.color.border}`;
const dotted = `1px dotted ${t.color.border}`;
const th = { border: line, bgcolor: t.color.surfaceMuted, ...t.type.label, px: 0.5, py: 0.75, textAlign: "center" } as const;
const numberRow = { ...th, bgcolor: "background.paper", color: t.color.textMuted, fontStyle: "italic", fontWeight: t.type.small.fontWeight } as const;
const td = { border: line, fontSize: t.type.label.fontSize, px: 0.75, py: 0.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } as const;
const noScore = "—";

/** The paper log of a class (board SoDauBaiLop): every subject, one row per period. Scores and the weekly rank are display only. */
export function ClassBookTable({ week }: { week: ClassLogWeek }) {
  const summary = summarizeClassWeek(week);
  const days = week.days.filter((d) => d.periods.length > 0);
  return (
    <Box sx={{ bgcolor: "background.paper", border: line, borderRadius: `${t.radius.card}px`, display: "flex", flex: 1, minHeight: 0, overflow: "hidden" }}>
      <Box sx={{ flex: 1, minWidth: 0, overflow: "auto" }}>
        <ErgTable aria-label="Sổ đầu bài lớp" sx={{ minWidth: 980, tableLayout: "fixed" }}>
          <TableHead>
            <TableRow>
              <TableCell rowSpan={2} sx={{ ...th, width: 76 }}>Thứ, ngày</TableCell>
              <TableCell rowSpan={2} sx={{ ...th, width: 40 }}>Tiết</TableCell>
              <TableCell rowSpan={2} sx={{ ...th, width: 90 }}>Môn</TableCell>
              <TableCell rowSpan={2} sx={{ ...th, width: 56 }}>Tiết PPCT</TableCell>
              <TableCell rowSpan={2} sx={{ ...th, width: 60 }}>Tiết thực tế</TableCell>
              <TableCell rowSpan={2} sx={{ ...th, width: 130 }}>Học sinh vắng</TableCell>
              <TableCell rowSpan={2} sx={th}>Tên bài học</TableCell>
              <TableCell rowSpan={2} sx={{ ...th, width: 150 }}>Nhận xét</TableCell>
              <TableCell colSpan={3} sx={th}>Điểm</TableCell>
              <TableCell rowSpan={2} sx={{ ...th, width: 54 }}>Tổng điểm</TableCell>
              <TableCell rowSpan={2} sx={{ ...th, width: 78 }}>GV dạy kí tên</TableCell>
            </TableRow>
            <TableRow>
              {["Học tập", "Kỷ luật", "Vệ sinh"].map((label) => <TableCell key={label} sx={{ ...th, fontWeight: "fontWeightMedium", width: 52 }}>{label}</TableCell>)}
            </TableRow>
            <TableRow>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => <TableCell key={n} sx={numberRow}>{n}</TableCell>)}
              <TableCell colSpan={3} sx={numberRow}>9</TableCell>
              {[10, 11].map((n) => <TableCell key={n} sx={numberRow}>{n}</TableCell>)}
            </TableRow>
          </TableHead>
          <TableBody>
            {days.flatMap((day) => [...day.periods].sort((a, b) => a.periodNo - b.periodNo).map((p, i, all) => {
              const signed = p.status === "CONFIRMED";
              const unsigned = p.happened && !signed;
              const bottom = i === all.length - 1 ? line : dotted;
              return (
                <TableRow key={`${p.eventId}|${p.date}|${p.periodNo}`} sx={unsigned ? { bgcolor: t.statusTint.error.bg } : undefined}>
                  {i === 0 ? (
                    <TableCell rowSpan={all.length} sx={{ ...td, bgcolor: "background.paper", textAlign: "center", verticalAlign: "top" }}>
                      <Box sx={{ fontWeight: t.type.label.fontWeight }}>{weekdayVi(day.date)}</Box>
                      <Box sx={{ color: t.color.textMuted }}>{shortDateVi(day.date)}</Box>
                    </TableCell>
                  ) : null}
                  <TableCell sx={{ ...td, borderBottom: bottom, color: t.color.textMuted, textAlign: "center" }}>{p.periodNo}</TableCell>
                  <TableCell sx={{ ...td, borderBottom: bottom, fontWeight: "fontWeightMedium" }}>{p.subjectName}</TableCell>
                  <TableCell sx={{ ...td, borderBottom: bottom, textAlign: "center" }}>{p.ppctPeriod}</TableCell>
                  <TableCell sx={{ ...td, borderBottom: bottom, fontWeight: t.type.label.fontWeight, textAlign: "center" }}>{p.actualPeriod}</TableCell>
                  <TableCell sx={{ ...td, borderBottom: bottom, color: p.absentees.length ? t.color.brandRedHover : undefined }}>{p.absentees.length ? absenteesText(p.absentees) : ""}</TableCell>
                  <TableCell sx={{ ...td, borderBottom: bottom }}>{p.lessonTitle ?? classLogText.noLesson}</TableCell>
                  <TableCell sx={{ ...td, borderBottom: bottom, color: t.color.textSecondary }}>{p.comment ?? ""}</TableCell>
                  {[0, 1, 2, 3].map((n) => <TableCell key={n} sx={{ ...td, borderBottom: bottom, color: t.color.textSoft, textAlign: "center" }}>{noScore}</TableCell>)}
                  <TableCell sx={{ ...td, borderBottom: bottom, color: unsigned ? t.color.brandRedHover : undefined, fontWeight: t.type.label.fontWeight, textAlign: "center" }}>
                    {signed ? (p.teacherName || "Đã kí") : unsigned ? classLogText.unsigned : ""}
                  </TableCell>
                </TableRow>
              );
            }))}
          </TableBody>
        </ErgTable>
      </Box>
      <WeekSummary absence={summary.absenceText} unsigned={summary.unsignedText} unsignedCount={summary.unsignedCount} />
    </Box>
  );
}

function WeekSummary({ absence, unsigned, unsignedCount }: { absence: string; unsigned: string; unsignedCount: number }) {
  const rows: Array<[string, string, boolean?]> = [
    ["Vắng:", absence], ["Đi học muộn:", noScore], ["Vi phạm khác:", noScore], ["Học tập:", noScore], ["Kỷ luật:", noScore], ["Vệ sinh:", noScore],
    ["Điểm TB của tuần:", noScore], ["Xếp thứ:", noScore], ["Số tiết GVBM không kí:", unsigned, unsignedCount > 0],
  ];
  const title = { borderBottom: line, borderTop: line, fontSize: t.type.small.fontSize, fontWeight: "fontWeightBold", py: 1, textAlign: "center" } as const;
  return (
    <Box component="aside" sx={{ borderLeft: line, display: "flex", flexDirection: "column", flex: "none", fontSize: t.type.label.fontSize, overflow: "auto", width: 260 }}>
      <Box sx={{ ...title, bgcolor: t.color.surfaceMuted, borderTop: 0, fontSize: t.type.pageLead.fontSize }}>TỔNG KẾT TUẦN</Box>
      <Box sx={{ px: 2, py: 1 }}>
        {rows.map(([label, value, alert]) => (
          <Box key={label} sx={{ borderBottom: dotted, display: "flex", gap: 1, justifyContent: "space-between", py: 0.75 }}>
            <Box component="span" sx={{ color: t.color.textMuted }}>{label}</Box>
            <Box component="span" sx={{ color: alert ? t.color.brandRedHover : undefined, fontWeight: t.type.label.fontWeight, textAlign: "right" }}>{value}</Box>
          </Box>
        ))}
      </Box>
      <Box sx={title}>Kiến nghị của GVBM</Box>
      <Typography sx={{ color: t.color.textSoft, fontSize: t.type.label.fontSize, fontStyle: "italic", p: 2 }}>{noScore}</Typography>
      <Box sx={title}>Ý kiến của GVCN</Box>
      <Typography sx={{ color: t.color.textSoft, fontSize: t.type.label.fontSize, fontStyle: "italic", p: 2 }}>GVCN chưa ghi</Typography>
    </Box>
  );
}
