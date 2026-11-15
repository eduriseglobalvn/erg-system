import { useMemo, useState, type MouseEvent } from "react";
import Box from "@mui/material/Box";

import { formatDateVi } from "@/domain/formatters/format-date";
import type { TeachingOverviewGrid } from "@/features/teaching-calendar/api/teaching-calendar-overview-api";
import type { TeachingCalendarEvent } from "@/features/teaching-calendar/api/teaching-calendar-workspace-types";
import { buildSchoolDayChips, chipWho, type OverviewChip, type OverviewConflict } from "@/features/teaching-calendar/domain/overview-model";
import { addDaysToDate, weekdayName } from "@/features/teaching-calendar/domain/schedule-copy";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";
import { teacherTone } from "../shared/teacher-tone";
import { OverviewCellPopover } from "./overview-cell-popover";
import { ink, SCHOOL_COLUMNS, stripes, tone, type, weight } from "./overview-styles";

type School = TeachingOverviewGrid["schools"][number];
type Props = { eventsById: ReadonlyMap<string, TeachingCalendarEvent>; grid: TeachingOverviewGrid; onOpen: (chip: OverviewChip, schoolId: string, intent: "edit" | "teacher") => void };

const chipBg = {
  clash: { backgroundColor: tone.clash.bg },
  draft: { backgroundColor: tone.surface, backgroundImage: stripes(6, "transparent", tone.draft.stripe) },
  published: { backgroundColor: ink.surfaceSubtle },
  travel: { backgroundColor: tone.clash.bg },
} as const;

const badgeSx = { ...type(11, 600), alignItems: "center", borderRadius: `${ergEnterpriseTokens.radius.chip}px`, display: "inline-flex", height: 18, px: "7px" } as const;

/** Huy hieu duoi ten truong (board 6.6): «⚠ n» / «Nháp» / «Chưa có lịch»; truong binh thuong khong co huy hieu. */
export function schoolBadge(school: Pick<School, "conflictCount" | "hasDraft" | "periodCount">) {
  if (school.conflictCount > 0) return { bg: tone.clash.bg, color: tone.clash.text, label: `⚠ ${school.conflictCount}` };
  if (school.hasDraft) return { bg: tone.published.bg, color: tone.published.text, label: "Nháp" };
  if (school.periodCount === 0) return { bg: tone.warn.bg, color: tone.warn.text, label: "Chưa có lịch" };
  return null;
}

const swatch = { borderRadius: "3px", display: "inline-block", height: 10, verticalAlign: "middle", width: 12 } as const;
const LEGEND = [
  { label: "Đã áp dụng", sx: { backgroundColor: ink.surfaceSubtle, boxShadow: `inset 3px 0 0 ${ink.primary}` } },
  { label: "Nháp", sx: { backgroundImage: stripes(3, tone.surface, tone.draft.stripe), boxShadow: `inset 0 0 0 1px ${ink.primary}` } },
  { label: "Trùng / không kịp di chuyển", sx: { backgroundColor: tone.clash.bg, boxShadow: `inset 0 0 0 1.5px ${tone.clash.edge}` } },
] as const;

/** Bang tong theo truong (board AdminOverview): hang = truong, cot = Thu 2…Thu 7; moi khung gio la mot the co vach mau giao vien. */
export function OverviewSchoolGrid({ eventsById, grid, onOpen }: Props) {
  const chips = useMemo(() => buildSchoolDayChips(grid), [grid]);
  const [picked, setPicked] = useState<{ anchor: HTMLElement; chip: OverviewChip; school: School } | null>(null);
  const holidayByDay = useMemo(() => new Map(grid.holidays.map((holiday) => [(new Date(`${holiday.date}T00:00:00Z`).getUTCDay() + 6) % 7 + 1, holiday.name])), [grid.holidays]);
  const conflict = picked ? (grid.conflicts as readonly OverviewConflict[]).find((item) => item.weekday === picked.chip.weekday && item.periodNo >= picked.chip.firstPeriod && item.periodNo <= picked.chip.lastPeriod
    && (item.mine.eventId === picked.chip.cell.eventId || item.other?.eventId === picked.chip.cell.eventId)) : undefined;
  const subject = picked?.chip.cell.eventId ? eventsById.get(picked.chip.cell.eventId)?.subjectName : undefined;
  return (
    <Box aria-label={`Bảng tổng tuần ${formatDateVi(grid.weekStart).slice(0, 5)}`} component="section" sx={{ ...type(13), bgcolor: ink.surface, border: `1px solid ${ink.border}`, borderRadius: `${ergEnterpriseTokens.radius.card}px`, display: "flex", flexDirection: "column", minWidth: 0, overflowX: "auto", overflowY: "hidden", position: "relative" }}>
      <Box sx={{ display: "flex", flexDirection: "column", minWidth: 960 }}>
        <Box sx={{ bgcolor: ink.surfaceMuted, borderBottom: `1px solid ${ink.border}`, color: ink.textSecondary, display: "grid", ...weight(600), gridTemplateColumns: SCHOOL_COLUMNS }}>
          <Box component="span" sx={{ ...type(12), px: "14px", py: "10px" }}>Trường</Box>
          {[1, 2, 3, 4, 5, 6].map((weekday) => (
            <Box component="span" key={weekday} sx={{ ...type(12), borderLeft: `1px solid ${ink.divider}`, color: weekday === 6 ? ink.primary : undefined, p: "10px" }}>
              {weekdayName(weekday)} <Box component="span" sx={{ color: weekday === 6 ? undefined : ink.textMuted, ...weight(400) }}>{formatDateVi(addDaysToDate(grid.weekStart, weekday - 1)).slice(0, 5)}</Box>
            </Box>
          ))}
        </Box>
        {grid.schools.map((school, rowIndex) => {
          const badge = schoolBadge(school);
          return (
            <Box key={school.schoolId} sx={{ borderTop: rowIndex ? `1px solid ${ink.divider}` : 0, display: "grid", gridTemplateColumns: SCHOOL_COLUMNS, minHeight: 120 }}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: "3px", minWidth: 0, px: "14px", py: 1 }}>
                <Box component="span" sx={{ ...weight(600), overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{school.schoolName}</Box>
                <Box component="span" sx={{ ...type(11), alignItems: "center", color: ink.textMuted, display: "flex", gap: "6px" }}>
                  {school.periodCount} tiết
                  {badge ? <Box component="span" sx={{ ...badgeSx, bgcolor: badge.bg, color: badge.color }}>{badge.label}</Box> : null}
                </Box>
              </Box>
              {[1, 2, 3, 4, 5, 6].map((weekday) => {
                const list = chips.get(`${school.schoolId}:${weekday}`) ?? [];
                const holiday = holidayByDay.get(weekday);
                return (
                  <Box key={weekday} sx={{ bgcolor: weekday === 6 ? ink.surfaceMuted : undefined, borderLeft: `1px solid ${ink.divider}`, display: "flex", flexDirection: "column", gap: "4px", minWidth: 0, p: "6px" }} title={holiday}>
                    {holiday && !list.length ? <Box component="span" sx={{ ...type(11), color: ink.textMuted }}>{holiday}</Box> : null}
                    {list.map((chip) => {
                      const cell = chip.cell;
                      const edge = chip.kind === "clash" ? tone.clash.edge : cell.teacherName ? teacherTone(cell.teacherName).border : ink.textSoft;
                      const bad = chip.kind === "clash" || chip.kind === "travel";
                      return (
                        <Box
                          component="button" key={`${cell.eventId ?? cell.className}-${chip.firstPeriod}`} onClick={(event: MouseEvent<HTMLElement>) => setPicked({ anchor: event.currentTarget, chip, school })}
                          sx={{ ...chipBg[chip.kind], border: 0, borderRadius: "8px", boxShadow: [`inset 3px 0 0 ${edge}`, chip.kind === "travel" ? `inset 0 0 0 1px ${tone.clash.edge}` : "", picked?.chip === chip ? `0 0 0 2px ${ink.primary}` : ""].filter(Boolean).join(", "), color: "inherit", cursor: "pointer", display: "flex", flexDirection: "column", font: "inherit", gap: "1px", px: 1, py: "4px", textAlign: "left" }}
                        >
                          <Box component="span" sx={{ ...type(11), color: ink.textMuted, fontVariantNumeric: "tabular-nums" }}>{chip.startTime}–{chip.endTime}</Box>
                          <Box component="span" sx={{ ...type(12, 600), color: bad ? tone.clash.text : ink.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{chipWho(cell)}</Box>
                        </Box>
                      );
                    })}
                  </Box>
                );
              })}
            </Box>
          );
        })}
        <Box sx={{ ...type(12), borderTop: `1px solid ${ink.divider}`, color: ink.textMuted, display: "flex", gap: 2, px: "14px", py: 1 }}>
          <span>Bấm vào khung giờ để xem chi tiết</span>
          <Box component="span" sx={{ display: "inline-flex", gap: "14px", ml: "auto" }}>
            {LEGEND.map((item) => <span key={item.label}><Box component="span" sx={{ ...swatch, ...item.sx }} /> {item.label}</span>)}
          </Box>
        </Box>
      </Box>
      <OverviewCellPopover
        anchorEl={picked?.anchor ?? null} chip={picked?.chip ?? null} conflict={conflict} onClose={() => setPicked(null)}
        onChangeTeacher={() => { if (picked) { onOpen(picked.chip, picked.school.schoolId, "teacher"); setPicked(null); } }}
        onEdit={() => { if (picked) { onOpen(picked.chip, picked.school.schoolId, "edit"); setPicked(null); } }}
        schoolName={picked?.school.schoolName ?? ""} subjectName={subject} weekStart={grid.weekStart}
      />
    </Box>
  );
}
