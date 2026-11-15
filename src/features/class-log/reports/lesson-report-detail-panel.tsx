import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ErgStatusChip } from "@/components/erg-mui/erg-feedback";
import { ergEnterpriseTokens as t } from "@/themes/erg-enterprise-tokens";

import { shortDateVi, weekdayVi } from "../domain/class-log-week";
import type { LessonReportRow } from "./lesson-report-api";
import { cellNote, reportText, type ReportState } from "./lesson-report-model";

const chipTone: Record<ReportState, "success" | "warning" | "error" | "neutral"> = { ON_TIME: "success", LATE: "warning", MISSING: "error", NONE: "neutral" };

type Props = { row: LessonReportRow | undefined; date: string | undefined; now: Date; reminding: boolean; onRemind: (teacherId: string) => void; onOpenTimesheet: (row: LessonReportRow, date: string) => void };

/** Side panel of the picked cell: what the cell means, «Nhắc riêng» and the link to «Công tiết dạy». */
export function LessonReportDetailPanel({ row, date, now, reminding, onRemind, onOpenTimesheet }: Props) {
  const cell = row?.cells.find((c) => c.date === date);
  return (
    <Box component="aside" aria-label="Chi tiết ô báo giảng" sx={{ bgcolor: "background.paper", border: `1px solid ${t.color.border}`, borderRadius: `${t.radius.card}px`, display: "flex", flex: "none", flexDirection: "column", gap: 1.5, p: 2, width: { xs: "100%", lg: 340 } }}>
      {row && cell && date ? (
        <>
          <Box sx={{ alignItems: "center", display: "flex", gap: 1 }}>
            <Box sx={{ display: "flex", flex: 1, flexDirection: "column", minWidth: 0 }}>
              <Typography component="h2" sx={{ fontSize: t.type.small.fontSize, fontWeight: t.type.label.fontWeight }}>{`${row.teacherName} · ${weekdayVi(date)} ${shortDateVi(date)}`}</Typography>
              <Typography sx={{ color: t.color.textMuted, fontSize: t.type.label.fontSize }}>{row.schoolName}</Typography>
            </Box>
            <ErgStatusChip label={reportText.states[cell.state]} tone={chipTone[cell.state]} />
          </Box>
          <Typography sx={{ bgcolor: t.color.surfaceMuted, borderRadius: `${t.radius.control}px`, color: t.color.textSecondary, fontSize: t.type.small.fontSize, px: 1.5, py: 1.25 }}>
            {cellNote(cell.state, cell.periods, date, now)}
          </Typography>
          <Box sx={{ display: "flex", gap: 1, mt: "auto" }}>
            <ErgButton disabled={!row.cells.some((c) => c.state === "MISSING")} loading={reminding} onClick={() => onRemind(row.teacherId)} sx={{ flex: 1 }} variant="outlined">Nhắc riêng</ErgButton>
            <ErgButton onClick={() => onOpenTimesheet(row, date)} sx={{ flex: 1 }} variant="text">Xem bảng công ›</ErgButton>
          </Box>
        </>
      ) : (
        <Typography sx={{ color: t.color.textMuted, fontSize: t.type.small.fontSize }}>{reportText.pickHint}</Typography>
      )}
    </Box>
  );
}
