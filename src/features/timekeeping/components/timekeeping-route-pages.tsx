import Box from "@mui/material/Box";
import { useSearch } from "@tanstack/react-router";

import { isIsoDate } from "@/domain/formatters/format-date";
import { ErgPageHeader } from "@/components/erg-mui/erg-page-header";
import { DayDetailPage } from "./my-timesheet/day-detail-page";
import { MyTimesheetPage } from "./my-timesheet/my-timesheet-page";
import { RequestsScreen } from "./requests/requests-screen";
import { PunchTodayPage } from "./punch/punch-today-page";
import { periodOf } from "./punch/punch-format";
import { PunchVerifyPage } from "./punch/punch-verify-page";

/** Empty screens with a title; the G/A screens (later tasks) replace the bodies. */
function TimekeepingPageShell({ title, description }: { title: string; description: string }) {
  return (
    <Box sx={{ px: { xs: 2, sm: 3 }, py: 2 }}>
      <ErgPageHeader description={description} title={title} />
    </Box>
  );
}

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
  return <TimekeepingPageShell description="Ai đã chấm, ai chưa chấm và các trường hợp cần xử lý." title="Chấm công hôm nay" />;
}

export function AdminTimesheetRoute() {
  return <TimekeepingPageShell description="Bảng công tháng của nhân sự." title="Bảng công" />;
}

export function AdminTimekeepingApprovalsRoute() {
  return <TimekeepingPageShell description="Đơn chờ duyệt và đơn đã xử lý." title="Duyệt đơn" />;
}

export function AdminTimekeepingSettingsRoute() {
  return <TimekeepingPageShell description="Địa điểm, ca làm, chính sách và ngày lễ." title="Cấu hình chấm công" />;
}
