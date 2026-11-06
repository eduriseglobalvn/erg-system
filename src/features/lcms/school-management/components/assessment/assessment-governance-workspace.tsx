import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CloudSyncRoundedIcon from "@mui/icons-material/CloudSyncRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import LockClockRoundedIcon from "@mui/icons-material/LockClockRounded";
import RuleFolderRoundedIcon from "@mui/icons-material/RuleFolderRounded";
import SecurityUpdateGoodRoundedIcon from "@mui/icons-material/SecurityUpdateGoodRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";
import { alpha } from "@mui/material/styles";

/**
 * Assessment governance is intentionally unavailable until the backend publishes
 * a scoped campaign/question-permission contract. This surface must not render
 * demo rows or mutate local state as if those changes were persisted.
 */
export function AssessmentGovernanceWorkspace() {
  return (
    <Box sx={{ display: "grid", gap: 2.5 }}>
      {/* Apple Translucent Info Banner */}
      <Box
        sx={{
          alignItems: "center",
          bgcolor: alpha(ergEnterpriseTokens.color.primary, 0.05),
          border: `1px solid ${alpha(ergEnterpriseTokens.color.primary, 0.16)}`,
          borderRadius: "14px",
          display: "flex",
          gap: 1.75,
          p: 2,
        }}
      >
        <Box
          sx={{
            alignItems: "center",
            bgcolor: alpha(ergEnterpriseTokens.color.primary, 0.12),
            borderRadius: "10px",
            color: ergEnterpriseTokens.color.primary,
            display: "flex",
            flexShrink: 0,
            height: 38,
            justifyContent: "center",
            width: 38,
          }}
        >
          <InfoOutlinedIcon sx={{ fontSize: 20 }} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ color: ergEnterpriseTokens.color.text, fontSize: "0.875rem", fontWeight: 600 }}>
            Chính sách phân quyền khảo thí & đề thi
          </Typography>
          <Typography sx={{ color: ergEnterpriseTokens.color.textMuted, fontSize: "0.8125rem", mt: 0.25, lineHeight: 1.45 }}>
            Dữ liệu đợt kiểm tra, quyền bổ sung câu hỏi và lịch sử nhập câu hỏi sẽ chỉ hiển thị sau khi backend cung
            cấp API có phân quyền và phạm vi trường/lớp.
          </Typography>
        </Box>
      </Box>

      {/* Main Governance Surface */}
      <Paper
        elevation={0}
        sx={{
          bgcolor: "#FFFFFF",
          border: `1px solid ${ergEnterpriseTokens.color.border}`,
          borderRadius: "16px",
          boxShadow: "0 2px 10px rgba(0, 0, 0, 0.03), 0 10px 24px -4px rgba(0, 0, 0, 0.05)",
          p: { md: 3, xs: 2.25 },
        }}
      >
        {/* Header Ribbon */}
        <Box
          sx={{
            alignItems: { md: "center", xs: "flex-start" },
            borderBottom: `1px solid ${ergEnterpriseTokens.color.border}`,
            display: "flex",
            flexDirection: { md: "row", xs: "column" },
            gap: 2,
            justifyContent: "space-between",
            pb: 2.5,
          }}
        >
          <Box>
            <Box sx={{ alignItems: "center", display: "inline-flex", gap: 1, mb: 0.5 }}>
              <Typography sx={{ color: ergEnterpriseTokens.color.text, fontSize: "1.125rem", fontWeight: 600, letterSpacing: "-0.01em" }}>
                Quản trị kiểm tra & câu hỏi tạm
              </Typography>
              <Box
                sx={{
                  alignItems: "center",
                  bgcolor: alpha(ergEnterpriseTokens.color.warning, 0.1),
                  border: `1px solid ${alpha(ergEnterpriseTokens.color.warning, 0.22)}`,
                  borderRadius: "9999px",
                  color: "#B45309",
                  display: "inline-flex",
                  fontSize: "0.72rem",
                  fontWeight: 600,
                  gap: 0.6,
                  px: 1,
                  py: 0.3,
                }}
              >
                <Box
                  component="span"
                  sx={{
                    bgcolor: ergEnterpriseTokens.color.warning,
                    borderRadius: "50%",
                    display: "inline-block",
                    height: 5,
                    width: 5,
                  }}
                />
                Sắp ra mắt
              </Box>
            </Box>
            <Typography sx={{ color: ergEnterpriseTokens.color.textMuted, fontSize: "0.85rem", lineHeight: 1.5, maxWidth: 760 }}>
              Đợt đánh giá, yêu cầu cấp quyền câu hỏi và nhập dữ liệu sẽ có ở bản cập nhật tới. Hệ thống không hiển thị số liệu mẫu để tránh nhầm với dữ liệu thật.
            </Typography>
          </Box>

          <Button
            disabled
            startIcon={<AddRoundedIcon />}
            title="Backend chưa cung cấp import job và question-permission mutation."
            variant="contained"
            sx={{
              borderRadius: "11px",
              boxShadow: "none",
              fontSize: "0.85rem",
              fontWeight: 600,
              px: 2.5,
              py: 1,
              textTransform: "none",
              "&.Mui-disabled": {
                bgcolor: "rgba(0, 0, 0, 0.06) !important",
                color: "rgba(0, 0, 0, 0.35) !important",
              },
            }}
          >
            Nhập câu hỏi từ file
          </Button>
        </Box>

        {/* Integration Specs Cards */}
        <Box sx={{ mt: 2.5 }}>
          <Typography
            variant="overline"
            sx={{
              color: ergEnterpriseTokens.color.textMuted,
              fontSize: "0.72rem",
              fontWeight: 600,
              letterSpacing: "0.08em",
            }}
          >
            Lộ trình tích hợp module khảo thí
          </Typography>

          <Box
            sx={{
              display: "grid",
              gap: 1.75,
              gridTemplateColumns: { md: "repeat(3, 1fr)", sm: "1fr" },
              mt: 1.25,
            }}
          >
            <RoadmapCard
              icon={<RuleFolderRoundedIcon sx={{ fontSize: 20 }} />}
              iconBg={alpha(ergEnterpriseTokens.color.primary, 0.08)}
              iconColor={ergEnterpriseTokens.color.primary}
              title="Campaign Scope API"
              description="Cần các endpoint đọc/ghi campaign, khung giờ làm bài và phạm vi áp dụng cho từng phân hiệu trường học."
            />
            <RoadmapCard
              icon={<SecurityUpdateGoodRoundedIcon sx={{ fontSize: 20 }} />}
              iconBg={alpha(ergEnterpriseTokens.color.success, 0.1)}
              iconColor={ergEnterpriseTokens.color.success}
              title="Phê duyệt quyền câu hỏi"
              description="Quy trình phân quyền và phê duyệt câu hỏi bổ sung theo từng môn học, khối lớp và phân công chuyên môn."
            />
            <RoadmapCard
              icon={<LockClockRoundedIcon sx={{ fontSize: 20 }} />}
              iconBg="rgba(175, 82, 222, 0.1)"
              iconColor="#AF52DE"
              title="Audit & Dọn dẹp dữ liệu"
              description="Chính sách dọn dữ liệu tạm thời, lưu vết kiểm toán truy cập và đồng bộ an toàn qua query/mutation có scope."
            />
          </Box>
        </Box>

        {/* Notice Footer */}
        <Box
          sx={{
            alignItems: "center",
            bgcolor: "#FBFBFD",
            border: "1px dashed rgba(0, 0, 0, 0.12)",
            borderRadius: "12px",
            display: "flex",
            gap: 1.5,
            mt: 2.5,
            p: 1.75,
          }}
        >
          <CloudSyncRoundedIcon sx={{ color: ergEnterpriseTokens.color.textMuted, fontSize: 20 }} />
          <Typography sx={{ color: ergEnterpriseTokens.color.textMuted, fontSize: "0.8125rem", lineHeight: 1.45 }}>
            Khu vực này sẽ tự hiển thị dữ liệu khi tính năng được bật.
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}

function RoadmapCard({
  description,
  icon,
  iconBg,
  iconColor,
  title,
}: {
  description: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  title: string;
}) {
  return (
    <Box
      sx={{
        bgcolor: "#FBFBFD",
        border: `1px solid ${ergEnterpriseTokens.color.border}`,
        borderRadius: "14px",
        display: "flex",
        flexDirection: "column",
        gap: 1,
        p: 2,
        transition: "all 0.15s ease",
        "&:hover": {
          bgcolor: "#FFFFFF",
          borderColor: "rgba(0, 0, 0, 0.14)",
          boxShadow: "0 4px 14px rgba(0, 0, 0, 0.04)",
        },
      }}
    >
      <Box sx={{ alignItems: "center", display: "flex", gap: 1.25 }}>
        <Box
          sx={{
            alignItems: "center",
            bgcolor: iconBg,
            borderRadius: "8px",
            color: iconColor,
            display: "flex",
            height: 32,
            justifyContent: "center",
            width: 32,
          }}
        >
          {icon}
        </Box>
        <Typography sx={{ color: ergEnterpriseTokens.color.text, fontSize: "0.875rem", fontWeight: 600 }}>
          {title}
        </Typography>
      </Box>
      <Typography sx={{ color: ergEnterpriseTokens.color.textMuted, fontSize: "0.8rem", lineHeight: 1.45 }}>
        {description}
      </Typography>
      <Box sx={{ mt: "auto", pt: 0.5 }}>
        <Box
          sx={{
            alignItems: "center",
            bgcolor: "rgba(0, 0, 0, 0.04)",
            borderRadius: "6px",
            color: ergEnterpriseTokens.color.textMuted,
            display: "inline-flex",
            fontSize: "0.72rem",
            fontWeight: 600,
            px: 0.85,
            py: 0.25,
          }}
        >
          Sắp ra mắt
        </Box>
      </Box>
    </Box>
  );
}
