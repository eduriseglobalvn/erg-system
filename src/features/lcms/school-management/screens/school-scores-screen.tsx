import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { useState } from "react";

import { useSchoolManagementContext } from "@/features/lcms/school-management/components/school-management-context";
import { SchoolPageShell } from "@/features/lcms/school-management/components/school-page-shell";
import { ClassScoreBoard } from "@/features/lms/components/score/class-score-board";

/** Read-only scores of one class of the selected school: what the class teacher sees, without the hand-entered sheet. */
export default function SchoolScoresScreen() {
  const { selectedSchool } = useSchoolManagementContext();
  const [classId, setClassId] = useState("");
  if (!selectedSchool) return null;
  const selected = selectedSchool.classes.some((item) => item.id === classId) ? classId : "";
  return (
    <SchoolPageShell title="Bảng điểm lớp" description="Điểm các bài học sinh đã nộp, theo chủ đề hoặc từng lượt làm.">
      <Stack spacing={2}>
        <TextField select size="small" label="Lớp" value={selected} onChange={(event) => setClassId(event.target.value)} sx={{ maxWidth: 320 }} slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}>
          <MenuItem value="" disabled>Chọn lớp</MenuItem>
          {selectedSchool.classes.map((item) => <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>)}
        </TextField>
        <ClassScoreBoard classId={selected || undefined} />
      </Stack>
    </SchoolPageShell>
  );
}
