import { useState, type ReactNode } from "react";
import DoneAll from "@mui/icons-material/DoneAll";
import Download from "@mui/icons-material/Download";
import MenuBook from "@mui/icons-material/MenuBook";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { ErgDrawer, ErgSearchField, ErgSelect } from "@/components/erg-mui";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

import type { ClassroomSnapshot } from "@/features/lms/classroom/types/classroom-types";
import { AttendanceCurriculumTable } from "./attendance-curriculum-table";
import { AttendanceDateField } from "./attendance-date-field";
import { AttendanceStudentTable } from "./attendance-student-table";
import type { AttendanceSheetController } from "./use-attendance-sheet-controller";

const { statusTint } = ergEnterpriseTokens;
const legend = [
  { label: "Có mặt ✓", tint: statusTint.success },
  { label: "Đi muộn M", tint: statusTint.warning },
  { label: "Vắng V", tint: statusTint.error },
  { label: "Có phép P", tint: statusTint.info },
];

export function DesktopAttendanceSheetPanel({
  controller,
  overlays,
  selectedClass,
}: {
  controller: AttendanceSheetController;
  overlays: ReactNode;
  selectedClass?: ClassroomSnapshot;
}) {
  const [curriculumOpen, setCurriculumOpen] = useState(false);
  // Only show the homeroom teacher when the data has one; an empty "Gv phụ trách:" label is noise.
  const homeroomTeacher = selectedClass?.homeroomTeacher?.trim();

  return (
    <Stack spacing={2} sx={{ height: "100%", minHeight: 0, p: 2 }}>
      <Box sx={{ bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: 2, p: 2 }}>
        <Stack direction="row" spacing={2} sx={{ alignItems: "center", flexWrap: "wrap", rowGap: 1.5 }}>
          <Box sx={{ flex: 1, minWidth: 200 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: "fontWeightMedium" }}>
              Điểm danh{selectedClass?.className ? ` · ${selectedClass.className}` : ""}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {homeroomTeacher ? <>Gv phụ trách: <strong>{homeroomTeacher}</strong> · </> : null}
              Số tiết đã dạy: <strong>{controller.taughtLessonCount}</strong>
            </Typography>
          </Box>

          {controller.notice ? <Chip color="primary" label={controller.notice} size="small" variant="outlined" /> : null}
          {controller.offlinePending ? <Chip label="Đang chờ đồng bộ" size="small" color="warning" /> : null}

          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", flexWrap: "wrap", rowGap: 1 }}>
            <ErgSearchField
              compact
              fullWidth={false}
              placeholder="Tìm học sinh"
              value={controller.searchQuery}
              onChange={(event) => controller.setSearchQuery(event.target.value)}
              sx={{ minWidth: 180 }}
            />
            <AttendanceDateField maxDate={controller.todayInputDate} onChange={controller.clampSelectedDate} value={controller.selectedDate} />
            <ErgSelect
              size="small"
              fullWidth={false}
              value={controller.selectedSubject}
              onChange={(event) => controller.setSelectedSubject(String(event.target.value))}
              options={controller.subjectOptions.map((subject) => ({ value: subject, label: subject }))}
              sx={{ minWidth: 140 }}
            />
            <Button variant="outlined" startIcon={<MenuBook />} onClick={() => setCurriculumOpen(true)}>
              Khung chương trình
            </Button>
            <Button variant="outlined" startIcon={<Download />} onClick={controller.exportXlsx}>
              Xuất Excel
            </Button>
            <Button variant="contained" startIcon={<DoneAll />} onClick={controller.markAllPresent}>
              Tất cả có mặt
            </Button>
          </Stack>
        </Stack>
      </Box>

      <Stack direction="row" spacing={1} sx={{ px: 1 }}>
        {legend.map(({ label, tint }) => (
          <Chip key={label} label={label} size="small" sx={{ bgcolor: tint.bg, color: tint.color }} />
        ))}
      </Stack>

      <Box sx={{ display: "grid", flex: 1, gridTemplateColumns: "minmax(0, 1fr)", minHeight: 0 }}>
        <AttendanceStudentTable controller={controller} />
      </Box>

      <ErgDrawer
        description={controller.selectedSubject}
        onClose={() => setCurriculumOpen(false)}
        open={curriculumOpen}
        slotProps={{ paper: { sx: { width: { sm: 640 } } } }}
        title="Khung chương trình"
      >
        <AttendanceCurriculumTable controller={controller} />
      </ErgDrawer>
      {overlays}
    </Stack>
  );
}
