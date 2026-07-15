import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
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
import { useMemo, useState } from "react";
import { SchoolFormDialog } from "@/features/lcms/school-management/components/school-form-dialog";
import { useSchoolManagementContext } from "@/features/lcms/school-management/components/school-management-context";
import { SchoolPageShell } from "@/features/lcms/school-management/components/school-page-shell";
import type { SchoolDraft } from "@/features/lcms/school-management/types/school-management-types";
import { schoolTypeMeta } from "@/features/lcms/school-management/types/school-type-config";
import { useNavigate } from "@/routes/router-compat";

const statusMeta = { active: { label: "Đang vận hành", color: "success" }, onboarding: { label: "Đang triển khai", color: "warning" }, paused: { label: "Tạm dừng", color: "default" } } as const;

export default function SchoolDirectoryScreen() {
  const { error, isLoading, refetch, saveSchool, schools, selectSchool } = useSchoolManagementContext();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState(false);
  const filtered = useMemo(() => schools.filter((school) => `${school.name} ${school.id} ${school.district}`.toLowerCase().includes(search.toLowerCase())), [schools, search]);
  function openSchool(id: string) { selectSchool(id); navigate(`/schools/detail?schoolId=${encodeURIComponent(id)}`); }
  async function createSchool(draft: SchoolDraft) { const id = await saveSchool(draft); if (id) navigate(`/schools/detail?schoolId=${encodeURIComponent(id)}`); }

  return <SchoolPageShell unscoped title="Danh sách trường liên kết" description="Quản lý toàn bộ trường, tình trạng triển khai và độ hoàn thiện dữ liệu." action={<Button onClick={() => setAdding(true)} startIcon={<AddRoundedIcon />} variant="contained">Thêm trường</Button>}>
    <Paper variant="outlined" sx={{ overflow: "hidden" }}>
      <Box sx={{ alignItems: { xs: "stretch", sm: "center" }, borderBottom: "1px solid", borderColor: "divider", display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 1.5, justifyContent: "space-between", p: 2 }}>
        <Box><Typography sx={{ fontWeight: 850 }}>{schools.length} trường trong hệ thống</Typography><Typography color="text.secondary" variant="body2">{schools.filter((school) => school.status === "active").length} trường đang vận hành</Typography></Box>
        <TextField placeholder="Tìm tên, mã trường, địa phương..." size="small" value={search} onChange={(event) => setSearch(event.target.value)} slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRoundedIcon sx={{ fontSize: 19 }} /></InputAdornment> } }} sx={{ width: { xs: "100%", sm: 320 } }} />
      </Box>
      {error ? <Alert action={<Button color="inherit" onClick={() => void refetch()} size="small">Thử lại</Button>} severity="error" sx={{ m: 2 }}>Không thể tải danh sách trường: {error instanceof Error ? error.message : "Lỗi không xác định"}</Alert> : null}
      <TableContainer><Table stickyHeader size="small"><TableHead><TableRow><TableCell>Trường học</TableCell><TableCell>Loại hình</TableCell><TableCell>Địa phương</TableCell><TableCell>Đầu mối</TableCell><TableCell align="right">Người học</TableCell><TableCell align="right">Lớp</TableCell><TableCell align="right">Môn</TableCell><TableCell>Trạng thái</TableCell><TableCell width={52} /></TableRow></TableHead>
        <TableBody>{isLoading ? Array.from({ length: 5 }, (_, index) => <TableRow key={index}>{Array.from({ length: 9 }, (__, cell) => <TableCell key={cell}><Skeleton width={cell === 0 ? 160 : 70} /></TableCell>)}</TableRow>) : filtered.map((school) => { const status = statusMeta[school.status]; const type = schoolTypeMeta[school.schoolType]; return <TableRow hover key={school.id} onClick={() => openSchool(school.id)} sx={{ cursor: "pointer" }}><TableCell><Typography sx={{ fontWeight: 800 }} variant="body2">{school.name}</Typography><Typography color="text.secondary" sx={{ fontFamily: "var(--font-mono)" }} variant="caption">{school.id}</Typography></TableCell><TableCell><Chip label={type.shortLabel} size="small" variant="outlined" /></TableCell><TableCell>{school.district || "Chưa cập nhật"}</TableCell><TableCell><Typography variant="body2">{school.principal || "Xem trong chi tiết"}</Typography><Typography color="text.secondary" variant="caption">{school.contactPhone}</Typography></TableCell><TableCell align="right">{school.studentCount ?? school.students.length}</TableCell><TableCell align="right">{school.classCount ?? school.classes.length}</TableCell><TableCell align="right">{school.subjects.length || "—"}</TableCell><TableCell><Chip color={status.color} label={status.label} size="small" /></TableCell><TableCell><IconButton aria-label={`Mở ${school.name}`} size="small"><ArrowForwardRoundedIcon fontSize="small" /></IconButton></TableCell></TableRow>; })}</TableBody>
      </Table></TableContainer>
    </Paper>
    {adding ? <SchoolFormDialog onClose={() => setAdding(false)} onSave={createSchool} /> : null}
  </SchoolPageShell>;
}
