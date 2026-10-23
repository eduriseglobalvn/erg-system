import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { SchoolPageShell } from "@/features/lcms/school-management/components/school-page-shell";
import { useSchoolManagementContext } from "@/features/lcms/school-management/components/school-management-context";

const importCapabilities = [
  { icon: <DescriptionRoundedIcon />, title: "Excel / CSV", text: "Tải file, chọn sheet và ánh xạ cột dữ liệu." },
  { icon: <HistoryRoundedIcon />, title: "Google Sheets", text: "Kết nối sheet và đọc dữ liệu theo tab." },
  { icon: <AddRoundedIcon />, title: "Nhập tay hàng loạt", text: "Bảng kiểu spreadsheet, hỗ trợ paste nhiều ô." },
];

export default function SchoolImportsScreen() {
  const { selectedSchool, unsupportedApiMessage } = useSchoolManagementContext();
  if (!selectedSchool) return null;
  return (
    <SchoolPageShell
      title="Trung tâm nhập dữ liệu"
      description="Nhập, rà soát và theo dõi dữ liệu từ Excel, Google Sheets hoặc bảng nhập tay."
      action={<Button disabled title="Backend chưa cung cấp import job và history ở phase hiện tại." startIcon={<AddRoundedIcon />} variant="contained">Tạo đợt nhập</Button>}
    >
      <Alert severity="info" sx={{ mb: 2 }}>{unsupportedApiMessage} Không hiển thị lịch sử mẫu khi backend chưa có import contract.</Alert>
      <Box sx={{ display: "grid", gap: 2 }}>
        <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", md: "repeat(3,1fr)" } }}>
          {importCapabilities.map((item) => <Paper key={item.title} variant="outlined" sx={{ p: 2.25 }}><Box sx={{ color: "primary.main" }}>{item.icon}</Box><Typography sx={{ fontWeight: 850, mt: 1 }}>{item.title}</Typography><Typography color="text.secondary" sx={{ mt: 0.5 }} variant="body2">{item.text}</Typography><Chip label="Chờ backend contract" size="small" sx={{ mt: 1.5 }} variant="outlined" /></Paper>)}
        </Box>
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography sx={{ fontWeight: 850 }}>Lịch sử nhập gần đây</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }} variant="body2">Chưa có API truy vấn import history cho trường {selectedSchool.name}. Khi backend phát hành job/history contract, màn hình này sẽ hiển thị pagination, lỗi từng dòng và audit reference.</Typography>
        </Paper>
      </Box>
    </SchoolPageShell>
  );
}
