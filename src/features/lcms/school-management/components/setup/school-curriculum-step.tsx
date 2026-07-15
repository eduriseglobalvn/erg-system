import AddRoundedIcon from "@mui/icons-material/AddRounded";
import GroupAddRoundedIcon from "@mui/icons-material/GroupAddRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { useSchoolManagementContext } from "@/features/lcms/school-management/components/school-management-context";
import { SchoolEnrollmentDialog } from "@/features/lcms/school-management/components/setup/school-enrollment-dialog";
import { SchoolStepSurface } from "@/features/lcms/school-management/components/setup/school-step-surface";
import { schoolTypeMeta } from "@/features/lcms/school-management/types/school-type-config";

export function SchoolCurriculumStep() {
  const { addSubject, enrollStudentsInSubjects, selectedSchool } = useSchoolManagementContext();
  const [subjectOpen, setSubjectOpen] = useState(false);
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [initialSubjectId, setInitialSubjectId] = useState<string | undefined>();
  const [subjectName, setSubjectName] = useState("");
  const [subjectCode, setSubjectCode] = useState("");
  if (!selectedSchool) return null;
  const meta = schoolTypeMeta[selectedSchool.schoolType];

  function openEnrollment(subjectId?: string) { setInitialSubjectId(subjectId); setEnrollOpen(true); }
  function createSubject() { addSubject({ name: subjectName, code: subjectCode, teacherCount: 0 }); setSubjectName(""); setSubjectCode(""); setSubjectOpen(false); }

  return <>
    <SchoolStepSurface
      action={<Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}><Button disabled={!selectedSchool.students.length || !selectedSchool.subjects.length} onClick={() => openEnrollment()} startIcon={<GroupAddRoundedIcon />} variant="outlined">Ghi danh người học</Button><Button onClick={() => setSubjectOpen(true)} startIcon={<AddRoundedIcon />} variant="contained">Thêm {meta.subjectLabel.toLowerCase()}</Button></Box>}
      description={`Chọn cụ thể một người, cả lớp hoặc toàn trường để gán một hay nhiều ${meta.subjectLabel.toLowerCase()}.`}
      eyebrow="Bước 4"
      title={`${meta.subjectLabel} & ghi danh`}
    >
      <Box sx={{ display: "grid", gap: 1.25, gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" } }}>
        {selectedSchool.subjects.map((subject) => <Paper key={subject.id} variant="outlined" sx={{ alignItems: "center", display: "flex", gap: 2, justifyContent: "space-between", p: 2 }}><Box sx={{ minWidth: 0 }}><Box sx={{ alignItems: "center", display: "flex", gap: 1 }}><Typography noWrap sx={{ fontWeight: 900 }}>{subject.name}</Typography><Chip label={subject.code} size="small" variant="outlined" /></Box><Typography color="text.secondary" variant="body2">{subject.studentCount} người học · {subject.teacherCount} giáo viên</Typography></Box><Button disabled={!selectedSchool.students.length} onClick={() => openEnrollment(subject.id)} size="small">Chọn người học</Button></Paper>)}
      </Box>
      {!selectedSchool.subjects.length ? <Paper sx={{ bgcolor: "background.default", mt: 1, p: 4, textAlign: "center" }} variant="outlined"><Typography sx={{ fontWeight: 850 }}>Chưa đăng ký {meta.subjectLabel.toLowerCase()}</Typography><Typography color="text.secondary" variant="body2">Thêm {meta.subjectLabel.toLowerCase()} đầu tiên để bắt đầu ghi danh.</Typography></Paper> : null}
    </SchoolStepSurface>

    <Dialog onClose={() => setSubjectOpen(false)} open={subjectOpen}><DialogTitle>Thêm {meta.subjectLabel.toLowerCase()}</DialogTitle><DialogContent sx={{ display: "grid", gap: 2, minWidth: { sm: 420 }, pt: "12px !important" }}><TextField autoFocus label={`Tên ${meta.subjectLabel.toLowerCase()}`} required value={subjectName} onChange={(event) => setSubjectName(event.target.value)} /><TextField label="Mã nội bộ" required value={subjectCode} onChange={(event) => setSubjectCode(event.target.value)} /></DialogContent><DialogActions><Button onClick={() => setSubjectOpen(false)}>Hủy</Button><Button disabled={!subjectName.trim() || !subjectCode.trim()} onClick={createSubject} variant="contained">Thêm mới</Button></DialogActions></Dialog>
    {enrollOpen ? <SchoolEnrollmentDialog initialSubjectId={initialSubjectId} key={initialSubjectId ?? "all-subjects"} onClose={() => setEnrollOpen(false)} onEnroll={enrollStudentsInSubjects} school={selectedSchool} /> : null}
  </>;
}
