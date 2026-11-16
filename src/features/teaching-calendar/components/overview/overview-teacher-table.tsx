import { useMemo } from "react";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import { alpha } from "@mui/material/styles";

import { formatDateVi } from "@/domain/formatters/format-date";
import type { TeachingOverviewTeacherRow } from "@/features/teaching-calendar/api/teaching-calendar-overview-api";
import type { TeachingCalendarEvent } from "@/features/teaching-calendar/api/teaching-calendar-workspace-types";
import { foldSlots } from "@/features/teaching-calendar/domain/overview-model";
import { addDaysToDate, weekdayName } from "@/features/teaching-calendar/domain/schedule-copy";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";
import { teacherTone } from "../shared/teacher-tone";
import { OverviewTeacherDay } from "./overview-teacher-day";
import { ink, TEACHER_COLUMNS, tone, type, weight } from "./overview-styles";

type Row = TeachingOverviewTeacherRow;
type Props = {
  eventsById: ReadonlyMap<string, TeachingCalendarEvent>;
  loadMax: number;
  loadWarn: number;
  onOpenSlot: (date: string, periodNo: number, eventId?: string, intent?: "edit" | "teacher") => void;
  onSort: () => void;
  rows: readonly Row[];
  shortNames: ReadonlyMap<string, string>;
  sort: "LOAD_ASC" | "LOAD_DESC";
  total: number;
  weekStart: string;
};

const dd = (value: string) => formatDateVi(value).slice(0, 5);

/** Tiet tro giang cua mot giao vien trong tuan (slot co vai tro ASSISTANT), va tiet day chinh. */
export function assistantCounts(row: Row) {
  const assistant = row.slots.filter((slot) => slot.roles.includes("ASSISTANT")).length;
  const main = row.slots.filter((slot) => slot.roles.includes("MAIN")).length;
  return { assistant, main };
}

/** Dong phu duoi ten (6.7), theo thu tu uu tien. */
export function teacherSubline(row: Row, shortNames: ReadonlyMap<string, string>): { accent?: "clash" | "assistant" | "gone"; text: string } {
  const { assistant, main } = assistantCounts(row);
  const travelDay = row.days.find((day) => day.travel && day.travel.gapMinutes < day.travel.requiredMinutes);
  if (row.conflictCount > 0) return { accent: "clash", text: `${row.schoolCount > 1 ? `${row.schoolCount} trường · ` : ""}⚠ ${row.conflictCount} trùng` };
  if (travelDay) return { accent: "clash", text: `⚠ ${weekdayName(travelDay.weekday)} không kịp di chuyển` };
  if (row.leave) return { text: `Nghỉ phép ${dd(row.leave.fromDate)} – ${dd(row.leave.toDate)}` };
  if (row.weeklyPeriods === 0) return { text: "Chưa có tiết tuần này" };
  if (row.revokeNotice?.schoolRevokeOn) return { accent: "gone", text: `Thu hồi quyền ${shortNames.get(row.revokeNotice.schoolId) ?? ""} ${dd(row.revokeNotice.schoolRevokeOn)}`.replace("  ", " ") };
  if (assistant > 0 && main === 0) return { accent: "assistant", text: `Chỉ trợ giảng · ${assistant} tiết` };
  if (assistant > 0) return { accent: "assistant", text: `${row.schoolCount} trường · ${assistant} tiết trợ giảng` };
  return { text: row.schoolCount > 1 ? `${row.schoolCount} trường` : "" };
}

const subColor = { assistant: tone.published.text, clash: tone.clash.text, gone: tone.clash.text } as const;

function LoadCell({ loadMax, loadWarn, row }: { loadMax: number; loadWarn: number; row: Row }) {
  const { assistant } = assistantCounts(row);
  const color = row.weeklyPeriods > loadMax ? tone.clash.edge : row.weeklyPeriods > loadWarn ? ink.warning : ink.primary;
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: "4px", justifyContent: "center", px: "12px" }}>
      <Box component="span" sx={{ ...type(12), fontVariantNumeric: "tabular-nums" }}>
        <Box component="strong" sx={{ ...weight(600) }}>{row.weeklyPeriods}</Box> / {loadMax} tiết{assistant > 0 ? <Box component="span" sx={{ ...type(10), color: ink.textMuted }}> gồm {assistant} trợ giảng</Box> : null}
      </Box>
      <Box component="span" sx={{ bgcolor: ink.divider, borderRadius: `${ergEnterpriseTokens.radius.chip}px`, height: 4, overflow: "hidden" }}>
        <Box component="span" sx={{ bgcolor: color, display: "block", height: "100%", width: `${Math.min(100, (row.weeklyPeriods / loadMax) * 100)}%` }} />
      </Box>
    </Box>
  );
}

const headDay = { borderLeft: `1px solid ${ink.border}`, display: "flex", flexDirection: "column", gap: "2px", px: "10px", py: "6px" } as const;

/** Bang tong theo giao vien (board AdminOverviewTeacher): ten + dong phu | Tai tuan | 6 o ngay, luoi 208 / 116 / 6×1fr. */
export function OverviewTeacherTable({ eventsById, loadMax, loadWarn, onOpenSlot, onSort, rows, shortNames, sort, total, weekStart }: Props) {
  const folded = useMemo(() => new Map(rows.map((row) => [row.teacherId, foldSlots(row.slots)])), [rows]);
  return (
    <Box aria-label="Bảng tổng theo giáo viên" role="table" sx={{ ...type(13), bgcolor: ink.surface, border: `1px solid ${ink.border}`, borderRadius: `${ergEnterpriseTokens.radius.card}px`, overflowX: "auto" }}>
      <Box sx={{ minWidth: 1040 }}>
        <Box role="row" sx={{ ...type(12, 600), bgcolor: ink.surfaceMuted, borderBottom: `1px solid ${ink.border}`, color: ink.textSecondary, display: "grid", gridTemplateColumns: TEACHER_COLUMNS }}>
          <Box component="span" role="columnheader" sx={{ px: "12px", py: 1 }}>Giáo viên · {total} người</Box>
          <Box component="span" role="columnheader" sx={{ px: "12px", py: 1 }}>
            <ButtonBase onClick={onSort} sx={{ font: "inherit" }}>Tải tuần {sort === "LOAD_DESC" ? "↓" : "↑"}</ButtonBase>
          </Box>
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <Box component="span" key={index} role="columnheader" sx={headDay}>
              <Box component="span" sx={{ color: index === 5 ? ink.primary : undefined }}>{weekdayName(index + 1)} · {dd(addDaysToDate(weekStart, index))}</Box>
              <Box component="span" sx={{ ...type(10, 500), color: ink.textMuted, display: "grid", gridTemplateColumns: "repeat(4, 1fr)" }}><span>1·6</span><span>2·7</span><span>3·8</span><span>4·9</span></Box>
            </Box>
          ))}
        </Box>
        {rows.map((row) => {
          const sub = teacherSubline(row, shortNames);
          const avatar = teacherTone(row.teacherId);
          return (
            <Box key={row.teacherId} role="row" sx={{ bgcolor: row.conflictCount > 0 ? alpha(tone.clash.edge, 0.04) : undefined, borderTop: `1px solid ${ink.divider}`, display: "grid", gridTemplateColumns: TEACHER_COLUMNS, minHeight: 66, opacity: row.weeklyPeriods === 0 && row.revokeNotice ? 0.6 : 1 }}>
              <Box role="cell" sx={{ alignItems: "center", display: "flex", gap: "10px", minWidth: 0, px: "12px" }}>
                <Box component="span" sx={{ ...type(11, 600), alignItems: "center", bgcolor: avatar.background, borderRadius: `${ergEnterpriseTokens.radius.chip}px`, color: avatar.text, display: "flex", flex: "0 0 30px", height: 30, justifyContent: "center", width: 30 }}>{row.initials}</Box>
                <Box sx={{ minWidth: 0 }}>
                  <Box sx={{ ...weight(600), whiteSpace: "nowrap" }}>{row.teacherName}</Box>
                  <Box sx={{ ...type(11, sub.accent === "clash" ? 600 : 400), color: sub.accent ? subColor[sub.accent] : ink.textMuted, whiteSpace: "nowrap" }}>{sub.text || " "}</Box>
                </Box>
              </Box>
              <Box role="cell"><LoadCell loadMax={loadMax} loadWarn={loadWarn} row={row} /></Box>
              {row.days.map((day) => (
                <OverviewTeacherDay day={day} eventsById={eventsById} key={day.weekday} onOpenSlot={onOpenSlot} slots={folded.get(row.teacherId) ?? new Map()} teacherName={row.teacherName} weekStart={weekStart} />
              ))}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
