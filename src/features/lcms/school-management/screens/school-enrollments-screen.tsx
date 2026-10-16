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
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useMemo, useState } from "react";
import { SchoolPageShell } from "@/features/lcms/school-management/components/school-page-shell";
import { useSchoolManagementContext } from "@/features/lcms/school-management/components/school-management-context";

export default function SchoolEnrollmentsScreen() {
  const { enrollStudentsInClass, selectedSchool } = useSchoolManagementContext();
  const [classId, setClassId] = useState(() => selectedSchool?.classes[0]?.id ?? "");
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [saving, setSaving] = useState(false);
  const classroom = selectedSchool?.classes.find((item) => item.id === classId);
  const rows = useMemo(() => selectedSchool?.students ?? [], [selectedSchool]);
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
    finally { setSaving(false); }
  }

  const count = selected.size;
  return <SchoolPageShell title="Ghi danh vào lớp" description="Gán người học vào một lớp theo contract backend; thay đổi sẽ được kiểm tra quyền và phạm vi ở server." action={<Button disabled={!classId || !count || saving} onClick={() => void save()} startIcon={<SaveRoundedIcon />} variant="contained">{saving ? "Đang lưu..." : `Lưu ${count} người học`}</Button>}>
    <Alert severity="info" sx={{ mb: 2 }}>Ghi danh theo môn học chưa có mutation trong schema hiện tại. Hãy chọn lớp đích để cập nhật quan hệ học viên — lớp.</Alert>
    <Paper variant="outlined" sx={{ overflow: "hidden" }}><Box sx={{ alignItems: { xs: "stretch", md: "center" }, borderBottom: "1px solid", borderColor: "divider", display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 1.5, justifyContent: "space-between", p: 2 }}><Box><Typography sx={{ fontWeight: 850 }}>{classroom?.name ?? "Chọn lớp đích"}</Typography><Typography color="text.secondary" variant="body2">{count} người học đang được chọn</Typography></Box><TextField label="Lớp đích" onChange={(event) => setClassId(event.target.value)} select size="small" value={classId} sx={{ minWidth: 240 }}>{selectedSchool.classes.map((item) => <MenuItem key={item.id} value={item.id}>{item.name}{item.grade ? ` · Khối ${item.grade}` : ""}</MenuItem>)}</TextField></Box><TableContainer sx={{ maxHeight: 520 }}><Table stickyHeader size="small"><TableHead><TableRow><TableCell padding="checkbox"><Checkbox checked={count === rows.length && rows.length > 0} indeterminate={count > 0 && count < rows.length} onChange={(_, checked) => setSelected(checked ? new Set(rows.map((row) => row.id)) : new Set())} /></TableCell><TableCell>Học sinh</TableCell><TableCell>Khối</TableCell><TableCell>Lớp hiện tại</TableCell><TableCell>Mã học sinh</TableCell></TableRow></TableHead><TableBody>{rows.map((student) => <TableRow hover key={student.id} selected={selected.has(student.id)}><TableCell padding="checkbox"><Checkbox checked={selected.has(student.id)} onChange={() => toggle(student.id)} /></TableCell><TableCell sx={{ fontWeight: 750 }}>{student.fullName}</TableCell><TableCell>{student.grade || "Chưa gán"}</TableCell><TableCell>{student.className || "Chưa ghi danh"}</TableCell><TableCell sx={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{student.code}</TableCell></TableRow>)}</TableBody></Table></TableContainer></Paper>
  </SchoolPageShell>;
}
