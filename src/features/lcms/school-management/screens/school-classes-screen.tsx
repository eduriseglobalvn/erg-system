import AddRoundedIcon from "@mui/icons-material/AddRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
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
import { SchoolPageShell } from "@/features/lcms/school-management/components/school-page-shell";
import { useSchoolManagementContext } from "@/features/lcms/school-management/components/school-management-context";

export default function SchoolClassesScreen() {
  const { selectedSchool, unsupportedApiMessage } = useSchoolManagementContext();
  const [search, setSearch] = useState("");
  if (!selectedSchool) return null;
  const classes = selectedSchool.classes.filter((item) => `${item.name} ${item.homeroomTeacher}`.toLowerCase().includes(search.toLowerCase()));
  return <SchoolPageShell title="Lớp học" description="Quản lý lớp, giáo viên chủ nhiệm, sĩ số và trạng thái vận hành." action={<Button disabled startIcon={<AddRoundedIcon />} variant="contained">Thêm lớp</Button>}>
    <Alert severity="info" sx={{ mb: 2 }}>{unsupportedApiMessage}</Alert>
    <Paper variant="outlined" sx={{ overflow: "hidden" }}><TextField placeholder="Tìm lớp hoặc giáo viên chủ nhiệm..." size="small" value={search} onChange={(e) => setSearch(e.target.value)} slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRoundedIcon fontSize="small" /></InputAdornment> } }} sx={{ m: 2, width: { xs: "calc(100% - 32px)", sm: 340 } }} /><TableContainer><Table size="small"><TableHead><TableRow><TableCell>Lớp học</TableCell><TableCell>Khối</TableCell><TableCell>Giáo viên chủ nhiệm</TableCell><TableCell align="right">Sĩ số</TableCell><TableCell align="right">Sức chứa</TableCell><TableCell>Tình trạng</TableCell></TableRow></TableHead><TableBody>{classes.map((item) => <TableRow hover key={item.id}><TableCell><Typography sx={{ fontWeight: 800 }} variant="body2">{item.name}</Typography><Typography color="text.secondary" variant="caption">{selectedSchool.academicYear}</Typography></TableCell><TableCell>Khối {item.grade}</TableCell><TableCell>{item.homeroomTeacher}</TableCell><TableCell align="right">{item.studentCount}</TableCell><TableCell align="right">45</TableCell><TableCell><Chip color={item.studentCount > 42 ? "warning" : "success"} label={item.studentCount > 42 ? "Gần đầy" : "Ổn định"} size="small" /></TableCell></TableRow>)}</TableBody></Table></TableContainer></Paper>
  </SchoolPageShell>;
}
