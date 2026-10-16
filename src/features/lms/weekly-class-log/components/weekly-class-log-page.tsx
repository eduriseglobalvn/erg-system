import type { ClassroomSnapshot } from "@/features/lms/classroom/types/classroom-types";
import { useWeeklyClassLogController } from "./use-weekly-class-log-controller";
import { WeeklyClassLogHeader } from "./weekly-class-log-header";
import { WeeklyClassLogSummary } from "./weekly-class-log-summary";
import { WeeklyClassLogTable } from "./weekly-class-log-table";
import { Box } from "@mui/material";

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
      <Box sx={{ bgcolor: "white", border: "1px solid #e5e7eb", borderRadius: 2, display: "flex", flex: 1, flexDirection: { xs: "column", md: "row" }, minHeight: 0, overflow: "hidden" }}>
        <WeeklyClassLogTable controller={controller} />
        <WeeklyClassLogSummary summary={controller.computedSummary} />
      </Box>
    </Box>
  );
}
