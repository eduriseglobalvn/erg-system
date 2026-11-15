import { useMemo } from "react";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";

import { ErgTable } from "@/components/erg-mui/erg-table";
import type { TeachingOverviewTeacherRow } from "@/features/teaching-calendar/api/teaching-calendar-overview-api";
import type { TeachingCalendarEvent } from "@/features/teaching-calendar/api/teaching-calendar-workspace-types";
import { foldSlots } from "@/features/teaching-calendar/domain/overview-model";
import { addDaysToDate, dayLabel, weekdayName } from "@/features/teaching-calendar/domain/schedule-copy";
import { formatDateVi } from "@/domain/formatters/format-date";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";
import { scheduleTokens } from "../shared/schedule-cell-sx";
import { OverviewTeacherDay } from "./overview-teacher-day";

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
export function teacherSubline(row: Row, shortNames: ReadonlyMap<string, string>): { accent?: "clash" | "assistant"; text: string } {
  const { assistant, main } = assistantCounts(row);
  const travelDay = row.days.find((day) => day.travel && day.travel.gapMinutes < day.travel.requiredMinutes);
  if (row.conflictCount > 0) return { accent: "clash", text: `${row.schoolCount > 1 ? `${row.schoolCount} trường · ` : ""}⚠ ${row.conflictCount} trùng` };
  if (travelDay) return { accent: "clash", text: `⚠ ${weekdayName(travelDay.weekday)} không kịp di chuyển` };
  if (row.leave) return { text: `Nghỉ phép ${dd(row.leave.fromDate)} – ${dd(row.leave.toDate)}` };
  if (row.weeklyPeriods === 0) return { text: "Chưa có tiết tuần này" };
  if (row.revokeNotice?.schoolRevokeOn) return { text: `Thu hồi quyền ${shortNames.get(row.revokeNotice.schoolId) ?? ""} ${dd(row.revokeNotice.schoolRevokeOn)}`.replace("  ", " ") };
  if (assistant > 0 && main === 0) return { accent: "assistant", text: `Chỉ trợ giảng · ${assistant} tiết` };
  if (assistant > 0) return { text: `${row.schoolCount} trường · ${assistant} tiết trợ giảng` };
  return { text: row.schoolCount > 1 ? `${row.schoolCount} trường` : "" };
}

function LoadCell({ loadMax, loadWarn, row }: { loadMax: number; loadWarn: number; row: Row }) {
  const { assistant } = assistantCounts(row);
  const color = row.weeklyPeriods > loadMax ? scheduleTokens.clash.edge : row.weeklyPeriods > loadWarn ? scheduleTokens.warn.text : ergEnterpriseTokens.color.primary;
  return (
    <>
      <Typography sx={{ typography: "body2" }}>
        {row.weeklyPeriods} / {loadMax} tiết{assistant > 0 ? <Typography component="span" sx={{ color: "text.secondary", ml: 0.5, typography: "caption" }}>gồm {assistant} trợ giảng</Typography> : null}
      </Typography>
      <Box sx={{ bgcolor: scheduleTokens.neutral.bg, borderRadius: 1, height: 4, mt: 0.5, overflow: "hidden", width: 96 }}>
        <Box sx={{ bgcolor: color, height: "100%", width: `${Math.min(100, (row.weeklyPeriods / loadMax) * 100)}%` }} />
      </Box>
    </>
  );
}

/** Bang tong theo giao vien (6.7): ten + dong phu | Tai tuan | 6 o ngay. */
export function OverviewTeacherTable({ eventsById, loadMax, loadWarn, onOpenSlot, onSort, rows, shortNames, sort, total, weekStart }: Props) {
  const folded = useMemo(() => new Map(rows.map((row) => [row.teacherId, foldSlots(row.slots)])), [rows]);
  return (
    <TableContainer sx={{ border: 1, borderColor: "divider", borderRadius: `${ergEnterpriseTokens.radius.card}px`, maxHeight: "75vh" }}>
      <ErgTable aria-label="Bảng tổng theo giáo viên" size="small" sx={{ borderCollapse: "separate", tableLayout: "fixed", width: "max-content" }}>
        <TableHead>
          <TableRow>
            <TableCell sx={{ left: 0, minWidth: 220, position: "sticky", width: 220, zIndex: 4 }}>Giáo viên · {total} người</TableCell>
            <TableCell sx={{ width: 150 }}>
              <ButtonBase onClick={onSort} sx={{ typography: "inherit" }}>Tải tuần {sort === "LOAD_DESC" ? "↓" : "↑"}</ButtonBase>
            </TableCell>
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <TableCell key={index} sx={{ width: 150 }}>
                {weekdayName(index + 1)} · {dayLabel(addDaysToDate(weekStart, index)).split(", ")[1]}
                <Typography sx={{ color: "text.secondary", typography: "caption" }}>1·6 2·7 3·8 4·9</Typography>
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => {
            const sub = teacherSubline(row, shortNames);
            return (
              <TableRow key={row.teacherId} sx={{ "& td": { verticalAlign: "top" } }}>
                <TableCell sx={{ bgcolor: "background.paper", left: 0, position: "sticky", zIndex: 2 }}>
                  <Box sx={{ alignItems: "center", display: "flex", gap: 1 }}>
                    <Avatar sx={{ height: 28, typography: "caption", width: 28 }}>{row.initials}</Avatar>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography noWrap sx={{ typography: "subtitle2" }}>{row.teacherName}</Typography>
                      <Typography noWrap sx={{ color: sub.accent === "clash" ? scheduleTokens.clash.text : sub.accent === "assistant" ? scheduleTokens.published.text : "text.secondary", typography: "caption" }}>{sub.text || " "}</Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell><LoadCell loadMax={loadMax} loadWarn={loadWarn} row={row} /></TableCell>
                {row.days.map((day) => (
                  <TableCell key={day.weekday}>
                    <OverviewTeacherDay day={day} eventsById={eventsById} onOpenSlot={onOpenSlot} slots={folded.get(row.teacherId) ?? new Map()} teacherName={row.teacherName} weekStart={weekStart} />
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </ErgTable>
    </TableContainer>
  );
}
