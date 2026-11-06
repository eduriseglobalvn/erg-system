import AddRoundedIcon from "@mui/icons-material/AddRounded";
import GroupAddRoundedIcon from "@mui/icons-material/GroupAddRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import Box from "@mui/material/Box";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import LinearProgress from "@mui/material/LinearProgress";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { SchoolPageShell } from "@/features/lcms/school-management/components/school-page-shell";
import { useSchoolManagementContext } from "@/features/lcms/school-management/components/school-management-context";
import { useNavigate } from "@tanstack/react-router";
import { adminPath } from "@/platform/workspaces/workspace-paths";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";
import { alpha } from "@mui/material/styles";

export default function SchoolSubjectsScreen() {
  const { selectedSchool, unsupportedApiMessage } = useSchoolManagementContext();
  const navigate = useNavigate();

  if (!selectedSchool) return null;

  return (
    <SchoolPageShell
      title="Môn học đăng ký"
      description="Danh mục môn trường sử dụng, quy mô ghi danh và giáo viên phụ trách chuyên môn."
      action={
        <Button
          disabled
          startIcon={<AddRoundedIcon sx={{ fontSize: 18 }} />}
          variant="contained"
          sx={{
            borderRadius: "10px",
            fontSize: "0.85rem",
            fontWeight: 600,
            textTransform: "none",
          }}
        >
          Đăng ký môn
        </Button>
      }
    >
      {unsupportedApiMessage ? (
        <Alert
          severity="info"
          sx={{
            bgcolor: alpha(ergEnterpriseTokens.color.primary, 0.08),
            border: `1px solid ${alpha(ergEnterpriseTokens.color.primary, 0.2)}`,
            borderRadius: "12px",
            color: ergEnterpriseTokens.color.primary,
            mb: 2.5,
            "& .MuiAlert-icon": { color: ergEnterpriseTokens.color.primary },
          }}
        >
          {unsupportedApiMessage}
        </Alert>
      ) : null}

      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: { xs: "1fr", lg: "repeat(2, minmax(0, 1fr))" },
        }}
      >
        {selectedSchool.subjects.map((subject) => {
          const percent = Math.min(
            100,
            Math.round((subject.studentCount / Math.max(selectedSchool.students.length, 1)) * 100)
          );

          return (
            <Paper
              elevation={0}
              key={subject.id}
              sx={{
                bgcolor: "#FFFFFF",
                borderRadius: "16px",
                border: `1px solid ${ergEnterpriseTokens.color.border}`,
                boxShadow: "0 2px 10px rgba(0, 0, 0, 0.02), 0 8px 20px -4px rgba(0, 0, 0, 0.03)",
                p: 2.75,
                transition: "all 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
                "&:hover": {
                  boxShadow: "0 4px 14px rgba(0, 0, 0, 0.04), 0 12px 28px -4px rgba(0, 0, 0, 0.06)",
                  transform: "translateY(-1px)",
                },
              }}
            >
              {/* Card Header */}
              <Box sx={{ alignItems: "flex-start", display: "flex", justifyContent: "space-between", mb: 2 }}>
                <Box>
                  <Box
                    sx={{
                      bgcolor: "rgba(0, 0, 0, 0.04)",
                      borderRadius: "6px",
                      color: "#3A3A3C",
                      display: "inline-block",
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.72rem",
                      fontWeight: 600,
                      mb: 0.5,
                      px: 0.85,
                      py: 0.25,
                    }}
                  >
                    {subject.code}
                  </Box>
                  <Typography
                    sx={{
                      color: ergEnterpriseTokens.color.text,
                      fontSize: "1.15rem",
                      fontWeight: 600,
                      letterSpacing: "-0.015em",
                    }}
                  >
                    {subject.name}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    alignItems: "center",
                    bgcolor: alpha(ergEnterpriseTokens.color.success, 0.12),
                    border: `1px solid ${alpha(ergEnterpriseTokens.color.success, 0.22)}`,
                    borderRadius: "9999px",
                    color: "#15803D",
                    display: "inline-flex",
                    fontSize: "0.72rem",
                    fontWeight: 600,
                    gap: 0.65,
                    lineHeight: 1,
                    px: 1,
                    py: 0.4,
                  }}
                >
                  <Box sx={{ bgcolor: ergEnterpriseTokens.color.success, borderRadius: "50%", height: 6, width: 6 }} />
                  Đang triển khai
                </Box>
              </Box>

              {/* Statistics Inset Grid */}
              <Box
                sx={{
                  bgcolor: "rgba(0, 0, 0, 0.02)",
                  borderRadius: "12px",
                  display: "grid",
                  gap: 1.5,
                  gridTemplateColumns: "1fr 1fr",
                  my: 2,
                  p: 1.75,
                }}
              >
                <Box>
                  <Box sx={{ alignItems: "center", display: "flex", gap: 0.5, mb: 0.35 }}>
                    <GroupsRoundedIcon sx={{ color: ergEnterpriseTokens.color.textMuted, fontSize: 15 }} />
                    <Typography sx={{ color: ergEnterpriseTokens.color.textMuted, fontSize: "0.75rem", fontWeight: 600 }}>
                      Học sinh ghi danh
                    </Typography>
                  </Box>
                  <Typography sx={{ color: ergEnterpriseTokens.color.text, fontSize: "1.15rem", fontWeight: 600 }}>
                    {subject.studentCount}
                  </Typography>
                </Box>

                <Box>
                  <Box sx={{ alignItems: "center", display: "flex", gap: 0.5, mb: 0.35 }}>
                    <SchoolRoundedIcon sx={{ color: ergEnterpriseTokens.color.textMuted, fontSize: 15 }} />
                    <Typography sx={{ color: ergEnterpriseTokens.color.textMuted, fontSize: "0.75rem", fontWeight: 600 }}>
                      Giáo viên phụ trách
                    </Typography>
                  </Box>
                  <Typography sx={{ color: ergEnterpriseTokens.color.text, fontSize: "1.15rem", fontWeight: 600 }}>
                    {subject.teacherCount}
                  </Typography>
                </Box>
              </Box>

              {/* Progress Bar */}
              <Box sx={{ mb: 2 }}>
                <Box sx={{ alignItems: "center", display: "flex", justifyContent: "space-between", mb: 0.75 }}>
                  <Typography sx={{ color: ergEnterpriseTokens.color.textMuted, fontSize: "0.72rem", fontWeight: 600 }}>
                    Tỷ lệ phủ toàn trường
                  </Typography>
                  <Typography sx={{ color: ergEnterpriseTokens.color.text, fontSize: "0.72rem", fontWeight: 600 }}>
                    {percent}%
                  </Typography>
                </Box>
                <LinearProgress
                  value={percent}
                  variant="determinate"
                  sx={{
                    bgcolor: alpha(ergEnterpriseTokens.color.primary, 0.08),
                    borderRadius: 9999,
                    height: 6,
                    "& .MuiLinearProgress-bar": {
                      bgcolor: ergEnterpriseTokens.color.primary,
                      borderRadius: 9999,
                    },
                  }}
                />
              </Box>

              {/* Action Button */}
              <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                <Button variant="contained"
                  onClick={() =>
                    void navigate({
                      href: `${adminPath("/schools/subject-enrollments")}?schoolId=${selectedSchool.id}&subjectId=${subject.id}`,
                    })
                  }
                  startIcon={<GroupAddRoundedIcon sx={{ fontSize: 16 }} />}
                  size="small"
                  sx={{
                    bgcolor: alpha(ergEnterpriseTokens.color.primary, 0.08),
                    borderRadius: "8px",
                    color: ergEnterpriseTokens.color.primary,
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    letterSpacing: "-0.01em",
                    px: 1.5,
                    py: 0.6,
                    textTransform: "none",
                    transition: "all 0.15s ease",
                    "&:hover": {
                      bgcolor: alpha(ergEnterpriseTokens.color.primary, 0.14),
                    },
                    "&:active": {
                      transform: "scale(0.985)",
                    },
                  }}
                >
                  Quản lý ghi danh
                </Button>
              </Box>
            </Paper>
          );
        })}
      </Box>
    </SchoolPageShell>
  );
}
