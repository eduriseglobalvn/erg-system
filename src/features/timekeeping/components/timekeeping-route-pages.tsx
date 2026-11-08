import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import { useSearch } from "@tanstack/react-router";

import { isIsoDate } from "@/domain/formatters/format-date";
import { ApprovalsPage } from "../admin/approvals/approvals-page";
import { AdminTimesheetPage } from "../admin/admin-timesheet-page";
import { TimekeepingSettingsPage } from "../admin/settings/timekeeping-settings-page";
import { AdminTimekeepingMobile } from "../admin/admin-timekeeping-mobile";
import { AdminTodayPage } from "../admin/admin-today-page";
import { DayDetailPage, DayDetailSheet } from "./my-timesheet/day-detail-page";
import { MyTimesheetPage } from "./my-timesheet/my-timesheet-page";
import { RequestsScreen } from "./requests/requests-screen";
import { PunchTodayPage } from "./punch/punch-today-page";
import { periodOf } from "./punch/punch-format";
import { PunchVerifyPage } from "./punch/punch-verify-page";

export function TeacherTimekeepingHomeRoute() {
  return <PunchTodayPage />;
}

export function TeacherTimekeepingPunchRoute() {
  return <PunchVerifyPage />;
}

/** G04 month view; `?date=yyyy-MM-dd` opens the G05 day detail: a page on wide screens, a sheet over G04 on phones. */
export function TeacherTimekeepingTimesheetRoute() {
  const isMobile = useMediaQuery(useTheme().breakpoints.down("md"), { noSsr: true });
  const search = useSearch({ strict: false }) as { date?: unknown; period?: unknown };
  const date = typeof search.date === "string" && isIsoDate(search.date) ? search.date : undefined;
  const currentPeriod = periodOf(new Date());
  const period = typeof search.period === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(search.period) ? search.period : currentPeriod;
  if (date && !isMobile) return <DayDetailPage date={date} />;
  // Same element position with or without the sheet: G04 and its focused day cell stay mounted behind it.
  return (
    <>
      <MyTimesheetPage currentPeriod={currentPeriod} period={date ? date.slice(0, 7) : period} />
      {date ? <DayDetailSheet date={date} /> : null}
    </>
  );
}

/** G06 list; `?new=`, `?edit=` and `?id=` switch the same route to G07–G10 (see RequestsScreen). */
export function TeacherTimekeepingRequestsRoute() {
  return <RequestsScreen />;
}

/** A03 for approvers without the ADMIN workspace (Tổ trưởng, Phó hiệu trưởng); the approver notification links here. */
export function TeacherTimekeepingApprovalsRoute() {
  return <ApprovalsPage />;
}

export function AdminTimekeepingTodayRoute() {
  // noSsr: read the real width on the first render, so a phone never mounts the desktop board first.
  const isMobile = useMediaQuery(useTheme().breakpoints.down("md"), { noSsr: true });
  return isMobile ? <AdminTimekeepingMobile /> : <AdminTodayPage />;
}

export function AdminTimesheetRoute() {
  return <AdminTimesheetPage />;
}

export function AdminTimekeepingApprovalsRoute() {
  return <ApprovalsPage />;
}

export function AdminTimekeepingSettingsRoute() {
  return <TimekeepingSettingsPage />;
}
