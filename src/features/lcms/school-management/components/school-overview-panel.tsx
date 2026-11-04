import ApartmentRoundedIcon from "@mui/icons-material/ApartmentRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import LinearProgress from "@mui/material/LinearProgress";
import Paper from "@mui/material/Paper";
import Rating from "@mui/material/Rating";
import Typography from "@mui/material/Typography";
import type { PartnerSchool } from "@/features/lcms/school-management/types/school-management-types";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";
import { alpha } from "@mui/material/styles";

export function SchoolOverviewPanel({ school }: { school: PartnerSchool }) {
  const totalStudents = school.students.length;
  const atRisk = school.students.filter((student) => student.status === "at-risk").length;
  const activeStudents = school.students.filter((student) => student.status === "studying").length;
  const profileComplete = school.students.filter(
    (student) => Boolean(student.code && student.fullName && student.grade && student.className)
  ).length;

  const percentOf = (value: number) => (totalStudents ? Math.round((value / totalStudents) * 100) : 0);

  const metrics = [
    {
      helper: "Tài khoản đã đồng bộ",
      icon: <GroupsRoundedIcon sx={{ fontSize: 20 }} />,
      iconBg: alpha(ergEnterpriseTokens.color.primary, 0.08),
      iconColor: ergEnterpriseTokens.color.primary,
      label: "Học sinh",
      value: school.students.length,
    },
    {
      helper: `${school.grades.length} khối đang hoạt động`,
      icon: <ApartmentRoundedIcon sx={{ fontSize: 20 }} />,
      iconBg: "rgba(175, 82, 222, 0.12)",
      iconColor: "#7E22CE",
      label: "Lớp học",
      value: school.classes.length,
    },
    {
      helper: "Trong năm học hiện tại",
      icon: <MenuBookRoundedIcon sx={{ fontSize: 20 }} />,
      iconBg: alpha(ergEnterpriseTokens.color.success, 0.12),
      iconColor: "#15803D",
      label: "Môn đăng ký",
      value: school.subjects.length,
    },
    {
      helper: atRisk ? "Cần giáo viên lưu ý" : "Tất cả học sinh ổn định",
      icon: <WarningAmberRoundedIcon sx={{ fontSize: 20 }} />,
      iconBg: atRisk ? alpha(ergEnterpriseTokens.color.warning, 0.12) : alpha(ergEnterpriseTokens.color.success, 0.12),
      iconColor: atRisk ? "#B45309" : "#15803D",
      label: "Cần hỗ trợ",
      value: atRisk,
    },
  ];

  const healthItems = [
    {
      barColor: ergEnterpriseTokens.color.success,
      bgBar: alpha(ergEnterpriseTokens.color.success, 0.12),
      label: "Đang học ổn định",
      percent: percentOf(activeStudents),
      value: activeStudents,
    },
    {
      barColor: ergEnterpriseTokens.color.warning,
      bgBar: alpha(ergEnterpriseTokens.color.warning, 0.12),
      label: "Cần giáo viên hỗ trợ",
      percent: percentOf(atRisk),
      value: atRisk,
    },
    {
      barColor: ergEnterpriseTokens.color.primary,
      bgBar: alpha(ergEnterpriseTokens.color.primary, 0.12),
      label: "Đã đủ hồ sơ học vụ",
      percent: percentOf(profileComplete),
      value: profileComplete,
    },
  ];

  return (
    <Box sx={{ display: "grid", gap: 2.5 }}>
      {/* 4 Apple KPI Cards */}
      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr 1fr", xl: "repeat(4, 1fr)" } }}>
        {metrics.map((metric) => (
          <Paper
            elevation={0}
            key={metric.label}
            sx={{
              bgcolor: "#FFFFFF",
              borderRadius: "16px",
              border: `1px solid ${ergEnterpriseTokens.color.border}`,
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.02), 0 8px 18px -4px rgba(0, 0, 0, 0.03)",
              p: 2.25,
              transition: "all 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
              "&:hover": {
                boxShadow: "0 4px 14px rgba(0, 0, 0, 0.04), 0 12px 24px -4px rgba(0, 0, 0, 0.06)",
                transform: "translateY(-1px)",
              },
            }}
          >
            <Box sx={{ alignItems: "center", display: "flex", justifyContent: "space-between", mb: 1 }}>
              <Typography sx={{ color: ergEnterpriseTokens.color.textMuted, fontSize: "0.78rem", fontWeight: 600 }}>
                {metric.label}
              </Typography>
              <Box
                sx={{
                  alignItems: "center",
                  bgcolor: metric.iconBg,
                  borderRadius: "10px",
                  color: metric.iconColor,
                  display: "flex",
                  height: 32,
                  justifyContent: "center",
                  width: 32,
                }}
              >
                {metric.icon}
              </Box>
            </Box>
            <Typography
              sx={{
                color: ergEnterpriseTokens.color.text,
                fontSize: "1.75rem",
                fontWeight: 600,
                letterSpacing: "-0.025em",
                lineHeight: 1.1,
              }}
            >
              {metric.value}
            </Typography>
            <Typography sx={{ color: ergEnterpriseTokens.color.textMuted, fontSize: "0.72rem", fontWeight: 500, mt: 0.5 }}>
              {metric.helper}
            </Typography>
          </Paper>
        ))}
      </Box>

      {/* Detail Inset Grid */}
      <Box
        sx={{
          display: "grid",
          gap: 2.5,
          gridTemplateColumns: { xs: "1fr", xl: "minmax(0, 1.35fr) minmax(320px, 0.65fr)" },
        }}
      >
        {/* Student Health Card */}
        <Paper
          elevation={0}
          sx={{
            bgcolor: "#FFFFFF",
            borderRadius: "16px",
            border: `1px solid ${ergEnterpriseTokens.color.border}`,
            boxShadow: "0 2px 10px rgba(0, 0, 0, 0.02), 0 10px 28px -4px rgba(0, 0, 0, 0.04)",
            p: 3,
          }}
        >
          <Typography sx={{ color: ergEnterpriseTokens.color.text, fontSize: "1.05rem", fontWeight: 600, letterSpacing: "-0.015em" }}>
            Tình trạng học sinh
          </Typography>
          <Typography sx={{ color: ergEnterpriseTokens.color.textMuted, fontSize: "0.8rem", mt: 0.25 }}>
            Tỷ lệ được tính từ dữ liệu học sinh thực tế mà backend trả về cho trường này.
          </Typography>

          <Box sx={{ mt: 3 }}>
            {healthItems.map((item) => (
              <Box key={item.label} sx={{ mb: 2.5, "&:last-child": { mb: 0 } }}>
                <Box sx={{ alignItems: "center", display: "flex", justifyContent: "space-between", mb: 0.75 }}>
                  <Typography sx={{ color: ergEnterpriseTokens.color.text, fontSize: "0.85rem", fontWeight: 600 }}>
                    {item.label}
                  </Typography>
                  <Typography sx={{ color: ergEnterpriseTokens.color.textMuted, fontSize: "0.825rem", fontWeight: 600 }}>
                    {item.value} học sinh · {item.percent}%
                  </Typography>
                </Box>
                <LinearProgress
                  value={item.percent}
                  variant="determinate"
                  sx={{
                    bgcolor: item.bgBar,
                    borderRadius: 9999,
                    height: 7,
                    "& .MuiLinearProgress-bar": {
                      bgcolor: item.barColor,
                      borderRadius: 9999,
                    },
                  }}
                />
              </Box>
            ))}
          </Box>
        </Paper>

        {/* Recent Reviews Card */}
        <Paper
          elevation={0}
          sx={{
            bgcolor: "#FFFFFF",
            borderRadius: "16px",
            border: `1px solid ${ergEnterpriseTokens.color.border}`,
            boxShadow: "0 2px 10px rgba(0, 0, 0, 0.02), 0 10px 28px -4px rgba(0, 0, 0, 0.04)",
            p: 3,
          }}
        >
          <Typography sx={{ color: ergEnterpriseTokens.color.text, fontSize: "1.05rem", fontWeight: 600, letterSpacing: "-0.015em" }}>
            Đánh giá gần đây
          </Typography>
          <Typography sx={{ color: ergEnterpriseTokens.color.textMuted, fontSize: "0.8rem", mt: 0.25 }}>
            Phản hồi từ phụ huynh và học viên về cơ sở đào tạo.
          </Typography>

          <Box sx={{ mt: 2 }}>
            {school.reviews.length ? (
              school.reviews.slice(0, 3).map((review) => (
                <Box
                  key={review.id}
                  sx={{
                    borderBottom: `1px solid ${ergEnterpriseTokens.color.border}`,
                    py: 1.75,
                    "&:last-child": { borderBottom: 0, pb: 0 },
                  }}
                >
                  <Box sx={{ alignItems: "center", display: "flex", justifyContent: "space-between" }}>
                    <Box sx={{ alignItems: "center", display: "flex", gap: 1 }}>
                      <Avatar
                        sx={{
                          bgcolor: alpha(ergEnterpriseTokens.color.primary, 0.08),
                          color: ergEnterpriseTokens.color.primary,
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          height: 28,
                          width: 28,
                        }}
                      >
                        {review.author?.slice(0, 2).toUpperCase() || "PH"}
                      </Avatar>
                      <Typography sx={{ color: ergEnterpriseTokens.color.text, fontSize: "0.85rem", fontWeight: 600 }}>
                        {review.author}
                      </Typography>
                    </Box>
                    <Rating
                      emptyIcon={<StarRoundedIcon sx={{ color: "#E5E5EA", fontSize: 16 }} />}
                      icon={<StarRoundedIcon sx={{ color: ergEnterpriseTokens.color.warning, fontSize: 16 }} />}
                      precision={0.5}
                      readOnly
                      size="small"
                      value={review.rating}
                    />
                  </Box>
                  <Typography
                    sx={{
                      color: ergEnterpriseTokens.color.textMuted,
                      display: "-webkit-box",
                      fontSize: "0.8rem",
                      mt: 1,
                      overflow: "hidden",
                      WebkitBoxOrient: "vertical",
                      WebkitLineClamp: 2,
                    }}
                  >
                    {review.content}
                  </Typography>
                </Box>
              ))
            ) : (
              <Box sx={{ p: 3, textAlign: "center" }}>
                <Typography sx={{ color: ergEnterpriseTokens.color.textMuted, fontSize: "0.85rem" }}>
                  Chưa có đánh giá nào cho trường này.
                </Typography>
              </Box>
            )}
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
