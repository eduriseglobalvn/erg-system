import BadgeCheck from "@mui/icons-material/VerifiedRounded";
import Building2 from "@mui/icons-material/BusinessRounded";
import Camera from "@mui/icons-material/PhotoCameraRounded";
import CheckCircle2 from "@mui/icons-material/CheckCircleRounded";
import Phone from "@mui/icons-material/PhoneRounded";
import ShieldCheck from "@mui/icons-material/SecurityRounded";
import UserRound from "@mui/icons-material/PersonRounded";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import LinearProgress from "@mui/material/LinearProgress";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { ProfileLine, ProfileTabButton } from "@/features/profile/components/profile-primitives";
import type { useProfilePageController } from "@/features/profile/hooks/use-profile-page-controller";
import { alpha } from "@mui/material/styles";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

export function ProfileSidebar({
  account,
  activeTab,
  avatarInputRef,
  avatarUrl,
  completionPercent,
  form,
  initials,
  isUploadingAvatar,
  openAvatarCropper,
  setActiveTab,
  showWorkRoleFields,
}: ReturnType<typeof useProfilePageController>) {
  return (
      <Box component="aside" sx={{ height: "fit-content", position: { lg: "sticky" }, top: { lg: 32 } }}>
        <Paper
          elevation={0}
          sx={{
            bgcolor: "#FFFFFF",
            border: `1px solid ${ergEnterpriseTokens.color.border}`,
            borderRadius: "16px",
            boxShadow: "0 2px 10px rgba(0, 0, 0, 0.02), 0 8px 24px -4px rgba(0, 0, 0, 0.04)",
            p: 2.5,
          }}
        >
          {/* Avatar & Hero Identity */}
          <Box
            sx={{
              bgcolor: "rgba(0, 0, 0, 0.02)",
              borderRadius: "14px",
              border: `1px solid ${ergEnterpriseTokens.color.border}`,
              p: 2.5,
              textAlign: "center",
            }}
          >
            <Box sx={{ display: "inline-block", position: "relative" }}>
              <Box
                sx={{
                  bgcolor: alpha(ergEnterpriseTokens.color.primary, 0.08),
                  border: "3px solid #FFFFFF",
                  borderRadius: "50%",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
                  height: 76,
                  overflow: "hidden",
                  width: 76,
                }}
              >
                {avatarUrl ? (
                  <Box component="img" alt={form.fullName || "Avatar"} src={avatarUrl} sx={{ height: "100%", objectFit: "cover", width: "100%" }} />
                ) : (
                  <Box sx={{ alignItems: "center", color: "primary.main", display: "flex", fontSize: "1.4rem", fontWeight: 600, height: "100%", justifyContent: "center", width: "100%" }}>
                    {initials}
                  </Box>
                )}
              </Box>
  
              <Box
                component="button"
                aria-label="Upload avatar"
                disabled={!account || isUploadingAvatar}
                onClick={() => avatarInputRef.current?.click()}
                type="button"
                sx={{
                  alignItems: "center",
                  bgcolor: "#FFFFFF",
                  border: `2px solid ${ergEnterpriseTokens.color.border}`,
                  borderRadius: "50%",
                  bottom: -2,
                  boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)",
                  color: "primary.main",
                  cursor: "pointer",
                  display: "flex",
                  height: 28,
                  justifyContent: "center",
                  position: "absolute",
                  right: -2,
                  transition: "all 0.15s ease",
                  width: 28,
                  "&:hover": { bgcolor: alpha(ergEnterpriseTokens.color.primary, 0.08), transform: "scale(1.1)" },
                }}
              >
                {isUploadingAvatar ? <CircularProgress color="inherit" size={14} /> : <Camera sx={{ fontSize: 15 }} />}
              </Box>
  
              <Box
                component="input"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  event.target.value = "";
                  openAvatarCropper(file);
                }}
                ref={avatarInputRef}
                sx={{ clip: "rect(0 0 0 0)", clipPath: "inset(50%)", height: "1px", overflow: "hidden", position: "absolute", whiteSpace: "nowrap", width: "1px" }}
                type="file"
              />
            </Box>
  
            <Typography sx={{ color: "text.primary", fontSize: "1.1rem", fontWeight: 600, letterSpacing: "-0.015em", mt: 1.5 }}>
              {form.fullName || account?.email || "Tài khoản ERG"}
            </Typography>
            <Typography noWrap sx={{ color: "text.disabled", fontSize: "0.8rem", mt: 0.25 }}>
              {account?.email}
            </Typography>
  
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
                gap: 0.5,
                mt: 1.25,
                px: 1.25,
                py: 0.4,
              }}
            >
              <CheckCircle2 sx={{ fontSize: 13 }} />
              {account?.status === "ACTIVE" ? "Đang hoạt động" : account?.status || "Chưa rõ"}
            </Box>
  
            {/* Profile Completion Bar */}
            <Box sx={{ bgcolor: "#FFFFFF", borderRadius: `${ergEnterpriseTokens.radius.md}px`, border: `1px solid ${ergEnterpriseTokens.color.border}`, mt: 2, p: 1.5 }}>
              <Box sx={{ alignItems: "center", display: "flex", justifyContent: "space-between", mb: 0.75 }}>
                <Typography sx={{ color: "text.disabled", fontSize: "0.72rem", fontWeight: 600 }}>
                  Hoàn thiện hồ sơ
                </Typography>
                <Typography sx={{ color: "primary.main", fontSize: "0.72rem", fontWeight: 600 }}>
                  {completionPercent}%
                </Typography>
              </Box>
              <LinearProgress
                value={completionPercent}
                variant="determinate"
                sx={{
                  bgcolor: alpha(ergEnterpriseTokens.color.primary, 0.08),
                  borderRadius: 9999,
                  height: 5,
                  "& .MuiLinearProgress-bar": {
                    bgcolor: "primary.main",
                    borderRadius: 9999,
                  },
                }}
              />
            </Box>
          </Box>
  
          {/* Navigation Tabs */}
          <Box sx={{ display: "grid", gap: 1, mt: 2 }} aria-label="Cài đặt tài khoản">
            <ProfileTabButton
              active={activeTab === "profile"}
              description="Tên, số điện thoại, avatar"
              icon={<UserRound sx={{ fontSize: 18 }} />}
              onClick={() => setActiveTab("profile")}
              title="Thông tin hồ sơ"
            />
            <ProfileTabButton
              active={activeTab === "security"}
              description="Đổi mật khẩu tài khoản"
              icon={<ShieldCheck sx={{ fontSize: 18 }} />}
              onClick={() => setActiveTab("security")}
              title="Bảo mật"
            />
          </Box>
  
          {/* Quick Info Lines */}
          <Box sx={{ display: "grid", gap: 1, mt: 2 }}>
            {showWorkRoleFields ? (
              <>
                <ProfileLine icon={<BadgeCheck sx={{ fontSize: 16 }} />} label="Vai trò" value={form.title || "Chưa cập nhật"} />
                <ProfileLine icon={<Building2 sx={{ fontSize: 16 }} />} label="Bộ phận" value={form.department || "Chưa cập nhật"} />
              </>
            ) : null}
            <ProfileLine icon={<Phone sx={{ fontSize: 16 }} />} label="Điện thoại" value={form.phone || "Chưa cập nhật"} />
          </Box>
        </Paper>
      </Box>
  );
}
