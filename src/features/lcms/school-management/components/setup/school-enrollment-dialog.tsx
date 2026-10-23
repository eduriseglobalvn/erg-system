import PlaylistAddCheckRoundedIcon from "@mui/icons-material/PlaylistAddCheckRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useMemo, useState } from "react";
import { schoolTypeMeta, schoolTypeUsesGrades } from "@/features/lcms/school-management/types/school-type-config";
import type { PartnerSchool } from "@/features/lcms/school-management/types/school-management-types";

export function SchoolEnrollmentDialog({ initialClassId, onClose, onEnroll, school }: {
  initialClassId?: string;
  onClose: () => void;
  onEnroll: (studentIds: string[], classId: string) => void | Promise<void>;
  school: PartnerSchool;
}) {
  const [classId, setClassId] = useState(initialClassId ?? school.classes[0]?.id ?? "");
  const [studentIds, setStudentIds] = useState<Set<string>>(() => new Set());
  const [classFilter, setClassFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const meta = schoolTypeMeta[school.schoolType];
  const usesGrades = schoolTypeUsesGrades(school.schoolType);
  const selectedClass = school.classes.find((item) => item.id === classId);
  const classNames = useMemo(() => Array.from(new Set(school.students.map((student) => student.className).filter(Boolean))).sort(), [school.students]);
  const filteredStudents = useMemo(() => school.students.filter((student) => {
    const matchesClass = classFilter === "all" || student.className === classFilter;
    const query = search.trim().toLocaleLowerCase("vi");
    return matchesClass && (!query || `${student.fullName} ${student.code} ${student.className}`.toLocaleLowerCase("vi").includes(query));
  }), [classFilter, school.students, search]);
  const selectedVisibleCount = filteredStudents.filter((student) => studentIds.has(student.id)).length;
  const allVisibleSelected = filteredStudents.length > 0 && selectedVisibleCount === filteredStudents.length;

  function toggleAllVisible(checked: boolean) {
    setStudentIds((current) => {
      const next = new Set(current);
      filteredStudents.forEach((student) => checked ? next.add(student.id) : next.delete(student.id));
      return next;
    });
  }

  async function confirm() {
    if (!classId || !studentIds.size) return;
    setSaving(true);
    try { await Promise.resolve(onEnroll(Array.from(studentIds), classId)); onClose(); }
    finally { setSaving(false); }
  }

  return <Dialog fullWidth maxWidth="lg" onClose={saving ? undefined : onClose} open slotProps={{ paper: { sx: { height: { xs: "100dvh", md: "min(860px, 90dvh)" }, m: { xs: 0, md: 2 } } } }}>
    <DialogTitle>Ghi danh {meta.learnerLabel.toLowerCase()} vào lớp<Typography color="text.secondary" variant="body2">Chọn một lớp đích, sau đó chọn người học cần chuyển hoặc ghi danh.</Typography></DialogTitle>
    <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, minHeight: 0, overflow: "hidden", pt: "12px !important" }}>
      <Alert severity="info">Contract backend hiện hỗ trợ ghi danh người học vào lớp. Ghi danh theo môn học sẽ được bật khi schema có mutation riêng.</Alert>
      <TextField label={`Chọn ${meta.classLabel.toLowerCase()} đích`} onChange={(event) => setClassId(event.target.value)} select size="small" value={classId}>{school.classes.map((item) => <MenuItem key={item.id} value={item.id}>{item.name}{item.grade ? ` · Khối ${item.grade}` : ""}</MenuItem>)}</TextField>
      {selectedClass ? <Typography color="text.secondary" variant="caption">Lớp đích: {selectedClass.name} · {selectedClass.studentCount} người học hiện tại</Typography> : null}
      <Box sx={{ alignItems: { xs: "stretch", md: "center" }, display: "grid", gap: 1.25, gridTemplateColumns: { xs: "1fr", md: "minmax(220px, 1fr) 220px auto" } }}>
        <TextField label={`Tìm ${meta.learnerLabel.toLowerCase()}`} onChange={(event) => setSearch(event.target.value)} size="small" slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRoundedIcon fontSize="small" /></InputAdornment> } }} value={search} />
        <TextField label={meta.classLabel} onChange={(event) => setClassFilter(event.target.value)} select size="small" value={classFilter}><MenuItem value="all">Tất cả {meta.classLabel.toLowerCase()}</MenuItem>{classNames.map((className) => <MenuItem key={className} value={className}>{className}</MenuItem>)}</TextField>
        <Button onClick={() => toggleAllVisible(!allVisibleSelected)} variant="outlined">{allVisibleSelected ? "Bỏ chọn đang lọc" : "Chọn toàn bộ đang lọc"}</Button>
      </Box>
      <TableContainer sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, flex: 1, minHeight: 0, overflow: "auto" }}><Table stickyHeader size="small" sx={{ minWidth: 760 }}><TableHead><TableRow><TableCell padding="checkbox"><Checkbox checked={allVisibleSelected} indeterminate={selectedVisibleCount > 0 && !allVisibleSelected} onChange={(_, checked) => toggleAllVisible(checked)} /></TableCell><TableCell>{meta.learnerLabel}</TableCell><TableCell>{meta.classLabel} hiện tại</TableCell>{usesGrades ? <TableCell>Khối</TableCell> : null}<TableCell>Mã học sinh</TableCell></TableRow></TableHead><TableBody>
        {filteredStudents.map((student) => <TableRow hover key={student.id} selected={studentIds.has(student.id)}><TableCell padding="checkbox"><Checkbox checked={studentIds.has(student.id)} onChange={() => setStudentIds((current) => { const next = new Set(current); if (next.has(student.id)) next.delete(student.id); else next.add(student.id); return next; })} /></TableCell><TableCell><Typography sx={{ fontWeight: 800 }} variant="body2">{student.fullName}</Typography></TableCell><TableCell>{student.className || "Chưa ghi danh"}</TableCell>{usesGrades ? <TableCell>{student.grade || "Chưa gán"}</TableCell> : null}<TableCell sx={{ fontFamily: "var(--font-mono)" }}>{student.code}</TableCell></TableRow>)}
        {!filteredStudents.length ? <TableRow><TableCell colSpan={usesGrades ? 5 : 4} sx={{ color: "text.secondary", py: 5, textAlign: "center" }}>Không có người học phù hợp bộ lọc.</TableCell></TableRow> : null}
      </TableBody></Table></TableContainer>
    </DialogContent>
    <DialogActions sx={{ borderTop: "1px solid", borderColor: "divider", px: 3, py: 1.75 }}><Typography color="text.secondary" sx={{ mr: "auto" }} variant="body2">Đã chọn {studentIds.size} người học</Typography><Button disabled={saving} onClick={onClose}>Hủy</Button><Button disabled={!studentIds.size || !classId || saving} onClick={confirm} startIcon={saving ? <CircularProgress color="inherit" size={16} /> : <PlaylistAddCheckRoundedIcon />} variant="contained">{saving ? "Đang ghi danh..." : "Xác nhận ghi danh"}</Button></DialogActions>
  </Dialog>;
}
