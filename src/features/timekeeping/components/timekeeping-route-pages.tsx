import Box from "@mui/material/Box";

import { ErgPageHeader } from "@/components/erg-mui/erg-page-header";

/** Empty screens with a title; the G/A screens (later tasks) replace the bodies. */
function TimekeepingPageShell({ title, description }: { title: string; description: string }) {
  return (
    <Box sx={{ px: { xs: 2, sm: 3 }, py: 2 }}>
      <ErgPageHeader description={description} title={title} />
    </Box>
  );
}

export function TeacherTimekeepingHomeRoute() {
  return <TimekeepingPageShell description="Chấm công hôm nay và lịch sử tháng của bạn." title="Chấm công" />;
}

export function TeacherTimekeepingPunchRoute() {
  return <TimekeepingPageShell description="Xác nhận vị trí và chấm vào hoặc ra ca." title="Chấm vào / ra" />;
}

export function TeacherTimekeepingTimesheetRoute() {
  return <TimekeepingPageShell description="Công, đi muộn và nghỉ phép theo tháng." title="Bảng công của tôi" />;
}

export function TeacherTimekeepingRequestsRoute() {
  return <TimekeepingPageShell description="Nghỉ phép, giải trình, làm việc tại nhà và công tác." title="Đơn từ" />;
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
