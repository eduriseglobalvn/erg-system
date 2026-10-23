import FileUploadRoundedIcon from "@mui/icons-material/FileUploadRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import InputAdornment from "@mui/material/InputAdornment";
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
import { useMemo, useState } from "react";
import type { PartnerSchool } from "@/features/lcms/school-management/types/school-management-types";

const statusMeta = { studying: { label: "Đang học", color: "success" }, "at-risk": { label: "Cần hỗ trợ", color: "warning" }, inactive: { label: "Ngừng học", color: "default" } } as const;

export function SchoolStudentsPanel({ onImport, school }: { onImport: () => void; school: PartnerSchool }) {
  const [search, setSearch] = useState("");
  const [className, setClassName] = useState("all");
  const [page, setPage] = useState(0);
  const filtered = useMemo(() => school.students.filter((student) => {
    const matchesSearch = `${student.fullName} ${student.code} ${student.guardianPhone}`.toLowerCase().includes(search.toLowerCase());
    return matchesSearch && (className === "all" || student.className === className);
  }), [className, school.students, search]);
  const visible = filtered.slice(page * 10, page * 10 + 10);

  return (
    <Paper variant="outlined" sx={{ overflow: "hidden" }}>
      <Box sx={{ alignItems: { xs: "stretch", md: "center" }, borderBottom: "1px solid", borderColor: "divider", display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 1.25, justifyContent: "space-between", p: 2 }}>
        <Box><Typography sx={{ fontWeight: 850 }}>Danh sách học sinh</Typography><Typography color="text.secondary" variant="body2">{school.students.length} học sinh đã liên kết với trường</Typography></Box>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          <TextField placeholder="Tìm học sinh..." size="small" value={search} onChange={(event) => { setSearch(event.target.value); setPage(0); }} slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRoundedIcon sx={{ fontSize: 18 }} /></InputAdornment> } }} sx={{ width: { xs: "100%", sm: 220 } }} />
          <TextField select size="small" value={className} onChange={(event) => { setClassName(event.target.value); setPage(0); }} sx={{ minWidth: 135 }}><MenuItem value="all">Tất cả lớp</MenuItem>{school.classes.map((item) => <MenuItem key={item.id} value={item.name}>{item.name}</MenuItem>)}</TextField>
          <Button onClick={onImport} startIcon={<FileUploadRoundedIcon />} variant="contained">Nhập danh sách</Button>
        </Box>
      </Box>
      <TableContainer><Table size="small"><TableHead><TableRow><TableCell>Mã HS</TableCell><TableCell>Họ và tên</TableCell><TableCell>Ngày sinh</TableCell><TableCell>Khối</TableCell><TableCell>Lớp</TableCell><TableCell>SĐT phụ huynh</TableCell><TableCell>Môn đã gán</TableCell><TableCell>Trạng thái</TableCell></TableRow></TableHead>
        <TableBody>{visible.map((student) => { const status = statusMeta[student.status]; return <TableRow hover key={student.id}><TableCell sx={{ color: "text.secondary", fontFamily: "var(--font-mono)", fontSize: 12 }}>{student.code}</TableCell><TableCell sx={{ fontWeight: 750 }}>{student.fullName}</TableCell><TableCell>{student.birthDate}</TableCell><TableCell>{student.grade}</TableCell><TableCell>{student.className}</TableCell><TableCell>{student.guardianPhone}</TableCell><TableCell>{student.subjectIds.length}</TableCell><TableCell><Chip color={status.color} label={status.label} size="small" /></TableCell></TableRow>; })}</TableBody>
      </Table></TableContainer>
      {!filtered.length ? <Box sx={{ p: 5, textAlign: "center" }}><Typography color="text.secondary">Không có học sinh phù hợp với bộ lọc.</Typography></Box> : null}
      <TablePagination component="div" count={filtered.length} onPageChange={(_, value) => setPage(value)} page={page} rowsPerPage={10} rowsPerPageOptions={[10]} />
    </Paper>
  );
}
