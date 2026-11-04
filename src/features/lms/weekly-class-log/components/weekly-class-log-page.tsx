import Box from "@mui/material/Box";
import EventNote from "@mui/icons-material/EventNote";
import { ErgEmptyState } from "@/components/erg-mui";

import type { ClassroomSnapshot } from "@/features/lms/classroom/types/classroom-types";
import { useWeeklyClassLogController } from "./use-weekly-class-log-controller";
import { WeeklyClassLogHeader } from "./weekly-class-log-header";
import { WeeklyClassLogSummary } from "./weekly-class-log-summary";
import { WeeklyClassLogTable } from "./weekly-class-log-table";

type WeeklyClassLogPageProps = {
  selectedClass?: ClassroomSnapshot;
  selectedSchoolName: string;
  teacherName: string;
};

export function WeeklyClassLogPage({ selectedClass, teacherName }: WeeklyClassLogPageProps) {
  const controller = useWeeklyClassLogController(teacherName, {
    selectedClassId: selectedClass?.id,
    selectedSchoolId: selectedClass?.schoolId,
  });

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0, p: { xs: 1, sm: 2 } }}>
      <WeeklyClassLogHeader controller={controller} />
      {controller.serverContract ? (
        <Box sx={{ bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: 2, display: "flex", flex: 1, flexDirection: { xs: "column", md: "row" }, minHeight: 0, overflow: "hidden" }}>
          <WeeklyClassLogTable controller={controller} />
          <WeeklyClassLogSummary summary={controller.computedSummary} />
        </Box>
      ) : (
        <ErgEmptyState
          icon={<EventNote />}
          title={`Sổ đầu bài ${controller.selectedWeek.label} chưa thể lưu`}
          description="Hệ thống chưa hỗ trợ lưu sổ đầu bài lên máy chủ nên chưa thể ghi tiết dạy tại đây, tránh mất dữ liệu khi tải lại trang. Chức năng ghi sổ sẽ mở khi máy chủ sẵn sàng."
        />
      )}
    </Box>
  );
}
