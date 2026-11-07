import { useSearch } from "@tanstack/react-router";

import { isIsoDate } from "@/domain/formatters/format-date";
import { ApprovalsPage } from "../admin/approvals/approvals-page";
import { AdminTimesheetPage } from "../admin/admin-timesheet-page";
import { TimekeepingSettingsPage } from "../admin/settings/timekeeping-settings-page";
import { AdminTodayPage } from "../admin/admin-today-page";
import { DayDetailPage } from "./my-timesheet/day-detail-page";
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

/** G04 month view; `?date=yyyy-MM-dd` switches the same route to the G05 day detail. */
export function TeacherTimekeepingTimesheetRoute() {
  const search = useSearch({ strict: false }) as { date?: unknown; period?: unknown };
  const date = typeof search.date === "string" && isIsoDate(search.date) ? search.date : undefined;
  const currentPeriod = periodOf(new Date());
  const period = typeof search.period === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(search.period) ? search.period : currentPeriod;
  return date ? <DayDetailPage date={date} /> : <MyTimesheetPage currentPeriod={currentPeriod} period={period} />;
}

/** G06 list; `?new=`, `?edit=` and `?id=` switch the same route to G07–G10 (see RequestsScreen). */
export function TeacherTimekeepingRequestsRoute() {
  return <RequestsScreen />;
}

export function AdminTimekeepingTodayRoute() {
  return <AdminTodayPage />;
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
