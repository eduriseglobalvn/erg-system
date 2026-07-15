import ApartmentRoundedIcon from "@mui/icons-material/ApartmentRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import Box from "@mui/material/Box";
import LinearProgress from "@mui/material/LinearProgress";
import Paper from "@mui/material/Paper";
import Rating from "@mui/material/Rating";
import Typography from "@mui/material/Typography";
import type { PartnerSchool } from "@/features/lcms/school-management/types/school-management-types";

export function SchoolOverviewPanel({ school }: { school: PartnerSchool }) {
  const atRisk = school.students.filter((student) => student.status === "at-risk").length;
  const metrics = [
    { label: "Học sinh", value: school.students.length, helper: "Tài khoản đã đồng bộ", icon: <GroupsRoundedIcon />, tone: "primary.main" },
    { label: "Lớp học", value: school.classes.length, helper: `${school.grades.length} khối đang hoạt động`, icon: <ApartmentRoundedIcon />, tone: "info.main" },
    { label: "Môn đăng ký", value: school.subjects.length, helper: "Trong năm học hiện tại", icon: <MenuBookRoundedIcon />, tone: "success.main" },
    { label: "Cần hỗ trợ", value: atRisk, helper: "Học sinh có cảnh báo", icon: <WarningAmberRoundedIcon />, tone: "warning.main" },
  ];
  return (
    <Box sx={{ display: "grid", gap: 2.5 }}>
      <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr 1fr", xl: "repeat(4, 1fr)" } }}>
        {metrics.map((metric) => (
          <Paper key={metric.label} variant="outlined" sx={{ p: 2 }}>
            <Box sx={{ alignItems: "center", color: metric.tone, display: "flex", justifyContent: "space-between" }}>{metric.icon}<Typography color="text.secondary" variant="caption">{metric.label}</Typography></Box>
            <Typography sx={{ fontSize: 28, fontWeight: 850, mt: 1 }}>{metric.value}</Typography>
            <Typography color="text.secondary" variant="caption">{metric.helper}</Typography>
          </Paper>
        ))}
      </Box>
      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", xl: "minmax(0,1.35fr) minmax(300px,.65fr)" } }}>
        <Paper variant="outlined" sx={{ p: 2.5 }}>
          <Typography sx={{ fontWeight: 850 }} variant="subtitle1">Tình trạng học sinh</Typography>
          <Typography color="text.secondary" variant="body2">Theo dõi mức tham gia và cảnh báo trong 30 ngày gần nhất.</Typography>
          {[{ label: "Đang học ổn định", value: school.students.length - atRisk, percent: 86, color: "success" }, { label: "Cần giáo viên hỗ trợ", value: atRisk, percent: 14, color: "warning" }, { label: "Đã đủ hồ sơ", value: Math.max(0, school.students.length - 3), percent: 92, color: "primary" }].map((item) => (
            <Box key={item.label} sx={{ mt: 2.25 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.75 }}><Typography variant="body2">{item.label}</Typography><Typography sx={{ fontWeight: 800 }} variant="body2">{item.value} · {item.percent}%</Typography></Box>
              <LinearProgress color={item.color as "success" | "warning" | "primary"} value={item.percent} variant="determinate" sx={{ borderRadius: 4, height: 7 }} />
            </Box>
          ))}
        </Paper>
        <Paper variant="outlined" sx={{ p: 2.5 }}>
          <Typography sx={{ fontWeight: 850 }} variant="subtitle1">Đánh giá gần đây</Typography>
          {school.reviews.length ? school.reviews.slice(0, 2).map((review) => (
            <Box key={review.id} sx={{ borderBottom: "1px solid", borderColor: "divider", py: 1.5, "&:last-child": { borderBottom: 0 } }}>
              <Box sx={{ alignItems: "center", display: "flex", justifyContent: "space-between" }}><Typography sx={{ fontWeight: 750 }} variant="body2">{review.author}</Typography><Rating precision={0.5} readOnly size="small" value={review.rating} /></Box>
              <Typography color="text.secondary" sx={{ display: "-webkit-box", mt: 0.75, overflow: "hidden", WebkitBoxOrient: "vertical", WebkitLineClamp: 2 }} variant="caption">{review.content}</Typography>
            </Box>
          )) : <Typography color="text.secondary" sx={{ mt: 2 }} variant="body2">Chưa có đánh giá cho trường này.</Typography>}
        </Paper>
      </Box>
    </Box>
  );
}
