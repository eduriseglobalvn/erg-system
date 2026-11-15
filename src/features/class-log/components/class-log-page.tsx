import { useState } from "react";
import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";

import { ergSegmentedTabsSx } from "@/components/erg-mui/erg-tabs";
import { ergEnterpriseTokens as t } from "@/themes/erg-enterprise-tokens";

import { classLogText } from "../domain/class-log-copy";
import { useClassLogView, type ClassLogTab } from "../hooks/use-class-log-view";
import { ClassBookPanel, type ClassOption } from "./class-book-panel";
import { ChangesPanel } from "./class-log-changes-panel";
import { CurriculumDrawer, type CurriculumTarget } from "./curriculum-drawer";
import { TeacherWeekPanel } from "./teacher-week-panel";

type Props = { schoolName: string; classOptions: ReadonlyArray<ClassOption>; defaultClassId: string };

const tabOrder: ClassLogTab[] = ["class", "teacher", "log"];

/** Sổ đầu bài: three tabs over one week selector kept in the URL. */
export function ClassLogPage({ schoolName, classOptions, defaultClassId }: Props) {
  const view = useClassLogView(defaultClassId);
  const [curriculum, setCurriculum] = useState<CurriculumTarget | null>(null);
  const setWeek = (week: string) => view.update({ week });

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, height: "100%", minHeight: 0, p: { xs: 1, sm: 2 } }}>
      <Box sx={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 1.5 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography component="h1" variant="h1">{classLogText.title}</Typography>
          {schoolName ? <Typography sx={{ color: t.color.textMuted, fontSize: t.type.small.fontSize }}>{schoolName}</Typography> : null}
        </Box>
        <Tabs aria-label="Chế độ xem sổ" onChange={(_, tab: ClassLogTab) => view.update({ tab })} sx={ergSegmentedTabsSx} value={view.tab}>
          {tabOrder.map((tab) => <Tab key={tab} label={classLogText.tabs[tab]} value={tab} />)}
        </Tabs>
      </Box>
      <Box sx={{ bgcolor: "background.paper", border: `1px solid ${t.color.border}`, borderRadius: `${t.radius.card}px`, display: "flex", flex: 1, flexDirection: "column", minHeight: 0, overflow: "hidden" }}>
        {view.tab === "teacher" ? <TeacherWeekPanel onCurriculum={setCurriculum} onWeek={setWeek} weekStart={view.weekStart} /> : null}
        {view.tab === "class" ? (
          <ClassBookPanel classId={view.classId} classOptions={classOptions} onClass={(classId) => view.update({ classId })} onCurriculum={setCurriculum} onWeek={setWeek} weekStart={view.weekStart} />
        ) : null}
        {view.tab === "log" ? <ChangesPanel onWeek={setWeek} weekStart={view.weekStart} /> : null}
      </Box>
      <CurriculumDrawer onClose={() => setCurriculum(null)} target={curriculum} />
    </Box>
  );
}
