import AddRoundedIcon from "@mui/icons-material/AddRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import InputAdornment from "@mui/material/InputAdornment";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { ClassImportDialog } from "@/features/lcms/school-management/components/class-import-dialog";
import { SchoolPageShell } from "@/features/lcms/school-management/components/school-page-shell";
import { useSchoolManagementContext } from "@/features/lcms/school-management/components/school-management-context";

export default function SchoolClassesScreen() {
  const { addClasses, selectedSchool } = useSchoolManagementContext();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  if (!selectedSchool) return null;
  const classes = selectedSchool.classes.filter((item) => `${item.name} ${item.homeroomTeacher}`.toLowerCase().includes(search.toLowerCase()));
  return <SchoolPageShell title="Lớp học" description="Quản lý lớp, khối và sĩ số theo contract backend; giáo viên chủ nhiệm chỉ nhận ID khi backend có danh mục giáo viên." action={<Button onClick={() => setDialogOpen(true)} startIcon={<AddRoundedIcon />} variant="contained">Thêm lớp</Button>}>
    <Paper variant="outlined" sx={{ overflow: "hidden" }}><TextField placeholder="Tìm lớp hoặc giáo viên chủ nhiệm..." size="small" value={search} onChange={(e) => setSearch(e.target.value)} slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRoundedIcon fontSize="small" /></InputAdornment> } }} sx={{ m: 2, width: { xs: "calc(100% - 32px)", sm: 340 } }} /><TableContainer><Table size="small"><TableHead><TableRow><TableCell>Lớp học</TableCell><TableCell>Khối</TableCell><TableCell>Giáo viên chủ nhiệm</TableCell><TableCell align="right">Sĩ số</TableCell><TableCell>Tình trạng</TableCell></TableRow></TableHead><TableBody>{classes.map((item) => { const status = item.status?.toUpperCase(); const label = status === "ACTIVE" ? "Đang hoạt động" : status || "Chưa xác định"; return <TableRow hover key={item.id}><TableCell><Typography sx={{ fontWeight: 800 }} variant="body2">{item.name}</Typography><Typography color="text.secondary" variant="caption">{item.academicYear || selectedSchool.academicYear}</Typography></TableCell><TableCell>{item.grade ? `Khối ${item.grade}` : "Chưa gán"}</TableCell><TableCell>{item.homeroomTeacher || "Chưa gán"}</TableCell><TableCell align="right">{item.studentCount}</TableCell><TableCell><Chip color={status === "ACTIVE" ? "success" : "default"} label={label} size="small" /></TableCell></TableRow>; })}</TableBody></Table></TableContainer></Paper>
    {dialogOpen ? <ClassImportDialog classLabel="Lớp học" existingClassNames={selectedSchool.classes.map((item) => item.name)} grades={selectedSchool.grades} onClose={() => setDialogOpen(false)} onImport={addClasses} usesGrades={selectedSchool.schoolType !== "university" && selectedSchool.schoolType !== "training-center"} /> : null}
  </SchoolPageShell>;
}
