import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useMemo, useState } from "react";
import { StudentScopeNavigator } from "@/features/lcms/school-management/components/students/student-scope-navigator";
import type { PartnerSchool, SchoolStudent } from "@/features/lcms/school-management/types/school-management-types";

const statusMeta = { studying: { label: "Đang học", color: "success" }, "at-risk": { label: "Cần hỗ trợ", color: "warning" }, inactive: { label: "Ngừng học", color: "default" } } as const;

export function SchoolStudentDirectoryWorkspace({ school }: { school: PartnerSchool }) {
  const [selectedGrade, setSelectedGrade] = useState("all");
  const [selectedClass, setSelectedClass] = useState("all");
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [selectedStudent, setSelectedStudent] = useState<SchoolStudent | null>(null);

  const filtered = useMemo(() => school.students.filter((student) => {
    const matchesScope = (selectedGrade === "all" || student.grade === selectedGrade) && (selectedClass === "all" || student.className === selectedClass);
    const matchesStatus = status === "all" || student.status === status;
    const matchesSearch = `${student.fullName} ${student.code} ${student.guardianPhone}`.toLowerCase().includes(search.trim().toLowerCase());
    return matchesScope && matchesStatus && matchesSearch;
  }), [school.students, search, selectedClass, selectedGrade, status]);

  const visible = filtered.slice(page * 12, page * 12 + 12);
  const scopeLabel = selectedClass !== "all" ? `Lớp ${selectedClass}` : selectedGrade !== "all" ? `Khối ${selectedGrade}` : "Toàn trường";
  const atRisk = filtered.filter((student) => student.status === "at-risk").length;
  const assigned = filtered.filter((student) => student.subjectIds.length > 0).length;

  function resetPage() { setPage(0); }

  return (
    <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "minmax(0,1fr)", lg: "248px minmax(0,1fr)" } }}>
      <StudentScopeNavigator
        school={school}
        selectedClass={selectedClass}
        selectedGrade={selectedGrade}
        onSelectClass={(className, grade) => { setSelectedClass(className); setSelectedGrade(grade); resetPage(); }}
        onSelectGrade={(grade) => { setSelectedGrade(grade); setSelectedClass("all"); resetPage(); }}
        onSelectSchool={() => { setSelectedGrade("all"); setSelectedClass("all"); resetPage(); }}
      />
      <Box sx={{ minWidth: 0 }}>
        <Box sx={{ display: "grid", gap: 1.25, gridTemplateColumns: { xs: "1fr", sm: "repeat(3,1fr)" }, mb: 1.5 }}>
          <Metric label={`Người học · ${scopeLabel}`} value={filtered.length} />
          <Metric color="success.main" label="Đã gán môn học" value={`${assigned}/${filtered.length}`} />
          <Metric color={atRisk ? "warning.main" : "success.main"} label="Cần hỗ trợ" value={atRisk} />
        </Box>
        <Paper variant="outlined" sx={{ overflow: "hidden" }}>
          <Box sx={{ alignItems: { xs: "stretch", md: "center" }, borderBottom: "1px solid", borderColor: "divider", display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 1, justifyContent: "space-between", p: 1.5 }}>
            <Box><Typography sx={{ fontWeight: 850 }}>{scopeLabel}</Typography><Typography color="text.secondary" variant="caption">Chọn một người học để xem hồ sơ và các môn đang theo học</Typography></Box>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              <TextField placeholder="Tìm tên, mã, số điện thoại" size="small" value={search} onChange={(event) => { setSearch(event.target.value); resetPage(); }} slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRoundedIcon sx={{ fontSize: 18 }} /></InputAdornment> } }} sx={{ minWidth: { xs: "100%", sm: 235 } }} />
              <TextField select size="small" value={status} onChange={(event) => { setStatus(event.target.value); resetPage(); }} sx={{ minWidth: 140 }}><MenuItem value="all">Mọi trạng thái</MenuItem><MenuItem value="studying">Đang học</MenuItem><MenuItem value="at-risk">Cần hỗ trợ</MenuItem><MenuItem value="inactive">Ngừng học</MenuItem></TextField>
            </Box>
          </Box>
          <TableContainer sx={{ maxHeight: "min(52vh, 560px)" }}>
            <Table size="small" stickyHeader>
              <TableHead><TableRow><TableCell>Mã người học</TableCell><TableCell>Họ và tên</TableCell><TableCell>Khối / lớp</TableCell><TableCell>Môn đang học</TableCell><TableCell>Liên hệ</TableCell><TableCell>Trạng thái</TableCell></TableRow></TableHead>
              <TableBody>{visible.map((student) => { const meta = statusMeta[student.status]; return (
                <TableRow hover key={student.id} onClick={() => setSelectedStudent(student)} sx={{ cursor: "pointer" }}>
                  <TableCell sx={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{student.code}</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>{student.fullName}</TableCell>
                  <TableCell><Typography sx={{ fontSize: 13, fontWeight: 750 }}>{student.className || "Chưa xếp lớp"}</Typography><Typography color="text.secondary" variant="caption">Khối {student.grade}</Typography></TableCell>
                  <TableCell><Chip color={student.subjectIds.length ? "info" : "warning"} label={`${student.subjectIds.length} môn`} size="small" variant="outlined" /></TableCell>
                  <TableCell>{student.guardianPhone}</TableCell>
                  <TableCell><Chip color={meta.color} label={meta.label} size="small" /></TableCell>
                </TableRow>
              ); })}</TableBody>
            </Table>
          </TableContainer>
          {!filtered.length ? <Box sx={{ p: 5, textAlign: "center" }}><Typography color="text.secondary">Không có người học trong phạm vi và bộ lọc này.</Typography></Box> : null}
          <TablePagination component="div" count={filtered.length} onPageChange={(_, value) => setPage(value)} page={page} rowsPerPage={12} rowsPerPageOptions={[12]} />
        </Paper>
      </Box>
      <StudentProfileDrawer school={school} student={selectedStudent} onClose={() => setSelectedStudent(null)} />
    </Box>
  );
}

function Metric({ color = "text.primary", label, value }: { color?: string; label: string; value: number | string }) {
  return <Paper variant="outlined" sx={{ px: 1.75, py: 1.4 }}><Typography color="text.secondary" variant="caption">{label}</Typography><Typography sx={{ color, fontSize: 24, fontWeight: 900, mt: 0.25 }}>{value}</Typography></Paper>;
}

function StudentProfileDrawer({ school, student, onClose }: { school: PartnerSchool; student: SchoolStudent | null; onClose: () => void }) {
  const subjects = school.subjects.filter((subject) => student?.subjectIds.includes(subject.id));
  return <Drawer anchor="right" open={Boolean(student)} onClose={onClose} slotProps={{ paper: { sx: { width: { xs: "100%", sm: 420 } } } }}>
    {student ? <Box sx={{ p: 2.5 }}>
      <Box sx={{ alignItems: "flex-start", display: "flex", justifyContent: "space-between" }}><Box><Typography color="primary.main" sx={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 800 }}>{student.code}</Typography><Typography sx={{ fontSize: 22, fontWeight: 900 }}>{student.fullName}</Typography></Box><IconButton aria-label="Đóng hồ sơ" onClick={onClose}><CloseRoundedIcon /></IconButton></Box>
      <Stack spacing={1.25} sx={{ mt: 3 }}><Detail label="Phạm vi" value={`Khối ${student.grade} · Lớp ${student.className}`} /><Detail label="Ngày sinh" value={student.birthDate} /><Detail label="Liên hệ phụ huynh" value={student.guardianPhone} /><Detail label="Trạng thái" value={statusMeta[student.status].label} /></Stack>
      <Typography sx={{ fontWeight: 850, mt: 3 }}>Môn đang theo học</Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mt: 1 }}>{subjects.length ? subjects.map((subject) => <Chip color="primary" key={subject.id} label={subject.name} size="small" variant="outlined" />) : <Chip color="warning" label="Chưa được gán môn" size="small" />}</Box>
    </Box> : null}
  </Drawer>;
}

function Detail({ label, value }: { label: string; value: string }) {
  return <Box sx={{ borderBottom: "1px solid", borderColor: "divider", pb: 1 }}><Typography color="text.secondary" variant="caption">{label}</Typography><Typography sx={{ fontSize: 14, fontWeight: 750 }}>{value}</Typography></Box>;
}
