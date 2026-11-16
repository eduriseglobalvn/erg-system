import Box from "@mui/material/Box";
import HistoryIcon from "@mui/icons-material/History";

import { ErgEmptyState } from "@/components/erg-mui/erg-feedback";

import { addDays, weekRangeLabel } from "../domain/class-log-week";
import { useChanges } from "../hooks/use-class-log-queries";
import { ClassLogChanges } from "./class-log-changes";
import { WeekStepper } from "./class-log-toolbar";
import { PanelState } from "./class-log-ui";

type Props = { weekStart: string; classId?: string; onWeek: (weekStart: string) => void };

const SUNDAY_OFFSET = 6;

/** «Nhật ký sổ»: every edit of a period in the chosen week (all classes unless `classId` is set). */
export function ChangesPanel({ weekStart, classId = "", onWeek }: Props) {
  const query = useChanges(weekStart, classId);
  return (
    <Box sx={{ display: "flex", flex: 1, flexDirection: "column", minHeight: 0 }}>
      <Box sx={{ p: 2 }}>
        <WeekStepper onStep={(direction) => onWeek(addDays(weekStart, direction * 7))} rangeLabel={weekRangeLabel(weekStart, SUNDAY_OFFSET)} />
      </Box>
      <PanelState isError={query.isError} isPending={query.isPending} onRetry={() => void query.refetch()}>
        {query.data && query.data.length > 0 ? <ClassLogChanges changes={query.data} /> : (
          <Box sx={{ p: 2 }}><ErgEmptyState icon={<HistoryIcon />} title="Tuần này chưa có chỉnh sửa nào trong sổ." /></Box>
        )}
      </PanelState>
    </Box>
  );
}
