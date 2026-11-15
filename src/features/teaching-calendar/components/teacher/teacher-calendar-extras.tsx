import { useEffect, useMemo, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { teacherPath } from "@/platform/workspaces/workspace-paths";
import type { TeachingCalendarEvent } from "../../api/teaching-calendar-workspace-types";
import { noticeBannerText, noticeLinkText, type ScheduleNotice } from "../../domain/schedule-notice";
import { addDaysToDate, dayLabel, schoolPlainName } from "../../domain/schedule-copy";
import { isAssistantEvent, roleCounts, type TeacherRoleFilter } from "../../domain/teacher-events";
import { ScheduleLegend } from "../shared/schedule-legend";

type NoticeProps = { compact?: boolean; notice?: ScheduleNotice; onSeen: () => void; others: number };

/** Banner thong bao lich moi (6.10 / 6.17): chi cai moi nhat, «Đã xem» = da doc, nhieu thi «và <n> thay đổi khác». */
export function ScheduleNoticeBanner({ compact = false, notice, onSeen, others }: NoticeProps) {
  if (!notice) return null;
  const more = others > 0 ? <Link href={teacherPath("/notifications")} sx={{ ml: 1 }} underline="hover">và {others} thay đổi khác</Link> : null;
  if (compact) {
    return <Link component="button" onClick={onSeen} sx={{ alignSelf: "flex-start", textAlign: "left", typography: "body2" }} type="button" underline="hover">{noticeLinkText(notice)}</Link>;
  }
  return (
    <Alert action={<ErgButton onClick={onSeen} variant="text">Đã xem</ErgButton>} severity="info">
      {noticeBannerText(notice)}{more}
    </Alert>
  );
}

const DAY_HEAD = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

type DayTabsProps = { events: readonly Pick<TeachingCalendarEvent, "date">[]; onSelect: (date: string | null) => void; selected: string | null; weekStart: string };

/** Tab ngay cua lich giao vien tren mobile (6.11): «T2 17 · 1 tiết» cho tuan chua hom nay; bam lai de bo loc. */
export function TeacherDayTabs({ events, onSelect, selected, weekStart }: DayTabsProps) {
  return (
    <Stack aria-label="Chọn ngày" direction="row" role="tablist" spacing={0.75} sx={{ overflowX: "auto", pb: 0.5 }}>
      {Array.from({ length: 7 }, (_, index) => addDaysToDate(weekStart, index)).map((date) => {
        const count = events.filter((event) => event.date === date).length;
        const active = date === selected;
        return (
          <ButtonBase
            aria-selected={active} key={date} onClick={() => onSelect(active ? null : date)} role="tab"
            sx={{ alignItems: "flex-start", bgcolor: active ? "primary.main" : "background.default", borderRadius: "10px", color: active ? "primary.contrastText" : "text.primary", flexDirection: "column", flexShrink: 0, px: 1.5, py: 1 }}
          >
            <Typography sx={{ typography: "body2" }}>{DAY_HEAD[new Date(`${date}T00:00:00Z`).getUTCDay()]} {Number(date.slice(8))}</Typography>
            <Typography sx={{ opacity: 0.85, typography: "caption" }}>{count} tiết</Typography>
          </ButtonBase>
        );
      })}
    </Stack>
  );
}

type RoleProps = { counts: ReturnType<typeof roleCounts>; onChange: (role: TeacherRoleFilter) => void; value: TeacherRoleFilter };

/** Segmented control vai tro (6.17, 6.18): chi hien khi co it nhat mot tiet tro giang. */
export function TeacherRoleToggle({ counts, onChange, value }: RoleProps) {
  if (counts.assistant === 0) return null;
  return (
    <ToggleButtonGroup aria-label="Vai trò" exclusive onChange={(_event, next: TeacherRoleFilter | null) => next && onChange(next)} size="small" value={value}>
      <ToggleButton value="all">Tất cả · {counts.all}</ToggleButton>
      <ToggleButton value="main">Dạy chính · {counts.main}</ToggleButton>
      <ToggleButton value="assistant">Trợ giảng · {counts.assistant}</ToggleButton>
    </ToggleButtonGroup>
  );
}

type PanelProps = { events: readonly TeachingCalendarEvent[]; now?: Date };

/** Panel phai (6.10, 6.18): «Tiết tiếp theo» va «Tuần này» (moi truong mot dong, kem vai tro khi co tro giang). */
export function TeacherSidePanel({ events, now: nowProp }: PanelProps) {
  // Dong ho theo phut: `new Date()` moi lan render se lam useMemo vo tac dung.
  const [tick, setTick] = useState(() => new Date());
  useEffect(() => {
    if (nowProp) return undefined;
    const id = setInterval(() => setTick(new Date()), 60_000);
    return () => clearInterval(id);
  }, [nowProp]);
  const now = nowProp ?? tick;
  const next = useMemo(() => [...events].filter((event) => new Date(event.startAt) > now).sort((a, b) => a.startAt.localeCompare(b.startAt))[0], [events, now]);
  const week = useMemo(() => {
    const bySchool = new Map<string, { assistant: number; main: number; name: string }>();
    for (const event of events) {
      const entry = bySchool.get(event.schoolId) ?? { assistant: 0, main: 0, name: schoolPlainName(event.schoolName) };
      bySchool.set(event.schoolId, isAssistantEvent(event) ? { ...entry, assistant: entry.assistant + 1 } : { ...entry, main: entry.main + 1 });
    }
    return [...bySchool.values()];
  }, [events]);
  const hasAssistant = week.some((row) => row.assistant > 0);
  const links = next ? `?classId=${next.classId}&date=${next.date}&scheduleId=${next.id}` : "";
  return (
    <Stack aria-label="Tóm tắt lịch" component="aside" spacing={2} sx={{ flexShrink: 0, width: 280 }}>
      {next ? (
        <Box sx={{ border: 1, borderColor: "divider", borderRadius: "14px", p: 1.5 }}>
          <Typography sx={{ color: "text.secondary", typography: "caption" }}>Tiết tiếp theo · {dayLabel(next.date)}</Typography>
          <Typography sx={{ typography: "subtitle2" }}>{next.className} · Tiết {next.periodStart} {next.startTime} – {next.endTime}{next.roomName ? ` · ${next.roomName}` : ""}</Typography>
          <Typography sx={{ color: "text.secondary", typography: "body2" }}>{next.schoolName}</Typography>
          <Link href={`${teacherPath("/attendance")}${links}`} sx={{ typography: "caption" }} underline="hover">Mở lớp học →</Link>
        </Box>
      ) : null}
      <Box sx={{ border: 1, borderColor: "divider", borderRadius: "14px", p: 1.5 }}>
        <Typography sx={{ typography: "subtitle2" }}>Tuần này{hasAssistant ? ` · Tổng ${events.length} tiết` : ""}</Typography>
        {week.map((row) => (
          <Typography key={row.name} sx={{ typography: "body2" }}>
            {row.name} · {hasAssistant ? [row.main ? `dạy chính ${row.main} tiết` : "", row.assistant ? `trợ giảng ${row.assistant} tiết` : ""].filter(Boolean).join(", ") : `${row.main} tiết`}
          </Typography>
        ))}
      </Box>
      <ScheduleLegend items={hasAssistant ? ["published", "assistant"] : ["published"]} labels={{ assistant: "Trợ giảng (nét đứt, ghi tên người dạy chính)" }} />
      {hasAssistant ? <Typography sx={{ color: "text.secondary", typography: "caption" }}>Tiết trợ giảng tính vào tải tuần.</Typography> : null}
    </Stack>
  );
}
