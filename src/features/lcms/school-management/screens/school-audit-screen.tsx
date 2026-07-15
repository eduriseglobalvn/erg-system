import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
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
import { SchoolPageShell } from "@/features/lcms/school-management/components/school-page-shell";

const auditRows = [
  ["Cập nhật hồ sơ trường", "Nguyễn Minh Anh", "UI", "Tên người phụ trách", "13/07/2026 · 10:24"],
  ["Import 182 học sinh", "Trần Thu Hà", "IMPORT", "Khối 6", "13/07/2026 · 09:42"],
  ["Gán học sinh vào môn Tiếng Anh", "Lê Mạnh Hùng", "BULK", "38 học sinh · Lớp 6A1", "12/07/2026 · 16:05"],
  ["Tạo lớp 7A2", "Nguyễn Minh Anh", "UI", "Khối 7 · Năm học 2026–2027", "12/07/2026 · 14:18"],
  ["Cập nhật đồng bộ", "ERG System", "API", "Student Sync Job", "12/07/2026 · 11:30"],
];

export default function SchoolAuditScreen() {
  const [search, setSearch] = useState("");
  const rows = auditRows.filter((row) => row.join(" ").toLowerCase().includes(search.toLowerCase()));
  return <SchoolPageShell title="Nhật ký hoạt động" description="Theo dõi mọi thay đổi dữ liệu từ UI, API và các đợt nhập hàng loạt." action={<Button startIcon={<DownloadRoundedIcon />} variant="outlined">Xuất nhật ký</Button>}>
    <Paper variant="outlined" sx={{ overflow: "hidden" }}><TextField placeholder="Tìm hành động, người thực hiện..." size="small" value={search} onChange={(e) => setSearch(e.target.value)} slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRoundedIcon fontSize="small" /></InputAdornment> } }} sx={{ m: 2, width: { xs: "calc(100% - 32px)", sm: 360 } }} /><TableContainer><Table size="small"><TableHead><TableRow><TableCell>Hành động</TableCell><TableCell>Người thực hiện</TableCell><TableCell>Nguồn</TableCell><TableCell>Phạm vi ảnh hưởng</TableCell><TableCell>Thời gian</TableCell></TableRow></TableHead><TableBody>{rows.map((row) => <TableRow hover key={`${row[0]}-${row[4]}`}><TableCell sx={{ fontWeight: 750 }}>{row[0]}</TableCell><TableCell>{row[1]}</TableCell><TableCell><Chip label={row[2]} size="small" variant="outlined" /></TableCell><TableCell><Typography color="text.secondary" variant="body2">{row[3]}</Typography></TableCell><TableCell>{row[4]}</TableCell></TableRow>)}</TableBody></Table></TableContainer></Paper>
  </SchoolPageShell>;
}
