import Box from "@mui/material/Box";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ErgStatusChip } from "@/components/erg-mui/erg-feedback";
import { ergEnterpriseTokens as t } from "@/themes/erg-enterprise-tokens";

import { shortDateVi, weekdayVi } from "../domain/class-log-week";
import type { LessonReportRow } from "./lesson-report-api";
import { cellNote, reportText, type ReportState } from "./lesson-report-model";

const chipTone: Record<ReportState, "success" | "warning" | "error" | "neutral"> = { ON_TIME: "success", LATE: "warning", MISSING: "error", NONE: "neutral" };

type Props = { row: LessonReportRow | undefined; date: string | undefined; now: Date; reminding: boolean; onRemind: (teacherId: string) => void; onOpenTimesheet: (row: LessonReportRow, date: string) => void };

/** Side panel of the picked cell (340 wide): who and when, what the cell means, «Nhắc riêng» and the link to «Công tiết dạy». The board's attendance line, last reports and private message have no data in the contract yet. */
export function LessonReportDetailPanel({ row, date, now, reminding, onRemind, onOpenTimesheet }: Props) {
  const cell = row?.cells.find((c) => c.date === date);
  return (
    <Box component="aside" aria-label="Chi tiết ô báo giảng" sx={{ bgcolor: "background.paper", border: `1px solid ${t.color.border}`, borderRadius: `${t.radius.card}px`, display: "flex", flex: "none", flexDirection: "column", gap: 1.5, p: 2, width: { xs: "100%", lg: 340 } }}>
      {row && cell && date ? (
        <>
          <Box sx={{ alignItems: "center", display: "flex", gap: 1 }}>
            <Box sx={{ display: "flex", flex: 1, flexDirection: "column", minWidth: 0 }}>
              <Box component="strong" sx={{ fontWeight: t.type.label.fontWeight }}>{`${row.teacherName} · ${weekdayVi(date)} ${shortDateVi(date)}`}</Box>
              <Box component="span" sx={{ ...t.type.note, color: t.color.textMuted }}>{row.schoolName}</Box>
            </Box>
            <ErgStatusChip dot={false} label={reportText.states[cell.state]} sx={{ fontWeight: t.type.label.fontWeight }} tone={chipTone[cell.state]} />
          </Box>
          <Box sx={{ ...t.type.small, bgcolor: t.color.surfaceMuted, borderRadius: `${t.radius.control}px`, color: t.color.textSecondary, px: 1.5, py: "10px" }}>
            {cellNote(cell.state, cell.periods, date, now)}
          </Box>
          <Box sx={{ display: "flex", gap: 1, mt: "auto" }}>
            <ErgButton disabled={!row.cells.some((c) => c.state === "MISSING")} loading={reminding} onClick={() => onRemind(row.teacherId)} sx={{ borderColor: "divider", flex: 1, fontWeight: "fontWeightMedium" }} variant="outlined">Nhắc riêng</ErgButton>
            <ErgButton onClick={() => onOpenTimesheet(row, date)} sx={{ color: t.color.primary, flex: 1, "&:hover": { bgcolor: "transparent", color: t.color.primaryHover } }} variant="text">Xem bảng công ›</ErgButton>
          </Box>
        </>
      ) : (
        <Box sx={{ ...t.type.small, color: t.color.textMuted }}>{reportText.pickHint}</Box>
      )}
    </Box>
  );
}
