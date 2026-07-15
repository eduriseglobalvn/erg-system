import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import Box from "@mui/material/Box";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useMemo, useState } from "react";
import { SchoolPageShell } from "@/features/lcms/school-management/components/school-page-shell";
import { useSchoolManagementContext } from "@/features/lcms/school-management/components/school-management-context";

export default function SchoolEnrollmentsScreen() {
  const { selectedSchool, unsupportedApiMessage } = useSchoolManagementContext();
  const [subjectId, setSubjectId] = useState(() => selectedSchool?.subjects[0]?.id ?? "");
  const [selected, setSelected] = useState<Set<string>>(() => new Set(selectedSchool?.students.filter((student) => student.subjectIds.includes(subjectId)).map((student) => student.id)));
  const subject = selectedSchool?.subjects.find((item) => item.id === subjectId);
  const count = selected.size;
  const rows = useMemo(() => selectedSchool?.students ?? [], [selectedSchool]);
  if (!selectedSchool) return null;
  function toggle(id: string) { setSelected((current) => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next; }); }
  return <SchoolPageShell title="Ghi danh môn học" description="Gán hoặc gỡ học sinh khỏi môn theo lớp, khối và ngày hiệu lực." action={<Button disabled startIcon={<SaveRoundedIcon />} variant="contained">Lưu {count} học sinh</Button>}>
    <Alert severity="info" sx={{ mb: 2 }}>{unsupportedApiMessage}</Alert>
    <Paper variant="outlined" sx={{ overflow: "hidden" }}><Box sx={{ alignItems: { xs: "stretch", md: "center" }, borderBottom: "1px solid", borderColor: "divider", display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 1.5, justifyContent: "space-between", p: 2 }}><Box><Typography sx={{ fontWeight: 850 }}>{subject?.name ?? "Chọn môn học"}</Typography><Typography color="text.secondary" variant="body2">{count} học sinh đang được chọn</Typography></Box><TextField label="Môn học" select size="small" value={subjectId} onChange={(event) => { const nextId = event.target.value; setSubjectId(nextId); setSelected(new Set(selectedSchool.students.filter((student) => student.subjectIds.includes(nextId)).map((student) => student.id))); }} sx={{ minWidth: 240 }}>{selectedSchool.subjects.map((item) => <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>)}</TextField></Box><TableContainer sx={{ maxHeight: 520 }}><Table stickyHeader size="small"><TableHead><TableRow><TableCell padding="checkbox"><Checkbox checked={count === rows.length && rows.length > 0} indeterminate={count > 0 && count < rows.length} onChange={(_, checked) => setSelected(checked ? new Set(rows.map((row) => row.id)) : new Set())} /></TableCell><TableCell>Học sinh</TableCell><TableCell>Khối</TableCell><TableCell>Lớp</TableCell><TableCell>Mã học sinh</TableCell><TableCell>Trạng thái</TableCell></TableRow></TableHead><TableBody>{rows.map((student) => <TableRow hover key={student.id} selected={selected.has(student.id)}><TableCell padding="checkbox"><Checkbox checked={selected.has(student.id)} onChange={() => toggle(student.id)} /></TableCell><TableCell sx={{ fontWeight: 750 }}>{student.fullName}</TableCell><TableCell>{student.grade}</TableCell><TableCell>{student.className}</TableCell><TableCell sx={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{student.code}</TableCell><TableCell>{selected.has(student.id) ? "Đã ghi danh" : "Chưa ghi danh"}</TableCell></TableRow>)}</TableBody></Table></TableContainer></Paper>
  </SchoolPageShell>;
}
