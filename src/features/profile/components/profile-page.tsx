import ArrowLeft from "@mui/icons-material/ArrowBackRounded";
import BadgeCheck from "@mui/icons-material/VerifiedRounded";
import Building2 from "@mui/icons-material/BusinessRounded";
import Camera from "@mui/icons-material/PhotoCameraRounded";
import CheckCircle2 from "@mui/icons-material/CheckCircleRounded";
import KeyRound from "@mui/icons-material/KeyRounded";
import Phone from "@mui/icons-material/PhoneRounded";
import Save from "@mui/icons-material/SaveRounded";
import ShieldCheck from "@mui/icons-material/SecurityRounded";
import UserRound from "@mui/icons-material/PersonRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import LinearProgress from "@mui/material/LinearProgress";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import { Link, useLocation } from "@tanstack/react-router";
import { AvatarCropDialog } from "@/features/profile/components/avatar-crop-dialog";
import { ProfileFormPanel, SecurityPanel } from "@/features/profile/components/profile-panels";
import { ProfileLine, ProfileTabButton } from "@/features/profile/components/profile-primitives";
import { useProfilePageController } from "@/features/profile/hooks/use-profile-page-controller";
import { adminPath, studentPath, teacherPath } from "@/platform/workspaces/workspace-paths";

export function ProfilePage() {
  const location = useLocation();
  const workspaceHomePath = location.pathname.startsWith("/admin")
    ? adminPath("/")
    : location.pathname.startsWith("/student")
      ? studentPath("/")
      : location.pathname.startsWith("/teacher")
        ? teacherPath("/")
        : "/";
  const {
    account,
    activeTab,
    avatarCrop,
    avatarInputRef,
    avatarUrl,
    canChangePassword,
    changePassword,
    closeAvatarCropper,
    completionPercent,
    form,
    initials,
    isLoading,
    isSavingPassword,
    isSavingProfile,
    isUploadingAvatar,
    openAvatarCropper,
    passwordForm,
    passwordScore,
    profileNotice,
    saveProfile,
    securityNotice,
    setActiveTab,
    setAvatarCrop,
    setShowPasswords,
    showPasswords,
    update,
    updatePasswordField,
    uploadCroppedAvatar,
  } = useProfilePageController();

  const primaryAction = activeTab === "security" ? changePassword : saveProfile;
  const primaryDisabled = activeTab === "security" ? !canChangePassword || isSavingPassword : !account || isSavingProfile;

  return (
    <Box component="main" sx={{ bgcolor: "#F5F5F7", color: "#1D1D1F", minHeight: "100vh", p: { xs: 2.5, md: 4 } }}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3, marginInline: "auto", maxWidth: "80rem", width: "100%" }}>
        {/* Apple Translucent Window Header */}
        <Paper
          elevation={0}
          sx={{
            backdropFilter: "blur(20px)",
            bgcolor: "rgba(255, 255, 255, 0.88)",
            border: "1px solid rgba(0, 0, 0, 0.06)",
            borderRadius: "16px",
            boxShadow: "0 2px 10px rgba(0, 0, 0, 0.02), 0 8px 24px -4px rgba(0, 0, 0, 0.04)",
            overflow: "hidden",
            p: { xs: 2, md: 2.5 },
          }}
        >
          <Box
            sx={{
              alignItems: { xs: "flex-start", md: "center" },
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              gap: 2,
              justifyContent: "space-between",
            }}
          >
            <Box sx={{ alignItems: "center", display: "flex", gap: 1.5 }}>
              <Button
                component={Link}
                startIcon={<ArrowLeft sx={{ fontSize: 16 }} />}
                to={workspaceHomePath}
                variant="outlined"
                sx={{
                  bgcolor: "#FFFFFF",
                  borderColor: "rgba(0, 0, 0, 0.12)",
                  borderRadius: "10px",
                  color: "#1D1D1F",
                  fontSize: "0.825rem",
                  fontWeight: 650,
                  height: 38,
                  px: 1.75,
                  textTransform: "none",
                  "&:hover": { bgcolor: "rgba(0, 0, 0, 0.03)", borderColor: "rgba(0, 0, 0, 0.22)" },
                }}
              >
                Quay lại LMS
              </Button>
              <Box sx={{ bgcolor: "rgba(0, 0, 0, 0.06)", display: { xs: "none", sm: "block" }, height: 28, width: "1px" }} />
              <Box>
                <Typography sx={{ color: "#86868B", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                  ERG Account
                </Typography>
                <Typography sx={{ color: "#1D1D1F", fontSize: "1.2rem", fontWeight: 800, letterSpacing: "-0.02em" }}>
                  Hồ sơ và bảo mật
                </Typography>
              </Box>
            </Box>

            <Button
              disabled={primaryDisabled}
              onClick={() => void primaryAction()}
              startIcon={
                activeTab === "security" ? (
                  isSavingPassword ? <CircularProgress color="inherit" size={16} /> : <KeyRound sx={{ fontSize: 16 }} />
                ) : isSavingProfile ? (
                  <CircularProgress color="inherit" size={16} />
                ) : (
                  <Save sx={{ fontSize: 16 }} />
                )
              }
              variant="contained"
              sx={{
                bgcolor: "#0071E3",
                borderRadius: "10px",
                boxShadow: "0 2px 8px rgba(0, 113, 227, 0.28)",
                color: "#FFFFFF",
                fontSize: "0.85rem",
                fontWeight: 650,
                height: 38,
                px: 2.25,
                textTransform: "none",
                transition: "all 0.15s ease",
                "&:hover": {
                  bgcolor: "#0077ED",
                  boxShadow: "0 4px 14px rgba(0, 113, 227, 0.38)",
                },
              }}
            >
              {activeTab === "security" ? "Đổi mật khẩu" : "Lưu hồ sơ"}
            </Button>
          </Box>
        </Paper>

        {isLoading ? (
          <Box sx={{ bgcolor: "rgba(0, 113, 227, 0.05)", borderRadius: "12px", display: "grid", gap: 1, p: 2 }}>
            <Skeleton height={20} sx={{ borderRadius: "6px" }} variant="rounded" width="50%" />
            <Skeleton height={16} sx={{ borderRadius: "6px" }} variant="rounded" width="30%" />
          </Box>
        ) : null}

        <Box sx={{ display: "grid", gap: 3, gridTemplateColumns: { lg: "340px minmax(0, 1fr)" } }}>
          {/* Apple ID Profile Hero Sidebar */}
          <Box component="aside" sx={{ height: "fit-content", position: { lg: "sticky" }, top: { lg: 32 } }}>
            <Paper
              elevation={0}
              sx={{
                bgcolor: "#FFFFFF",
                border: "1px solid rgba(0, 0, 0, 0.06)",
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
                  border: "1px solid rgba(0, 0, 0, 0.04)",
                  p: 2.5,
                  textAlign: "center",
                }}
              >
                <Box sx={{ display: "inline-block", position: "relative" }}>
                  <Box
                    sx={{
                      bgcolor: "rgba(0, 113, 227, 0.08)",
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
                      <Box sx={{ alignItems: "center", color: "#0071E3", display: "flex", fontSize: "1.4rem", fontWeight: 800, height: "100%", justifyContent: "center", width: "100%" }}>
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
                      border: "2px solid rgba(0, 0, 0, 0.06)",
                      borderRadius: "50%",
                      bottom: -2,
                      boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)",
                      color: "#0071E3",
                      cursor: "pointer",
                      display: "flex",
                      height: 28,
                      justifyContent: "center",
                      position: "absolute",
                      right: -2,
                      transition: "all 0.15s ease",
                      width: 28,
                      "&:hover": { bgcolor: "rgba(0, 113, 227, 0.08)", transform: "scale(1.1)" },
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

                <Typography sx={{ color: "#1D1D1F", fontSize: "1.1rem", fontWeight: 800, letterSpacing: "-0.015em", mt: 1.5 }}>
                  {form.fullName || account?.email || "Tài khoản ERG"}
                </Typography>
                <Typography noWrap sx={{ color: "#86868B", fontSize: "0.8rem", mt: 0.25 }}>
                  {account?.email}
                </Typography>

                <Box
                  sx={{
                    alignItems: "center",
                    bgcolor: "rgba(52, 199, 89, 0.12)",
                    border: "1px solid rgba(52, 199, 89, 0.22)",
                    borderRadius: "9999px",
                    color: "#15803D",
                    display: "inline-flex",
                    fontSize: "0.72rem",
                    fontWeight: 700,
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
                <Box sx={{ bgcolor: "#FFFFFF", borderRadius: "10px", border: "1px solid rgba(0, 0, 0, 0.04)", mt: 2, p: 1.5 }}>
                  <Box sx={{ alignItems: "center", display: "flex", justifyContent: "space-between", mb: 0.75 }}>
                    <Typography sx={{ color: "#86868B", fontSize: "0.72rem", fontWeight: 600 }}>
                      Hoàn thiện hồ sơ
                    </Typography>
                    <Typography sx={{ color: "#0071E3", fontSize: "0.72rem", fontWeight: 750 }}>
                      {completionPercent}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    value={completionPercent}
                    variant="determinate"
                    sx={{
                      bgcolor: "rgba(0, 113, 227, 0.08)",
                      borderRadius: 9999,
                      height: 5,
                      "& .MuiLinearProgress-bar": {
                        bgcolor: "#0071E3",
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
                <ProfileLine icon={<BadgeCheck sx={{ fontSize: 16 }} />} label="Vai trò" value={form.title || "Chưa cập nhật"} />
                <ProfileLine icon={<Building2 sx={{ fontSize: 16 }} />} label="Bộ phận" value={form.department || "Chưa cập nhật"} />
                <ProfileLine icon={<Phone sx={{ fontSize: 16 }} />} label="Điện thoại" value={form.phone || "Chưa cập nhật"} />
              </Box>
            </Paper>
          </Box>

          {/* Main Content Panel */}
          <Box component="section" sx={{ minWidth: 0 }}>
            {activeTab === "profile" ? (
              <ProfileFormPanel
                account={account}
                form={form}
                isSaving={isSavingProfile}
                notice={profileNotice}
                onSave={saveProfile}
                onUpdate={update}
              />
            ) : (
              <SecurityPanel
                account={account}
                canChangePassword={canChangePassword}
                form={passwordForm}
                isSaving={isSavingPassword}
                notice={securityNotice}
                onChangePassword={changePassword}
                onTogglePasswords={() => setShowPasswords((value) => !value)}
                onUpdate={updatePasswordField}
                passwordScore={passwordScore}
                showPasswords={showPasswords}
              />
            )}
          </Box>
        </Box>
      </Box>

      <AvatarCropDialog
        crop={avatarCrop}
        isUploading={isUploadingAvatar}
        onChange={setAvatarCrop}
        onClose={closeAvatarCropper}
        onPickAnother={() => avatarInputRef.current?.click()}
        onUpload={uploadCroppedAvatar}
      />
    </Box>
  );
}
