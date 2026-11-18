import { useMemo } from "react";
import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";

import { teacherPath } from "@/platform/workspaces/workspace-paths";
import type { TeachingCalendarEvent } from "../../api/teaching-calendar-workspace-types";
import { dayLabel, schoolPlainName } from "../../domain/schedule-copy";
import { eventTone, schoolOrderOf } from "../../domain/teacher-week-model";
import { CARD, LEAVE, SEMIBOLD, SIZE, t } from "./teacher-board-styles";

type Props = {
  events: readonly TeachingCalendarEvent[];
  leave: ReadonlyMap<string, "FULL" | "AM" | "PM">;
  now: Date;
  today: string;
  weekTitle: string;
};

const Row = ({ label, value }: { label: string; value: string }) => (
  <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}><span>{label}</span><strong style={{ fontWeight: SEMIBOLD }}>{value}</strong></Box>
);
const linkSx = { color: t.color.primary, fontWeight: SEMIBOLD, textDecoration: "none", "&:hover": { color: t.color.primaryHover } } as const;
const cardSx = { ...CARD, display: "flex", flexDirection: "column", p: 2 } as const;

/** Cot phai (board 280 px): «Tiết tiếp theo», «Tuần này» (kem vai tro khi co tro giang) va «Ngày nghỉ» tu don nghi phep da duyet. */
export function TeacherSidePanel({ events, leave, now, today, weekTitle }: Props) {
  const live = useMemo(() => events.filter((event) => event.status !== "CANCELLED"), [events]);
  const next = useMemo(() => [...live].filter((event) => new Date(event.startAt) > now).sort((a, b) => a.startAt.localeCompare(b.startAt))[0], [live, now]);
  const hasAssistant = live.some((event) => event.myRole === "ASSISTANT");
  const order = useMemo(() => schoolOrderOf(live), [live]);
  const rows = useMemo(() => {
    const byKey = new Map<string, { count: number; label: string; tone: string }>();
    for (const event of live) {
      const role = event.myRole === "ASSISTANT" ? "trợ giảng" : "dạy chính";
      const key = hasAssistant ? `${event.schoolId}|${role}` : event.schoolId;
      const entry = byKey.get(key) ?? { count: 0, label: hasAssistant ? `${schoolPlainName(event.schoolName)} · ${role}` : event.schoolName, tone: eventTone(event, order, hasAssistant) };
      byKey.set(key, { ...entry, count: entry.count + 1 });
    }
    return [...byKey.values()];
  }, [hasAssistant, live, order]);
  const leaveRows = [...leave.keys()].sort();
  const open = next ? `${teacherPath("/attendance")}?classId=${next.classId}&date=${next.date}&scheduleId=${next.id}` : "";
  return (
    <Box aria-label="Tóm tắt lịch" component="aside" sx={{ display: "flex", flex: "0 0 280px", flexDirection: "column", gap: 1.5, width: 280 }}>
      {next ? (
        <Box sx={{ ...cardSx, gap: "6px" }}>
          <Typography sx={{ color: t.color.textMuted, typography: "caption" }}>Tiết tiếp theo · {next.date === today ? "hôm nay" : dayLabel(next.date)}</Typography>
          <Typography sx={{ typography: "h3" }}>{next.className} · Tiết {next.periodStart}</Typography>
          <Typography sx={{ color: t.color.textSecondary, typography: "body2" }}>{next.startTime} – {next.endTime}{next.roomName ? ` · ${next.roomName}` : ""}<br />{next.schoolName}</Typography>
          <Link href={open} sx={{ ...linkSx, pt: "4px", typography: "subtitle2" }} underline="none">Mở lớp học →</Link>
        </Box>
      ) : null}
      {live.length ? (
        <Box sx={{ ...cardSx, fontSize: SIZE.panel, gap: 1 }}>
          <Typography component="h2" sx={{ typography: "subtitle2" }}>{weekTitle}</Typography>
          {hasAssistant ? <Row label="Tổng" value={`${live.length} tiết`} /> : null}
          {rows.map((row) => <Row key={row.label} label={row.label} value={`${row.count} tiết`} />)}
          {/* One school needs no colour key: the row above already names it. */}
          {hasAssistant || order.length > 1 ? <Box sx={{ borderTop: `1px solid ${t.color.divider}`, color: t.color.textMuted, display: "flex", flexDirection: hasAssistant ? "column" : "row", fontSize: SIZE.title, gap: hasAssistant ? "4px" : 1.5, flexWrap: "wrap", pt: 1 }}>
            {hasAssistant ? (
              <>
                <span><Box component="span" sx={{ bgcolor: t.color.textSoft, borderRadius: "3px", display: "inline-block", height: 10, mr: 0.5, verticalAlign: "middle", width: 10 }} /> Dạy chính</span>
                <span><Box component="span" sx={{ border: `1px dashed ${t.color.primary}`, borderRadius: "3px", boxSizing: "border-box", display: "inline-block", height: 10, mr: 0.5, verticalAlign: "middle", width: 10 }} /> Trợ giảng (nét đứt, ghi tên người dạy chính)</span>
                <span>Tiết trợ giảng tính vào tải tuần.</span>
              </>
            ) : order.map((id, index) => (
              <span key={id}><Box component="span" sx={{ bgcolor: index === 0 ? t.color.primary : t.color.textSoft, borderRadius: "3px", display: "inline-block", height: 10, mr: 0.5, verticalAlign: "middle", width: 10 }} /> {schoolPlainName(live.find((event) => event.schoolId === id)?.schoolName ?? "")}</span>
            ))}
          </Box> : null}
        </Box>
      ) : null}
      <Box aria-label="Ngày nghỉ" component="section" sx={{ ...cardSx, fontSize: SIZE.panel, gap: "10px" }}>
        {leaveRows.length ? <Typography component="h2" sx={{ typography: "subtitle2" }}>Ngày nghỉ</Typography> : null}
        {leaveRows.map((day) => (
          <Box key={day} sx={{ display: "flex", gap: 1 }}>
            <Box component="span" sx={{ bgcolor: LEAVE.bar, borderRadius: `${t.radius.chip}px`, flex: "none", width: 4 }} />
            <div><strong style={{ fontWeight: SEMIBOLD }}>{dayLabel(day)} · Nghỉ phép</strong><br /><span style={{ color: t.color.textMuted }}>Đơn đã duyệt · tiết hôm đó tự huỷ, trường đã được báo</span></div>
          </Box>
        ))}
        <Link href={teacherPath("/timekeeping/requests")} sx={{ ...linkSx, borderTop: leaveRows.length ? `1px solid ${t.color.divider}` : 0, pt: leaveRows.length ? 1 : 0 }} underline="none">Xin nghỉ phép →</Link>
      </Box>
    </Box>
  );
}
