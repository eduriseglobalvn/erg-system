import Box from "@mui/material/Box";

import { ergEnterpriseTokens as t } from "@/themes/erg-enterprise-tokens";

import type { summarize } from "./lesson-report-model";

type Sum = ReturnType<typeof summarize>;

/** Four figures of the board: 26 high values, green «Đúng hạn», amber «Báo muộn», red «Chưa báo». Subtitles only say what the contract carries. */
export function LessonReportKpis({ sum }: { sum: Sum }) {
  const items = [
    { label: "Buổi dạy tuần này", value: sum.periods, hint: `${sum.teachers} giáo viên · ${sum.schools} trường` },
    { label: "Đúng hạn", value: `${sum.onTimePercent}%`, hint: `${sum.onTime} / ${sum.periods} buổi`, color: t.classLog.present.color },
    { label: "Báo muộn", value: sum.late, hint: `${sum.lateTeachers} giáo viên`, color: t.classLog.late.color },
    { label: "Chưa báo", value: sum.missing, hint: `${sum.missingTeachers} giáo viên`, color: t.color.brandRed },
  ];
  return (
    <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", md: "repeat(4, minmax(0, 1fr))" } }}>
      {items.map((item) => (
        <Box key={item.label} sx={{ bgcolor: "background.paper", border: `1px solid ${t.color.border}`, borderRadius: `${t.radius.card}px`, display: "flex", flexDirection: "column", gap: "2px", px: 2, py: "14px" }}>
          <Box component="span" sx={{ ...t.type.note, color: t.color.textMuted }}>{item.label}</Box>
          <Box component="strong" sx={{ color: item.color ?? t.color.text, fontSize: t.type.stat.fontSize, fontVariantNumeric: "tabular-nums", fontWeight: t.type.label.fontWeight, lineHeight: 1.25 }}>{item.value}</Box>
          <Box component="span" sx={{ ...t.type.note, color: t.color.textMuted }}>{item.hint}</Box>
        </Box>
      ))}
    </Box>
  );
}
