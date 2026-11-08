import { useState } from "react";
import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";

import { ErgButton, ErgIconButton } from "@/components/erg-mui/erg-actions";
import { ErgErrorState } from "@/components/erg-mui/erg-feedback";
import { ergSegmentedTabsSx } from "@/components/erg-mui/erg-tabs";
import type { ClassroomSnapshot } from "@/domain/school/classroom-types";
import type { StudentGroup } from "@/features/lms/components/student-groups-parts";
import { ClassCard, DashedEmpty, GroupCard } from "@/features/lms/components/student-groups-mobile-parts";
import { ContentPendingSkeleton } from "@/routes/route-feedback";

type Segment = "classes" | "groups";

type Props = {
  classes: ClassroomSnapshot[];
  createPending: boolean;
  errorMessage?: string | null;
  groups: StudentGroup[];
  onBack: () => void;
  onCreate: () => void;
  /** studentId → name, from the page's roster (empty until it loads). */
  studentNames: Map<string, string>;
  status: "loading" | "ready";
  subtitle: string;
};

const listSx = { display: "flex", flexDirection: "column", gap: 1.5, listStyle: "none", m: 0, p: 0 } as const;

/** Phone "Lớp / Nhóm" (canvas N11) on StudentGroupsPage's state: segment, class cards, group cards, "Tạo nhóm". */
export function StudentGroupsMobile({ classes, createPending, errorMessage, groups, onBack, onCreate, status, studentNames, subtitle }: Props) {
  const [segment, setSegment] = useState<Segment>("groups");

  let body;
  if (status === "loading") {
    body = <ContentPendingSkeleton />;
  } else if (errorMessage && !groups.length) {
    body = <ErgErrorState description={errorMessage} title="Không tải được nhóm học sinh" />;
  } else if (segment === "classes") {
    body = classes.length ? (
      <Box aria-label="Danh sách lớp" component="ul" sx={listSx}>
        {classes.map((classroom) => <ClassCard classroom={classroom} key={classroom.id} />)}
      </Box>
    ) : <DashedEmpty>Chưa có lớp nào trong phạm vi đang chọn.</DashedEmpty>;
  } else {
    body = (
      <>
        <Box sx={{ alignItems: "center", display: "flex", gap: 1, justifyContent: "space-between" }}>
          <Typography color="text.secondary" variant="caption">Nhóm do giáo viên tự tạo</Typography>
          <ErgButton disabled={createPending} onClick={onCreate} size="small" startIcon={<AddIcon />} variant="contained">Tạo nhóm</ErgButton>
        </Box>
        {groups.length ? (
          <Box aria-label="Danh sách nhóm" component="ul" sx={listSx}>
            {groups.map((group) => (
              <GroupCard
                group={group}
                key={group.id}
                memberNames={group.studentIds.flatMap((id) => studentNames.get(id) ?? [])}
              />
            ))}
          </Box>
        ) : <DashedEmpty>Chưa có nhóm nào. Bấm “Tạo nhóm” để bắt đầu.</DashedEmpty>}
      </>
    );
  }

  return (
    <Box sx={{ bgcolor: "background.default", color: "text.primary", minWidth: 0, overflowX: "hidden" }}>
      <Box sx={{ alignItems: "center", display: "flex", gap: 1, minHeight: 60, pb: 1, pt: 1.5, px: 1 }}>
        <ErgIconButton label="Quay lại" onClick={onBack}><ArrowBackIcon /></ErgIconButton>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography component="h1" noWrap variant="h4">Lớp và nhóm</Typography>
          <Typography color="text.secondary" component="p" noWrap variant="caption">{subtitle}</Typography>
        </Box>
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, pb: 2, pt: 0.5, px: 2 }}>
        <Tabs aria-label="Lớp hoặc nhóm" onChange={(_, next: Segment) => setSegment(next)} sx={ergSegmentedTabsSx} value={segment} variant="fullWidth">
          <Tab label={`Lớp ${classes.length}`} value="classes" />
          <Tab label={`Nhóm ${groups.length}`} value="groups" />
        </Tabs>
        {body}
      </Box>
    </Box>
  );
}
