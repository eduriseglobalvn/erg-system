import { useState, type ReactNode } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import Typography from "@mui/material/Typography";
import AddTaskRoundedIcon from "@mui/icons-material/AddTaskRounded";
import AssignmentRoundedIcon from "@mui/icons-material/AssignmentRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import FingerprintRoundedIcon from "@mui/icons-material/FingerprintRounded";
import HowToRegRoundedIcon from "@mui/icons-material/HowToRegRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import SupportRoundedIcon from "@mui/icons-material/SupportRounded";

import { ErgStatusChip, ErgSkeleton } from "@/components/erg-mui/erg-feedback";
import type { TeachingCalendarEvent } from "@/features/teaching-calendar/api/teaching-calendar-api";
import { buildLessonLinks, sortTodayLessons, useTodayLessons } from "@/features/lms/components/lms-home-today-lessons";
import { useTimekeepingToday } from "@/features/timekeeping/api/timekeeping-query";
import type { TodayView } from "@/features/timekeeping/api/timekeeping-types";
import { hhmm, weekdayDateVi } from "@/features/timekeeping/components/punch/punch-format";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

const { color, radius, size } = ergEnterpriseTokens;
const cardSx = { bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: `${radius.card}px`, minWidth: 0 } as const;

/** "T1–2" from the period range; empty when the schedule carries no period. */
export function periodLabel(event: Pick<TeachingCalendarEvent, "periodCount" | "periodStart">) {
  if (!event.periodStart) return "";
  const last = event.periodStart + Math.max(event.periodCount, 1) - 1;
  return last > event.periodStart ? `T${event.periodStart}–${last}` : `T${event.periodStart}`;
}

/** The lesson running now, else the next one, else the last one; "HH:mm" compares as text. */
export function focusLessonId(lessons: TeachingCalendarEvent[], nowHHmm: string) {
  return (lessons.find((lesson) => lesson.endTime.slice(0, 5) > nowHHmm) ?? lessons[lessons.length - 1])?.id;
}

function lessonState(lesson: TeachingCalendarEvent, nowHHmm: string) {
  if (lesson.startTime.slice(0, 5) > nowHHmm) return { label: "Sắp vào", tone: "success" } as const;
  if (lesson.endTime.slice(0, 5) > nowHHmm) return { label: "Đang dạy", tone: "info" } as const;
  return { label: "Đã xong", tone: "neutral" } as const;
}

/** Design N1: teacher "Hôm nay" on the phone. */
export function LmsHomeMobile({
  canPunch, runsOpen, supportCount, teacherName,
  onAssign, onNavigate, onOpenClassLog, onOpenHomework, onOpenProgress, onOpenSchedule, onOpenTimekeeping,
}: {
  canPunch: boolean; runsOpen: number; supportCount: number; teacherName: string;
  onAssign: () => void; onNavigate: (href: string) => void; onOpenClassLog: () => void; onOpenHomework: () => void;
  onOpenProgress: () => void; onOpenSchedule: () => void; onOpenTimekeeping: () => void;
}) {
  const lessons = useTodayLessons();
  const punch = useTimekeepingToday(canPunch);
  const now = new Date();
  const sorted = sortTodayLessons([...lessons.events]);
  const lessonCount = lessons.isLoading || lessons.isError ? "" : ` · ${sorted.length ? `${sorted.length} buổi dạy hôm nay` : "Không có buổi dạy"}`;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pb: 2, pt: 1, px: 2 }}>
      <Box>
        <Typography component="h1" variant="h1">{greetingFor(now.getHours())}, {teacherName}</Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5 }} variant="body2">{weekdayDateVi(now)}{lessonCount}</Typography>
      </Box>

      {canPunch && punch.data ? <PunchCard today={punch.data} onOpen={onOpenTimekeeping} /> : null}

      <TodayLessonsCard
        error={lessons.isError}
        isLoading={lessons.isLoading}
        lessons={sorted}
        nowHHmm={`${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`}
        onNavigate={onNavigate}
        onOpenSchedule={onOpenSchedule}
      />

      <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
        <StatTile icon={<AssignmentRoundedIcon />} label="Hoạt động đang mở" onClick={onOpenHomework} tone="warning" value={runsOpen} />
        <StatTile icon={<SupportRoundedIcon />} label="HS cần hỗ trợ" onClick={onOpenProgress} tone="error" value={supportCount} />
      </Box>

      <Box sx={{ display: "flex", gap: 1.5 }}>
        <Button onClick={onAssign} startIcon={<AddTaskRoundedIcon />} sx={{ flex: 1, minHeight: 44 }} variant="outlined">Giao bài tập</Button>
        <Button onClick={onOpenClassLog} startIcon={<MenuBookRoundedIcon />} sx={{ flex: 1, minHeight: 44 }} variant="outlined">Sổ đầu bài</Button>
      </Box>
    </Box>
  );
}

export function greetingFor(hour: number) {
  if (hour < 11) return "Chào buổi sáng";
  if (hour < 14) return "Chào buổi trưa";
  if (hour < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
}

/** Shown only while there is something to do today: not punched in yet, or in but not out. */
function PunchCard({ today, onOpen }: { today: TodayView; onOpen: () => void }) {
  if (!today.shift || today.out || today.periodLocked) return null;
  const shift = `${today.shift.name ?? "Ca"} ${hhmm(today.shift.start)} – ${hhmm(today.shift.end)}`;
  const punchedIn = Boolean(today.in);
  return (
    <Box sx={{ ...cardSx, alignItems: "center", bgcolor: color.primarySofter, borderColor: color.primarySoft, display: "flex", gap: 1.5, p: 2 }}>
      <Box sx={{ alignItems: "center", bgcolor: "primary.main", borderRadius: `${radius.control}px`, color: "primary.contrastText", display: "flex", flexShrink: 0, height: 40, justifyContent: "center", width: 40 }}>
        <FingerprintRoundedIcon />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="subtitle2">{punchedIn ? `Đã chấm vào ${hhmm(today.in?.serverTime)}` : "Chưa chấm công vào"}</Typography>
        <Typography sx={{ color: color.primaryHover }} variant="caption" component="div">{shift}</Typography>
      </Box>
      <Button onClick={onOpen} size="small" sx={{ flexShrink: 0, minHeight: 36 }} variant={punchedIn ? "outlined" : "contained"}>
        {punchedIn ? "Chấm ra" : "Chấm vào"}
      </Button>
    </Box>
  );
}

function TodayLessonsCard({ error, isLoading, lessons, nowHHmm, onNavigate, onOpenSchedule }: {
  error: boolean; isLoading: boolean; lessons: TeachingCalendarEvent[]; nowHHmm: string;
  onNavigate: (href: string) => void; onOpenSchedule: () => void;
}) {
  const [picked, setPicked] = useState<string | null>(null);
  const openId = picked ?? focusLessonId(lessons, nowHHmm);
  let body: ReactNode;
  if (isLoading) body = <Box sx={{ px: 2, pb: 2 }}><ErgSkeleton height={60} variant="rounded" /></Box>;
  else if (error || lessons.length === 0) {
    body = (
      <Typography color="text.secondary" sx={{ px: 2, pb: 2 }} variant="body2">
        {error ? "Chưa tải được lịch dạy hôm nay." : "Hôm nay bạn không có buổi dạy nào."}
      </Typography>
    );
  } else {
    body = lessons.map((lesson, index) => {
      const open = lesson.id === openId;
      const state = lessonState(lesson, nowHHmm);
      const links = buildLessonLinks(lesson);
      return (
        <Box key={lesson.id} data-testid="today-lesson-card" sx={{ borderTop: index ? 1 : 0, borderColor: "divider" }}>
          <ButtonBase aria-expanded={open} onClick={() => setPicked(lesson.id)} sx={{ alignItems: "center", display: "flex", gap: 1.5, justifyContent: "flex-start", minHeight: 60, px: 2, py: 1.5, textAlign: "left", width: "100%" }}>
            <Box sx={{ display: "flex", flexDirection: "column", flexShrink: 0, fontVariantNumeric: "tabular-nums", width: 46 }}>
              <Typography sx={{ fontWeight: "fontWeightBold" }} variant="body2">{lesson.startTime.slice(0, 5)}</Typography>
              <Typography color="text.secondary" variant="caption">{periodLabel(lesson)}</Typography>
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography noWrap variant="subtitle2">{lesson.className} · {lesson.subjectName ?? lesson.title}</Typography>
              <Typography color="text.secondary" component="div" noWrap variant="caption">{[lesson.roomName, `${lesson.startTime.slice(0, 5)} – ${lesson.endTime.slice(0, 5)}`].filter(Boolean).join(" · ")}</Typography>
            </Box>
            {open ? <ErgStatusChip label={state.label} tone={state.tone} /> : <ChevronRightRoundedIcon sx={{ color: "text.secondary", fontSize: size.iconMd }} />}
          </ButtonBase>
          {open ? (
            <Box sx={{ display: "flex", gap: 1, pb: 1.75, pl: 9.25, pr: 2 }}>
              <Button onClick={() => onNavigate(links.attendance)} size="small" startIcon={<HowToRegRoundedIcon />} sx={{ minHeight: 36 }} variant="outlined">Điểm danh</Button>
              <Button onClick={() => onNavigate(links.classLog)} size="small" sx={{ minHeight: 36 }} variant="text">Sổ đầu bài</Button>
            </Box>
          ) : null}
        </Box>
      );
    });
  }
  return (
    <Box sx={{ ...cardSx, overflow: "hidden" }}>
      <Box sx={{ alignItems: "center", display: "flex", justifyContent: "space-between", pb: 0.75, pt: 1.75, px: 2 }}>
        <Typography component="h2" variant="h6">Buổi dạy hôm nay</Typography>
        <Button endIcon={<ChevronRightRoundedIcon />} onClick={onOpenSchedule} size="small" sx={{ minHeight: 36, mr: -1 }} variant="text">Lịch tuần</Button>
      </Box>
      {body}
    </Box>
  );
}

function StatTile({ icon, label, onClick, tone, value }: { icon: ReactNode; label: string; onClick: () => void; tone: "warning" | "error"; value: number }) {
  const tint = ergEnterpriseTokens.statusTint[tone];
  return (
    <ButtonBase aria-label={`${label}: ${value}`} onClick={onClick} sx={{ ...cardSx, alignItems: "center", display: "flex", gap: 1.5, justifyContent: "flex-start", p: 2, textAlign: "left" }}>
      <Box sx={{ alignItems: "center", bgcolor: tint.bg, borderRadius: `${radius.control}px`, color: tint.dot, display: "flex", flexShrink: 0, height: 40, justifyContent: "center", width: 40 }}>{icon}</Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography component="div" sx={{ fontVariantNumeric: "tabular-nums" }} variant="h3">{value}</Typography>
        <Typography color="text.secondary" component="div" variant="caption">{label}</Typography>
      </Box>
    </ButtonBase>
  );
}
