import Box from "@mui/material/Box";
import EventNoteIcon from "@mui/icons-material/EventNote";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ErgEmptyState } from "@/components/erg-mui/erg-feedback";
import { ErgSelect } from "@/components/erg-mui/erg-form";
import { ergEnterpriseTokens as t } from "@/themes/erg-enterprise-tokens";

import { classLogText } from "../domain/class-log-copy";
import { addDays, weekRangeLabel } from "../domain/class-log-week";
import { useClassWeek } from "../hooks/use-class-log-queries";
import { ClassBookTable } from "./class-book-table";
import { WeekStepper } from "./class-log-toolbar";
import { PanelState } from "./class-log-ui";
import type { CurriculumTarget } from "./curriculum-drawer";
import { curriculumTargetOf } from "./teacher-week-panel";

const FRIDAY_OFFSET = 4;

export type ClassOption = { id: string; label: string };

type Props = {
  classId: string;
  classOptions: ReadonlyArray<ClassOption>;
  weekStart: string;
  onClass: (classId: string) => void;
  onWeek: (weekStart: string) => void;
  onCurriculum: (target: CurriculumTarget | null) => void;
};

/** «Sổ theo lớp»: the paper log of one class for one week, read only. */
export function ClassBookPanel({ classId, classOptions, weekStart, onClass, onWeek, onCurriculum }: Props) {
  const query = useClassWeek(classId, weekStart);
  const week = query.data;
  const periods = week?.days.flatMap((d) => d.periods) ?? [];
  return (
    <Box sx={{ display: "flex", flex: 1, flexDirection: "column", gap: 1.5, minHeight: 0, p: 2 }}>
      <Box sx={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 1 }}>
        <ErgSelect
          onChange={(event) => onClass(event.target.value)}
          options={classOptions.map((o) => ({ value: o.id, label: o.label }))}
          size="small"
          slotProps={{ htmlInput: { "aria-label": "Lớp" }, select: { displayEmpty: true } }}
          sx={{ width: 160 }}
          value={classOptions.some((o) => o.id === classId) ? classId : ""}
        />
        <WeekStepper onStep={(direction) => onWeek(addDays(weekStart, direction * 7))} rangeLabel={weekRangeLabel(weekStart, FRIDAY_OFFSET)} weekNo={week?.weekNo} />
        <Box sx={{ flex: 1 }} />
        <ErgButton onClick={() => onCurriculum(curriculumTargetOf(periods[0]))} variant="outlined">{classLogText.curriculumButton}</ErgButton>
        <ErgButton onClick={() => window.print()} variant="outlined">In sổ</ErgButton>
      </Box>
      <PanelState isError={query.isError} isPending={Boolean(classId) && query.isPending} onRetry={() => void query.refetch()}>
        {week && periods.length > 0 ? <ClassBookTable week={week} /> : (
          <Box sx={{ border: `1px solid ${t.color.border}`, borderRadius: `${t.radius.card}px` }}>
            <ErgEmptyState icon={<EventNoteIcon />} title={classId ? "Tuần này lớp không có tiết nào theo thời khoá biểu." : "Chọn lớp để xem sổ đầu bài."} />
          </Box>
        )}
      </PanelState>
    </Box>
  );
}
