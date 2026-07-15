import AddRoundedIcon from "@mui/icons-material/AddRounded";
import SyncRoundedIcon from "@mui/icons-material/SyncRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
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

export default function SchoolGradesScreen() {
  const { addGradeRecord, isLoading, isSaving, selectedSchool, syncGrades } = useSchoolManagementContext();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [label, setLabel] = useState("");
  const records = selectedSchool?.gradeRecords ?? [];
  return <SchoolPageShell title="Khối học" description="Quản lý danh mục khối theo năm học. Khối mặc định được tạo theo loại hình trường." action={<Box sx={{ display: "flex", gap: 1 }}><Button disabled={!selectedSchool || isSaving} onClick={() => void syncGrades()} startIcon={<SyncRoundedIcon />} variant="outlined">Đồng bộ khối chuẩn</Button><Button disabled={!selectedSchool || isSaving} onClick={() => setOpen(true)} startIcon={<AddRoundedIcon />} variant="contained">Thêm khối</Button></Box>}>
    <Paper variant="outlined" sx={{ overflow: "hidden" }}><TableContainer><Table size="small"><TableHead><TableRow><TableCell>Khối học</TableCell><TableCell>Mã nội bộ</TableCell><TableCell>Nguồn</TableCell><TableCell>Thứ tự</TableCell><TableCell>Trạng thái</TableCell></TableRow></TableHead><TableBody>{isLoading ? Array.from({ length: 5 }, (_, row) => <TableRow key={row}>{Array.from({ length: 5 }, (__, cell) => <TableCell key={cell}><Skeleton /></TableCell>)}</TableRow>) : records.map((grade) => <TableRow hover key={grade.id}><TableCell sx={{ fontWeight: 800 }}>{grade.label}</TableCell><TableCell>{grade.gradeCode}</TableCell><TableCell>{grade.source === "DEFAULT" ? "Theo loại trường" : "Tạo thủ công"}</TableCell><TableCell>{grade.sortOrder}</TableCell><TableCell><Chip color={grade.status === "ACTIVE" ? "success" : "default"} label={grade.status === "ACTIVE" ? "Đang sử dụng" : grade.status} size="small" /></TableCell></TableRow>)}</TableBody></Table></TableContainer>{!isLoading && !records.length ? <Box sx={{ p: 4, textAlign: "center" }}><Typography sx={{ fontWeight: 800 }}>Chưa có khối học</Typography><Typography color="text.secondary" variant="body2">Nhấn “Đồng bộ khối chuẩn” để tạo đúng khối theo loại trường.</Typography></Box> : null}</Paper>
    <Dialog fullWidth maxWidth="xs" onClose={() => setOpen(false)} open={open}><DialogTitle>Thêm khối tùy chỉnh</DialogTitle><DialogContent sx={{ display: "grid", gap: 2, pt: "12px !important" }}><TextField label="Mã khối" onChange={(event) => setCode(event.target.value)} value={code} /><TextField label="Tên hiển thị" onChange={(event) => setLabel(event.target.value)} value={label} /></DialogContent><DialogActions><Button onClick={() => setOpen(false)}>Hủy</Button><Button disabled={!code.trim() || !label.trim() || isSaving} onClick={async () => { await addGradeRecord({ gradeCode: code.trim(), label: label.trim(), sortOrder: records.length + 1, status: "ACTIVE" }); setOpen(false); }} variant="contained">Thêm khối</Button></DialogActions></Dialog>
  </SchoolPageShell>;
}
