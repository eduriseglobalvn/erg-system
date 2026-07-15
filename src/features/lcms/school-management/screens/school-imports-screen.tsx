import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import Box from "@mui/material/Box";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { StudentImportDialog } from "@/features/lcms/school-management/components/student-import-dialog";
import { SchoolPageShell } from "@/features/lcms/school-management/components/school-page-shell";
import { useSchoolManagementContext } from "@/features/lcms/school-management/components/school-management-context";
import type { StudentImportRow } from "@/features/lcms/school-management/types/school-management-types";

const history = [
  { id: "IMP-2026-071", source: "Google Sheets", file: "Danh sách học sinh khối 6", rows: 186, success: 182, issues: 4, owner: "Nguyễn Minh Anh", time: "13/07/2026 · 09:42" },
  { id: "IMP-2026-068", source: "Excel", file: "DS lớp 7 cập nhật.xlsx", rows: 124, success: 124, issues: 0, owner: "Trần Thu Hà", time: "11/07/2026 · 15:20" },
  { id: "IMP-2026-063", source: "Nhập tay", file: "Bổ sung học sinh mới", rows: 12, success: 11, issues: 1, owner: "Lê Mạnh Hùng", time: "08/07/2026 · 10:05" },
];

export default function SchoolImportsScreen() {
  const { addStudents, selectedSchool, unsupportedApiMessage } = useSchoolManagementContext();
  const [open, setOpen] = useState(false);
  if (!selectedSchool) return null;
  function importRows(rows: StudentImportRow[]) { addStudents(rows.map((row) => ({ code: row.code || `${selectedSchool!.id}-${Date.now()}`, fullName: row.fullName, birthDate: row.birthDate, grade: row.grade, className: row.className, guardianPhone: row.guardianPhone, subjectIds: [], status: "studying" }))); }
  return <SchoolPageShell title="Trung tâm nhập dữ liệu" description="Nhập, rà soát và theo dõi dữ liệu từ Excel, Google Sheets hoặc bảng nhập tay." action={<Button disabled startIcon={<AddRoundedIcon />} variant="contained">Tạo đợt nhập</Button>}>
    <Alert severity="info" sx={{ mb: 2 }}>{unsupportedApiMessage} Lịch sử bên dưới là dữ liệu thiết kế mẫu.</Alert>
    <Box sx={{ display: "grid", gap: 2 }}><Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", md: "repeat(3,1fr)" } }}>{[{ title: "Excel / CSV", text: "Tải file, chọn sheet và ánh xạ cột dữ liệu.", icon: <DescriptionRoundedIcon /> }, { title: "Google Sheets", text: "Kết nối sheet công khai và đọc dữ liệu theo tab.", icon: <HistoryRoundedIcon /> }, { title: "Nhập tay hàng loạt", text: "Bảng kiểu spreadsheet, hỗ trợ paste nhiều ô.", icon: <AddRoundedIcon /> }].map((item) => <Paper key={item.title} variant="outlined" sx={{ p: 2.25 }}><Box sx={{ color: "primary.main" }}>{item.icon}</Box><Typography sx={{ fontWeight: 850, mt: 1 }}>{item.title}</Typography><Typography color="text.secondary" sx={{ mt: 0.5 }} variant="body2">{item.text}</Typography><Button disabled size="small" sx={{ mt: 1.5 }}>Chờ API</Button></Paper>)}</Box>
      <Paper variant="outlined" sx={{ overflow: "hidden" }}><Box sx={{ borderBottom: "1px solid", borderColor: "divider", p: 2 }}><Typography sx={{ fontWeight: 850 }}>Lịch sử nhập gần đây</Typography><Typography color="text.secondary" variant="body2">Theo dõi kết quả, dòng lỗi và người thực hiện.</Typography></Box><TableContainer><Table size="small"><TableHead><TableRow><TableCell>Mã đợt nhập</TableCell><TableCell>Nguồn / Tệp</TableCell><TableCell align="right">Tổng dòng</TableCell><TableCell align="right">Thành công</TableCell><TableCell align="right">Cần xử lý</TableCell><TableCell>Người thực hiện</TableCell><TableCell>Thời gian</TableCell></TableRow></TableHead><TableBody>{history.map((item) => <TableRow hover key={item.id}><TableCell sx={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{item.id}</TableCell><TableCell><Typography sx={{ fontWeight: 750 }} variant="body2">{item.file}</Typography><Typography color="text.secondary" variant="caption">{item.source}</Typography></TableCell><TableCell align="right">{item.rows}</TableCell><TableCell align="right">{item.success}</TableCell><TableCell align="right"><Chip color={item.issues ? "warning" : "success"} label={item.issues} size="small" /></TableCell><TableCell>{item.owner}</TableCell><TableCell>{item.time}</TableCell></TableRow>)}</TableBody></Table></TableContainer></Paper></Box>
    {open ? <StudentImportDialog onClose={() => setOpen(false)} onImport={importRows} school={selectedSchool} /> : null}
  </SchoolPageShell>;
}
