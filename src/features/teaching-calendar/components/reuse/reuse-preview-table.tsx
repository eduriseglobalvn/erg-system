import Box from "@mui/material/Box";

import type { TeachingReusePreview } from "@/features/teaching-calendar/api/teaching-calendar-reuse-api";
import { conflictLines } from "@/features/teaching-calendar/domain/conflict-copy";
import { compactWeekRange } from "@/features/teaching-calendar/domain/schedule-copy";
import { formatDateVi } from "@/domain/formatters/format-date";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";
import { scheduleTokens } from "../shared/schedule-cell-sx";

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

const { color, radius, type } = ergEnterpriseTokens;
const COLUMNS = "150px 80px 80px 80px 1fr";
const head = { px: 1, py: 1.25 } as const;

/** Bang xem truoc (board AdminReuse): luoi 150 / 80 / 80 / 80 / 1fr, header nen FAFAFC, o tren 12px 8px. */
export function ReusePreviewTable({ weeks }: { weeks: readonly Week[] }) {
  return (
    <Box aria-label="Xem trước các tuần sẽ tạo" role="table" sx={{ border: 1, borderColor: "divider", borderRadius: `${radius.card}px`, overflow: "hidden" }}>
      <Box role="row" sx={{ bgcolor: color.surfaceMuted, borderBottom: 1, borderColor: "divider", color: color.textSecondary, display: "grid", gridTemplateColumns: COLUMNS, ...type.label }}>
        <Box role="columnheader" sx={{ ...head, px: 2 }}>Tuần</Box>
        <Box role="columnheader" sx={head}>Sẽ tạo</Box>
        <Box role="columnheader" sx={head}>Bỏ qua</Box>
        <Box role="columnheader" sx={head}>Trùng</Box>
        <Box role="columnheader" sx={head}>Chi tiết</Box>
      </Box>
      {weeks.map((week) => {
        const clash = week.conflicts > 0;
        return (
          <Box key={week.weekStart} role="row" sx={{ alignItems: "start", borderBottom: `1px solid ${color.divider}`, display: "grid", gridTemplateColumns: COLUMNS, "&:last-of-type": { borderBottom: 0 }, ...type.small }}>
            <Box role="cell" sx={{ px: 2, py: 1.5, ...type.smallStrong }}>{compactWeekRange(week.weekStart)}</Box>
            <Box role="cell" sx={{ px: 1, py: 1.5 }}>{week.toCreate}</Box>
            <Box role="cell" sx={{ color: color.textMuted, px: 1, py: 1.5 }}>{week.skipped}</Box>
            <Box role="cell" sx={{ color: clash ? scheduleTokens.clash.text : color.textMuted, px: 1, py: 1.5, ...(clash ? type.smallStrong : {}) }}>{week.conflicts}</Box>
            <Box role="cell" sx={{ color: clash ? scheduleTokens.clash.text : color.textSecondary, px: 1, py: 1.5, ...type.note, lineHeight: 1.5 }}>{reuseWeekDetail(week)}</Box>
          </Box>
        );
      })}
    </Box>
  );
}
