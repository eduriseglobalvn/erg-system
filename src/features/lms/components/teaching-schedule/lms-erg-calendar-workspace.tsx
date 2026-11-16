import { useEffect, useMemo, useState } from "react";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useNavigate } from "@tanstack/react-router";

import { ErgSkeleton } from "@/components/erg-mui/erg-feedback";
import { formatDateVi, todayInput } from "@/domain/formatters/format-date";
import type { ClassroomSnapshot } from "@/domain/school/classroom-types";
import { loadLmsMyTeachingCalendar, teachingCalendarQueryKeys } from "@/features/teaching-calendar/api/teaching-calendar-api";
import type { TeachingCalendarEvent } from "@/features/teaching-calendar/api/teaching-calendar-workspace-types";
import { t } from "@/features/teaching-calendar/components/teacher/teacher-board-styles";
import { ScheduleNoticeBanner, TeacherRoleToggle } from "@/features/teaching-calendar/components/teacher/teacher-calendar-extras";
import { TeacherCalendarHeader } from "@/features/teaching-calendar/components/teacher/teacher-calendar-header";
import { TeacherEventPopover } from "@/features/teaching-calendar/components/teacher/teacher-event-popover";
import { exportTeacherIcs } from "@/features/teaching-calendar/components/teacher/teacher-ics-export";
import { TeacherMobileDay } from "@/features/teaching-calendar/components/teacher/teacher-mobile-day";
import { TeacherMonthGrid } from "@/features/teaching-calendar/components/teacher/teacher-month-grid";
import { TeacherSidePanel } from "@/features/teaching-calendar/components/teacher/teacher-side-panel";
import { TeacherWeekGrid } from "@/features/teaching-calendar/components/teacher/teacher-week-grid";
import { useScheduleNotice } from "@/features/teaching-calendar/components/teacher/use-schedule-notice";
import { weekRangeLabel, weekStartOf } from "@/features/teaching-calendar/domain/schedule-copy";
import { filterByRole, parseRoleFilter, roleCounts, type TeacherRoleFilter } from "@/features/teaching-calendar/domain/teacher-events";
import { createTeacherCalendarInput, leaveDays, monthWeeks, schoolOrderOf, shiftAnchor, visibleDays, type TeacherView } from "@/features/teaching-calendar/domain/teacher-week-model";
import { useLmsMobileBreakpoint } from "@/features/lms/mobile";
import { useMyRequests } from "@/features/timekeeping/api/timekeeping-request-query";
import { useAuthSession } from "@/platform/auth/hooks/use-auth-session";

const TEACHER_CALENDAR_STALE_TIME_MS = 60_000;
const rangeTitle = (view: TeacherView, anchor: string) => (view === "week" ? weekRangeLabel(weekStartOf(anchor)) : view === "day" ? formatDateVi(anchor) : `Tháng ${Number(anchor.slice(5, 7))}, ${anchor.slice(0, 4)}`);

/** Lịch dạy của giáo viên theo board «Lịch dạy của tôi» (Ngày / Tuần / Tháng; mobile: 6 ngày + danh sách). Dữ liệu thật từ lịch giáo viên và đơn nghỉ phép đã duyệt. */
export function LmsErgCalendarWorkspace({ isBootstrapLoading = false }: { isBootstrapLoading?: boolean; selectedClass?: ClassroomSnapshot; teacherName: string }) {
  const { session } = useAuthSession("lms");
  const isMobile = useLmsMobileBreakpoint();
  const tenantId = session?.tenantId ?? "";
  const today = todayInput();
  const [view, setView] = useState<TeacherView>("week");
  const [anchor, setAnchor] = useState(today);
  const [picked, setPicked] = useState<string | null>(null);
  const [popup, setPopup] = useState<{ anchor: HTMLElement; event: TeachingCalendarEvent } | null>(null);
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  const mode: TeacherView = isMobile ? "week" : view;
  const input = useMemo(() => createTeacherCalendarInput(tenantId, mode, anchor), [anchor, mode, tenantId]);
  const query = useQuery({
    enabled: !isBootstrapLoading && Boolean(tenantId),
    queryFn: ({ signal }) => loadLmsMyTeachingCalendar(input, signal),
    queryKey: teachingCalendarQueryKeys.workspace("lms", "teacher", input),
    refetchOnReconnect: false,
    // FE-6 (6.10): lịch vừa xuất bản phải hiện ngay, nên 60 s và refetch khi quay lại tab (push cũng invalidate).
    refetchOnWindowFocus: true,
    retry: false,
    staleTime: TEACHER_CALENDAR_STALE_TIME_MS,
  });
  const requests = useMyRequests("APPROVED");
  const notice = useScheduleNotice(!isBootstrapLoading && Boolean(tenantId));
  const navigate = useNavigate();
  const role = parseRoleFilter(new URLSearchParams(useLocation().searchStr).get("role"));
  const raw = useMemo(() => query.data?.events ?? [], [query.data]);
  const counts = useMemo(() => roleCounts(raw.filter((event) => event.status !== "CANCELLED")), [raw]);
  const events = useMemo(() => filterByRole(raw, counts.assistant ? role : "all"), [counts.assistant, raw, role]);
  const days = useMemo(() => visibleDays(mode, anchor), [anchor, mode]);
  const weeks = useMemo(() => (mode === "month" ? monthWeeks(anchor) : []), [anchor, mode]);
  const leave = useMemo(
    () => leaveDays(requests.data?.items ?? [], weeks[0]?.[0] ?? days[0], weeks.length ? weeks[weeks.length - 1][5] : days[days.length - 1]),
    [days, requests.data, weeks],
  );
  const setRole = (next: TeacherRoleFilter) => {
    const params = new URLSearchParams(window.location.search);
    if (next === "all") params.delete("role"); else params.set("role", next);
    void navigate({ href: `${window.location.pathname}${params.toString() ? `?${params}` : ""}`, replace: true });
  };
  const selectedDay = picked && days.includes(picked) ? picked : days.includes(today) ? today : days[0];
  const shift = (direction: 1 | -1) => { setPicked(null); setAnchor((current) => shiftAnchor(mode, current, direction)); };
  const newIds = notice.newBatchIds;
  const open = (event: TeachingCalendarEvent, el: HTMLElement) => setPopup({ anchor: el, event });
  const popover = <TeacherEventPopover anchor={popup?.anchor ?? null} event={popup?.event ?? null} isNew={Boolean(popup?.event.batchId && newIds.has(popup.event.batchId))} onClose={() => setPopup(null)} />;
  const error = query.error instanceof Error ? query.error.message : "";
  const loading = isBootstrapLoading || query.isLoading;
  const banner = <ScheduleNoticeBanner compact={isMobile} notice={notice.latest} onSeen={notice.markSeen} others={notice.others} />;

  if (isMobile) {
    const arrow = { color: t.color.textSecondary, height: 44, width: 44 } as const;
    return (
      <Box sx={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
        <Box component="header" sx={{ alignItems: "center", display: "flex", justifyContent: "space-between", pb: "6px", pt: 2, px: 2 }}>
          <div>
            <Typography sx={{ color: t.color.textMuted, typography: "caption" }}>{formatDateVi(selectedDay)}</Typography>
            <Typography component="h1" sx={{ typography: "h2" }}>Lịch dạy</Typography>
          </div>
          <Stack direction="row"><ButtonBase aria-label="Tuần trước" onClick={() => shift(-1)} sx={arrow}>‹</ButtonBase><ButtonBase aria-label="Tuần sau" onClick={() => shift(1)} sx={arrow}>›</ButtonBase></Stack>
        </Box>
        {error ? <Typography role="alert" sx={{ color: "error.main", px: 2, typography: "body2" }}>{error}</Typography> : null}
        <TeacherMobileDay counts={counts} days={days} events={events} leave={leave} newBatchIds={newIds} notice={banner} now={now} onOpen={open} onRole={setRole} onSelect={setPicked} role={role} selected={selectedDay} />
        {popover}
      </Box>
    );
  }
  const live = events.filter((event) => event.status !== "CANCELLED");
  const title = mode === "week" ? (days.includes(today) ? "Tuần này" : "Tuần đang xem") : mode === "day" ? "Trong ngày" : "Tháng này";
  return (
    <Stack spacing={1.5}>
      <TeacherCalendarHeader label={rangeTitle(mode, anchor)} onExport={() => void exportTeacherIcs(tenantId)} onShift={shift} onToday={() => { setPicked(null); setAnchor(today); }} onView={setView} view={mode}>
        <TeacherRoleToggle counts={counts} onChange={setRole} value={role} />
      </TeacherCalendarHeader>
      {banner}
      {error ? <Typography role="alert" sx={{ color: "error.main", typography: "body2" }}>{error} <ButtonBase onClick={() => void query.refetch()} sx={{ color: "primary.main", typography: "subtitle2" }}>Thử lại</ButtonBase></Typography> : null}
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start" }}>
        {loading ? <ErgSkeleton height={680} sx={{ flex: 1 }} variant="rounded" /> : mode === "month" ? (
          <TeacherMonthGrid events={events} leave={leave} month={anchor.slice(0, 7)} onPickDay={(day) => { setView("day"); setAnchor(day); }} today={today} weeks={weeks} />
        ) : (
          <TeacherWeekGrid days={days} events={events} hasAssistant={counts.assistant > 0} leave={leave} newBatchIds={newIds} now={now} onPick={open} schoolOrder={schoolOrderOf(live)} today={today} />
        )}
        <TeacherSidePanel events={events} leave={leave} now={now} today={today} weekTitle={title} />
      </Stack>
      {popover}
    </Stack>
  );
}
