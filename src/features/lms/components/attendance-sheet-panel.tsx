import { useIsMobile } from "@/hooks/use-mobile";
import { MobileAttendanceSheetPanel } from "@/features/lms/components/attendance/mobile-attendance-sheet-panel";
import { DesktopAttendanceSheetPanel } from "@/features/lms/components/attendance/desktop-attendance-sheet-panel";
import { AttendanceSheetOverlays } from "@/features/lms/components/attendance/attendance-sheet-overlays";
import {
  useAttendanceSheetController,
  type AttendancePanelProps,
} from "@/features/lms/components/attendance/use-attendance-sheet-controller";

export type {
  AttendanceColumn,
  AttendanceStatus,
  CurriculumItem,
} from "@/features/lms/components/attendance/attendance-sheet-model";

export function AttendanceSheetPanel(props: AttendancePanelProps) {
  const isMobile = useIsMobile();
  const controller = useAttendanceSheetController(props);
  const overlays = <AttendanceSheetOverlays controller={controller} />;

  if (isMobile) {
    return (
      <>
        <MobileAttendanceSheetPanel
          attendanceSummary={controller.attendanceSummary}
          curriculumProgram={controller.curriculumProgram}
          exportXlsx={controller.exportXlsx}
          filteredStudents={controller.filteredStudents}
          getStatus={controller.statusFor}
          onOpenStudentDetail={controller.openStudentDetail}
          onSearchQueryChange={controller.setSearchQuery}
          onSelectedDateChange={controller.clampSelectedDate}
          onSetAttendanceStatus={controller.setAttendanceStatus}
          offlinePending={controller.offlinePending}
          searchQuery={controller.searchQuery}
          selectedClass={props.selectedClass}
          selectedDate={controller.selectedDate}
          todayInputDate={controller.todayInputDate}
          taughtLessonCount={controller.taughtLessonCount}
          visibleColumns={controller.dateColumns}
        />
        {overlays}
      </>
    );
  }

  return (
    <DesktopAttendanceSheetPanel
      controller={controller}
      overlays={overlays}
      selectedClass={props.selectedClass}
    />
  );
}
