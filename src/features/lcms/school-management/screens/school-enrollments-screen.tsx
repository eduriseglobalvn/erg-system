import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { toast } from "sonner";
import { SchoolPageShell } from "@/features/lcms/school-management/components/school-page-shell";
import { useSchoolManagementContext } from "@/features/lcms/school-management/components/school-management-context";
import { useSchoolStudents } from "@/features/lcms/school-management/hooks/use-school-students";

const PAGE_SIZE = 100;

export default function SchoolEnrollmentsScreen() {
  const { enrollStudentsInClass, selectedSchool } = useSchoolManagementContext();
  const [classId, setClassId] = useState(() => selectedSchool?.classes[0]?.id ?? "");
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(0);
  const [classSchoolId, setClassSchoolId] = useState(selectedSchool?.id);
  if (selectedSchool?.id !== classSchoolId) {
    setClassSchoolId(selectedSchool?.id);
    setClassId(selectedSchool?.classes[0]?.id ?? "");
    setSelected(new Set());
    setPage(0);
  }
  const classroom = selectedSchool?.classes.find((item) => item.id === classId);
  // One server page at a time; the selection is a set of ids, so it survives page changes.
  const studentPage = useSchoolStudents(selectedSchool?.id, {}, page, PAGE_SIZE);
  const rows = studentPage.data?.items ?? [];
  const pageSelected = rows.filter((row) => selected.has(row.id)).length;
  if (!selectedSchool) return null;

  function toggle(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function save() {
    if (!classId || !selected.size) return;
    setSaving(true);
    try { await enrollStudentsInClass(Array.from(selected), classId); setSelected(new Set()); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Không thể lưu ghi danh"); }
    finally { setSaving(false); }
  }

  function togglePage(checked: boolean) {
    setSelected((current) => {
      const next = new Set(current);
      rows.forEach((row) => { if (checked) next.add(row.id); else next.delete(row.id); });
      return next;
    });
  }

  const count = selected.size;
  return <SchoolPageShell title="Ghi danh vào lớp" description="Gán người học vào một lớp theo contract backend; thay đổi sẽ được kiểm tra quyền và phạm vi ở server." action={<Button disabled={!classId || !count || saving} onClick={() => void save()} startIcon={<SaveRoundedIcon />} variant="contained">{saving ? "Đang lưu..." : `Lưu ${count} người học`}</Button>}>
    <Alert severity="info" sx={{ mb: 2 }}>Ghi danh theo môn học chưa có mutation trong schema hiện tại. Hãy chọn lớp đích để cập nhật quan hệ học viên — lớp.</Alert>
    <Paper variant="outlined" sx={{ overflow: "hidden" }}><Box sx={{ alignItems: { xs: "stretch", md: "center" }, borderBottom: "1px solid", borderColor: "divider", display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 1.5, justifyContent: "space-between", p: 2 }}><Box><Typography sx={{ fontWeight: 600 }}>{classroom?.name ?? "Chọn lớp đích"}</Typography><Typography color="text.secondary" variant="body2">{count} người học đang được chọn</Typography></Box><TextField label="Lớp đích" onChange={(event) => setClassId(event.target.value)} select size="small" value={classId} sx={{ minWidth: 240 }}>{selectedSchool.classes.map((item) => <MenuItem key={item.id} value={item.id}>{item.name}{item.grade ? ` · Khối ${item.grade}` : ""}</MenuItem>)}</TextField></Box><TableContainer sx={{ maxHeight: 520 }}><Table stickyHeader size="small"><TableHead><TableRow><TableCell padding="checkbox"><Checkbox checked={rows.length > 0 && pageSelected === rows.length} indeterminate={pageSelected > 0 && pageSelected < rows.length} onChange={(_, checked) => togglePage(checked)} /></TableCell><TableCell>Học sinh</TableCell><TableCell>Khối</TableCell><TableCell>Lớp hiện tại</TableCell><TableCell>Mã học sinh</TableCell></TableRow></TableHead><TableBody>{rows.map((student) => <TableRow hover key={student.id} selected={selected.has(student.id)}><TableCell padding="checkbox"><Checkbox checked={selected.has(student.id)} onChange={() => toggle(student.id)} /></TableCell><TableCell sx={{ fontWeight: 600 }}>{student.fullName}</TableCell><TableCell>{student.grade || "Chưa gán"}</TableCell><TableCell>{student.className || "Chưa ghi danh"}</TableCell><TableCell sx={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{student.code}</TableCell></TableRow>)}</TableBody></Table></TableContainer><TablePagination component="div" count={studentPage.data?.totalItems ?? 0} onPageChange={(_, value) => setPage(value)} page={page} rowsPerPage={PAGE_SIZE} rowsPerPageOptions={[PAGE_SIZE]} /></Paper>
  </SchoolPageShell>;
}
