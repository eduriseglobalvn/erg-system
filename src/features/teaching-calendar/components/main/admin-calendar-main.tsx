import { useMemo, useState } from "react";
import useMediaQuery from "@mui/material/useMediaQuery";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import { ErgButton, ErgIconButton } from "@/components/erg-mui/erg-actions";
import { ErgEmptyState, ErgErrorState } from "@/components/erg-mui/erg-feedback";
import { deleteTeachingScheduleEvent } from "@/features/teaching-calendar/api/teaching-calendar-command-api";
import { teachingCalendarQueryKeys } from "@/features/teaching-calendar/api/teaching-calendar-query-keys";
import type { TeachingCalendarEvent } from "@/features/teaching-calendar/api/teaching-calendar-workspace-types";
import { addDaysToDate, weekRangeLabel, weekStartOf } from "@/features/teaching-calendar/domain/schedule-copy";
import { todayInput } from "@/domain/formatters/format-date";
import { getDefaultTenantId } from "@/lib/graphql-client";
import { adminPath } from "@/platform/workspaces/workspace-paths";
import { ContentPendingSkeleton } from "@/routes/route-feedback";
import { AdminMobileDay } from "../mobile/admin-mobile-day";
import { scheduleTokens } from "../shared/schedule-cell-sx";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";
import { teacherTone } from "../shared/teacher-tone";
import { ReuseDialog } from "../reuse/reuse-dialog";
import { useSlotChangeDialogs } from "../slot-change/use-slot-change-dialogs";
import { DaysOffLink } from "./days-off-link";
import { DraftCard } from "./draft-card";
import { EventPopover } from "./event-popover";
import { MainMonthGrid } from "./main-month-grid";
import { MainSidePanel } from "./main-side-panel";
import { MainWeekGrid } from "./main-week-grid";
import { useCalendarMain, type CalendarMode } from "./use-calendar-main";

const MODES: ReadonlyArray<{ label: string; value: CalendarMode | "overview" }> = [
  { label: "Ngày", value: "day" }, { label: "Tuần", value: "week" }, { label: "Tháng", value: "month" }, { label: "Bảng tổng", value: "overview" },
];

const color = ergEnterpriseTokens.color;
/** Board 6.1: nut 36px bo 10, vien xam, chu 14/400. */
const controlSx = { borderColor: color.border, borderRadius: `${ergEnterpriseTokens.radius.control}px`, fontWeight: "fontWeightRegular", height: 36, minHeight: 36, px: "14px" } as const;
const arrowSx = { borderRadius: "999px", color: color.textSecondary, height: 36, width: 36 } as const;
/** Tab dang segmented cua board: nen trang + vien, o 28px bo 7, chon = nen xanh nhat chu dam. */
const segmentedSx = {
  bgcolor: "background.paper", border: `1px solid ${color.border}`, borderRadius: `${ergEnterpriseTokens.radius.control}px`, minHeight: 0, p: "3px",
  "& .MuiTabs-indicator": { display: "none" },
  "& .MuiTab-root": { borderRadius: "7px", color: color.textSecondary, fontSize: "0.8125rem", fontWeight: "fontWeightRegular", height: 28, minHeight: 28, minWidth: 0, px: "12px", textTransform: "none" },
  "& .MuiTab-root.Mui-selected": { bgcolor: color.primarySofter, color: scheduleTokens.published.text, typography: "subtitle2", fontSize: "0.8125rem" },
} as const;

/** Cong `delta` thang that (kep ngay ve cuoi thang ngan hon), khong nhay 30 ngay. */
export function addMonthsToDate(date: string, delta: number) {
  const [year, month, day] = date.split("-").map(Number);
  const last = new Date(Date.UTC(year, month - 1 + delta + 1, 0));
  const clamped = Math.min(day, last.getUTCDate());
  return `${last.getUTCFullYear()}-${String(last.getUTCMonth() + 1).padStart(2, "0")}-${String(clamped).padStart(2, "0")}`;
}

/** Trang «Lịch giảng dạy» cua admin (6.1): thay admin-google-calendar-workspace. */
function AdminCalendarDesktop() {
  const main = useCalendarMain();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [reuseOpen, setReuseOpen] = useState(false);
  const [reuseSchool, setReuseSchool] = useState("");
  const [selected, setSelected] = useState<{ anchor: HTMLElement; event: TeachingCalendarEvent } | null>(null);
  const deleteEvent = useMutation({
    mutationFn: (event: TeachingCalendarEvent) => deleteTeachingScheduleEvent({ eventId: event.id, tenantId: getDefaultTenantId() }, "lcms"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: teachingCalendarQueryKeys.portalRoot("lcms", getDefaultTenantId()) }),
  });
  const errorEventIds = useMemo(() => new Set(main.conflicts.filter((conflict) => conflict.severity === "ERROR" && conflict.mine.eventId).map((conflict) => conflict.mine.eventId as string)), [main.conflicts]);
  const reuseSchools = main.schoolOptions.filter((school) => school.periodCount > 0 && (!main.schoolIds.length || main.schoolIds.includes(school.schoolId))).map((school) => ({ id: school.schoolId, name: school.schoolName }));
  const reuseSchoolId = reuseSchools.find((school) => school.id === reuseSchool)?.id ?? reuseSchools[0]?.id ?? "";
  const showSchool = new Set(main.events.map((event) => event.schoolId)).size > 1 || main.schoolIds.length > 1;
  const sundayDate = addDaysToDate(main.weekStart, 6);
  const dayCount = main.events.some((event) => event.date === sundayDate) ? 7 : 6;
  const days = main.mode === "day" ? [main.anchor] : Array.from({ length: dayCount }, (_, index) => addDaysToDate(main.weekStart, index));
  const go = (path: string, query = "") => void navigate({ href: `${adminPath(path)}${query}` });
  const step = (direction: 1 | -1) => main.setAnchor(main.mode === "month" ? addMonthsToDate(main.anchor, direction) : addDaysToDate(main.anchor, direction * (main.mode === "day" ? 1 : 7)));
  const unit = main.mode === "day" ? "ngày" : main.mode === "week" ? "tuần" : "tháng";
  const label = main.mode === "day" ? main.anchor.split("-").reverse().join("/") : main.mode === "month" ? `Tháng ${Number(main.anchor.slice(5, 7))}, ${main.anchor.slice(0, 4)}` : weekRangeLabel(main.weekStart);

  const slotDialogs = useSlotChangeDialogs(main.canDelete);
  const openSchedule = (event: TeachingCalendarEvent, intent: "edit" | "copy" | "teacher" | "move") => {
    if (slotDialogs.open(event, intent)) { setSelected(null); return; }
    if (!event.batchId) return;
    go("/calendar/schedule", `?batchId=${encodeURIComponent(event.batchId)}&focus=${event.date}:${event.periodStart}&intent=${intent}`);
  };

  return (
    <Stack spacing={1.5} sx={{ px: { xs: 2, md: 3 }, py: 2 }}>
      <Stack direction="row" sx={{ alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
        <Typography component="h1" sx={{ mr: 1 }} variant="h1">Lịch giảng dạy</Typography>
        <ErgButton onClick={() => main.setAnchor(todayInput())} sx={controlSx} variant="outlined">Hôm nay</ErgButton>
        <ErgIconButton label={`${unit[0].toUpperCase()}${unit.slice(1)} trước`} onClick={() => step(-1)} sx={arrowSx}><ChevronLeftIcon /></ErgIconButton>
        <ErgIconButton label={`${unit[0].toUpperCase()}${unit.slice(1)} sau`} onClick={() => step(1)} sx={arrowSx}><ChevronRightIcon /></ErgIconButton>
        <Typography sx={{ fontSize: "1.125rem", fontWeight: "fontWeightMedium" }}>{label}</Typography>
        <Stack direction="row" sx={{ alignItems: "center", gap: 1, ml: "auto" }}>
          <Tabs
            onChange={(_event, value: CalendarMode | "overview") => (value === "overview" ? go("/calendar/overview", `?week=${weekStartOf(main.anchor)}`) : main.setMode(value))}
            sx={segmentedSx} value={main.mode}
          >
            {MODES.map((mode) => <Tab key={mode.value} label={mode.label} value={mode.value} />)}
          </Tabs>
          <DaysOffLink />
          <ErgButton disabled={!reuseSchoolId} onClick={() => setReuseOpen(true)} sx={controlSx} variant="outlined">Dùng lại tuần này…</ErgButton>
          <ErgButton onClick={() => go("/calendar/schedule")} sx={{ ...controlSx, px: 2, typography: "button" }} variant="contained">+ Xếp lịch</ErgButton>
        </Stack>
      </Stack>
      <Stack direction={{ md: "row", xs: "column" }} spacing={1.5}>
        <MainSidePanel
          anchor={main.anchor} onPickDay={(day) => { main.setAnchor(day); if (main.mode === "month") main.setMode("day"); }}
          onToggleSchool={main.toggleSchool} onToggleTeacher={main.toggleTeacher} schoolIds={main.schoolIds}
          schools={main.schoolOptions.map((school) => ({ id: school.schoolId, label: school.schoolName }))}
          teacherIds={main.teacherIds} teachers={main.teacherCounts.map((teacher) => ({ color: teacherTone(teacher.id).border, id: teacher.id, label: teacher.name, meta: `${teacher.count} tiết` }))}
        >
          {main.draftCards.map((draft) => <DraftCard draft={draft} events={main.events} key={draft.batch.id} shortNames={main.shortNames} />)}
        </MainSidePanel>
        <Box sx={{ flex: 1, minWidth: 0, width: "100%" }}>
          {main.loading ? <ContentPendingSkeleton /> : main.error ? (
            <ErgErrorState action={<ErgButton onClick={main.refetch} variant="outlined">Thử lại</ErgButton>} description="Kiểm tra kết nối rồi thử lại." title="Không tải được lịch." />
          ) : !main.events.length && main.mode === "week" ? (
            <ErgEmptyState action={<ErgButton onClick={() => go("/calendar/schedule")} variant="text">Xếp lịch</ErgButton>}  title="Chưa có tiết nào trong tuần này" />
          ) : main.mode === "month" ? (
            <MainMonthGrid events={main.events} from={main.range.from} month={main.anchor.slice(0, 7)} onPickDay={(day) => { main.setAnchor(day); main.setMode("day"); }} />
          ) : (
            <MainWeekGrid
              days={days} errorEventIds={errorEventIds} events={main.events}
              onEventClick={(event, anchor) => setSelected({ anchor, event })} shortNames={main.shortNames} showSchool={showSchool}
            />
          )}
        </Box>
      </Stack>
      <ReuseDialog onClose={() => setReuseOpen(false)} onSchoolChange={setReuseSchool} open={reuseOpen} schoolId={reuseSchoolId} schools={reuseSchools} weekStart={main.weekStart} />
      {slotDialogs.element}
      <EventPopover
        anchorEl={selected?.anchor ?? null} canDelete={main.canDelete} conflicts={main.conflicts} event={selected?.event ?? null}
        onClose={() => setSelected(null)} onDelete={(event) => deleteEvent.mutateAsync(event).then(() => undefined)} onOpenSchedule={openSchedule}
        repeatUntil={main.repeatUntilOf(selected?.event.batchId)}
      />
    </Stack>
  );
}

/** `isPhone` (≤ 899, cung nguong voi ErgPortalLayout) -> man 6.8; con lai man 6.1. */
export function AdminCalendarMain() {
  const isPhone = useMediaQuery("(max-width:899px)", { noSsr: true });
  return isPhone ? <AdminMobileDay /> : <AdminCalendarDesktop />;
}
