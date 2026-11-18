import { useEffect, useMemo, useState } from "react";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Fab from "@mui/material/Fab";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import FilterListIcon from "@mui/icons-material/FilterList";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import { ErgIconButton } from "@/components/erg-mui/erg-actions";
import { ErgEmptyState, ErgErrorState } from "@/components/erg-mui/erg-feedback";
import { ErgSelect } from "@/components/erg-mui/erg-form";
import { ergMobileDockAnchor } from "@/components/portal/erg-mobile-dock";
import { deleteTeachingScheduleEvent } from "@/features/teaching-calendar/api/teaching-calendar-command-api";
import { teachingCalendarQueryKeys } from "@/features/teaching-calendar/api/teaching-calendar-query-keys";
import type { TeachingCalendarEvent } from "@/features/teaching-calendar/api/teaching-calendar-workspace-types";
import { addDaysToDate, dayLabel, nearestGridDay, weekStartOf } from "@/features/teaching-calendar/domain/schedule-copy";
import { errorConflicts } from "@/features/teaching-calendar/domain/schedule-grid-model";
import { getDefaultTenantId } from "@/lib/graphql-client";
import { MobileBottomSheet } from "@/features/lms/mobile/components/mobile-bottom-sheet";
import { adminPath } from "@/platform/workspaces/workspace-paths";
import { ContentPendingSkeleton } from "@/routes/route-feedback";
import { ErgButton } from "@/components/erg-mui/erg-actions";
import { draftIssueLine } from "../main/draft-card";
import { EventDetails } from "../main/event-popover";
import { useCalendarMain } from "../main/use-calendar-main";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";
import { scheduleTokens } from "../shared/schedule-cell-sx";
import { AdminMobileCard, mobileCardTag } from "./admin-mobile-card";
import { AdminMobileFilterSheet } from "./admin-mobile-filter-sheet";
import { AdminMobileSheet } from "./admin-mobile-sheet";
import { useSlotChangeDialogs } from "../slot-change/use-slot-change-dialogs";

const color = ergEnterpriseTokens.color;
const DAY_HEAD = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

/** Trang «Lịch giảng dạy» khi `isPhone` (6.8): chọn trường, tab ngày, banner đợt nháp, thẻ tiết, FAB «Tạo lịch dạy». */
export function AdminMobileDay() {
  const main = useCalendarMain();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<TeachingCalendarEvent | null>(null);
  const [adding, setAdding] = useState(false);
  const [filtering, setFiltering] = useState(false);
  const { schoolIds, schoolOptions, setSchoolIds } = main;
  useEffect(() => { if (!schoolIds.length && schoolOptions[0]) setSchoolIds([(schoolOptions.find((school) => school.periodCount > 0) ?? schoolOptions[0]).schoolId]); }, [schoolIds.length, schoolOptions, setSchoolIds]);
  const schoolId = schoolIds[0] ?? "";
  const school = schoolOptions.find((item) => item.schoolId === schoolId);
  const days = Array.from({ length: 7 }, (_, index) => addDaysToDate(weekStartOf(main.anchor), index));
  const errorIds = useMemo(() => new Set(main.conflicts.filter((conflict) => conflict.severity === "ERROR" && conflict.mine.eventId).map((conflict) => conflict.mine.eventId as string)), [main.conflicts]);
  const clashDays = useMemo(() => new Set(main.events.filter((event) => errorIds.has(event.id)).map((event) => event.date)), [main.events, errorIds]);
  const busyDays = useMemo(() => new Set(main.events.map((event) => event.date)), [main.events]);
  const today = main.events.filter((event) => event.date === main.anchor).sort((a, b) => a.startTime.localeCompare(b.startTime));
  const draft = main.draftCards.find((card) => card.batch.schoolId === schoolId) ?? main.draftCards[0];
  const issues = draft ? draftIssueLine(errorConflicts(draft.conflicts)).replace(" cần xử lý", "") : "";
  const deleteEvent = useMutation({
    mutationFn: (event: TeachingCalendarEvent) => deleteTeachingScheduleEvent({ eventId: event.id, tenantId: getDefaultTenantId() }, "lcms"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: teachingCalendarQueryKeys.portalRoot("lcms", getDefaultTenantId()) }),
  });
  const go = (query: string) => void navigate({ href: `${adminPath("/calendar/schedule")}${query}` });
  const slotDialogs = useSlotChangeDialogs(main.canDelete);

  return (
    <Stack spacing={1.5} sx={{ pb: 10, px: 0.5, py: 1 }}>
      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
        <Box sx={{ minWidth: 0 }}>
          <ErgSelect
            aria-label="Trường" onChange={(event) => setSchoolIds([event.target.value])}
            options={schoolOptions.map((item) => ({ label: item.schoolName, value: item.schoolId }))} size="small" value={schoolId}
          />
          <Typography component="h1" sx={{ fontSize: "1.375rem" }} variant="h1">Lịch giảng dạy</Typography>
        </Box>
        <ErgIconButton label="Bộ lọc" onClick={() => setFiltering(true)} sx={{ bgcolor: "background.paper", border: `1px solid ${color.border}`, borderRadius: `${ergEnterpriseTokens.radius.control}px`, color: color.textSecondary, height: 44, width: 44 }}><FilterListIcon /></ErgIconButton>
      </Stack>
      <Box role="tablist" sx={{ display: "grid", gap: "4px", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", py: 1 }}>
        {days.map((day) => {
          const on = day === main.anchor;
          const dot = clashDays.has(day) ? scheduleTokens.clash.edge : busyDays.has(day) ? (on ? "primary.contrastText" : "primary.main") : "transparent";
          return (
            <ButtonBase
              aria-selected={on} key={day} onClick={() => main.setAnchor(day)} role="tab"
              sx={{ bgcolor: on ? "primary.main" : "background.paper", borderRadius: "12px", color: on ? "primary.contrastText" : color.text, flexDirection: "column", gap: "2px", height: 64, justifyContent: "center" }}
            >
              <Box component="span" sx={{ fontSize: "0.6875rem" }}>{DAY_HEAD[new Date(`${day}T00:00:00Z`).getUTCDay()]}</Box>
              <Box component="span" sx={{ typography: "subtitle2", fontSize: "1rem" }}>{Number(day.slice(8))}</Box>
              <Box aria-hidden component="span" data-testid={busyDays.has(day) ? "day-dot" : undefined} sx={{ bgcolor: dot, borderRadius: "999px", height: 5, width: 5 }} />
            </ButtonBase>
          );
        })}
      </Box>
      {draft ? (
        <Box sx={{ alignItems: "center", bgcolor: "background.paper", border: `1px solid ${color.border}`, borderRadius: `${ergEnterpriseTokens.radius.card}px`, display: "flex", gap: "10px", p: 1.5 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ typography: "subtitle2" }}>{draft.batch.label} · Nháp</Box>
            <Box sx={{ color: scheduleTokens.warn.text, fontSize: "0.75rem" }}>
              {[`${main.events.filter((event) => event.batchId === draft.batch.id).length} buổi`, issues].filter(Boolean).join(" · ")}
            </Box>
          </Box>
          <Link href={`${adminPath("/calendar/schedule")}?batchId=${draft.batch.id}`} sx={{ alignItems: "center", border: `1px solid ${color.primary}`, borderRadius: `${ergEnterpriseTokens.radius.control}px`, display: "inline-flex", height: 36, px: 1.5, typography: "subtitle2", fontSize: "0.8125rem" }} underline="none">Xem đợt</Link>
        </Box>
      ) : null}
      <Box component="h2" sx={{ color: color.textSecondary, m: "8px 0 0", typography: "subtitle2", fontSize: "0.8125rem" }}>{dayLabel(main.anchor)} · {today.length} buổi</Box>
      {main.loading ? <ContentPendingSkeleton /> : main.error ? (
        <ErgErrorState action={<ErgButton onClick={main.refetch} variant="outlined">Thử lại</ErgButton>} description="Kiểm tra kết nối rồi thử lại." title="Không tải được lịch." />
      ) : !today.length ? <ErgEmptyState title="Chưa có tiết nào trong tuần này" /> : (
        <Stack spacing={1}>
          {today.map((event) => <AdminMobileCard event={event} key={event.id} onClick={() => setSelected(event)} tag={mobileCardTag(event, errorIds.has(event.id))} />)}
        </Stack>
      )}
      <Fab
        color="primary" onClick={() => setAdding(true)}
        sx={{ bottom: `calc(var(--erg-pwa-banner-lift, 0px) + ${ergMobileDockAnchor(16)})`, borderRadius: "999px", height: 48, minHeight: 48, position: "fixed", px: 2.5, right: 16, typography: "subtitle2", fontSize: "0.9375rem", zIndex: "speedDial" }} variant="extended"
      >
        + Tạo lịch dạy
      </Fab>
      <MobileBottomSheet onOpenChange={(open) => !open && setSelected(null)} open={Boolean(selected)} title={selected ? `${selected.className} · ${dayLabel(selected.date)}` : "Chi tiết"}>
        {selected ? (
          <EventDetails
            canDelete={main.canDelete} conflicts={main.conflicts} event={selected} onClose={() => setSelected(null)} repeatUntil={main.repeatUntilOf(selected.batchId)} showClose={false}
            onDelete={(event) => deleteEvent.mutateAsync(event).then(() => undefined)}
            onOpenSchedule={(event, intent) => (slotDialogs.open(event, intent) ? setSelected(null) : go(`?batchId=${event.batchId ?? ""}&focus=${event.date}:${event.periodStart}&intent=${intent}`))}
          />
        ) : null}
      </MobileBottomSheet>
      {slotDialogs.element}
      <AdminMobileSheet
        catalog={main.catalog} date={nearestGridDay(main.anchor)} events={main.events} onClose={() => setAdding(false)} open={adding}
        schoolId={schoolId} schoolName={school?.schoolName ?? ""}
      />
      <AdminMobileFilterSheet
        onClose={() => setFiltering(false)} onToggle={main.toggleTeacher} open={filtering} selected={main.teacherIds}
        teachers={main.teacherCounts.map((teacher) => ({ id: teacher.id, label: teacher.name, meta: `${teacher.count} tiết` }))}
      />
    </Stack>
  );
}
