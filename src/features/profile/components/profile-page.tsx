import ArrowLeft from "@mui/icons-material/ArrowBackRounded";
import KeyRound from "@mui/icons-material/KeyRounded";
import Save from "@mui/icons-material/SaveRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import { Link, useLocation } from "@tanstack/react-router";
import { AvatarCropDialog } from "@/features/profile/components/avatar-crop-dialog";
import { ProfileFormPanel, SecurityPanel } from "@/features/profile/components/profile-panels";
import { ProfileSidebar } from "@/features/profile/components/profile-sidebar";
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
  const controller = useProfilePageController();
  const {
    account,
    activeTab,
    avatarCrop,
    avatarInputRef,
    canChangePassword,
    changePassword,
    closeAvatarCropper,
    form,
    isLoading,
    isSavingPassword,
    isSavingProfile,
    isUploadingAvatar,
    passwordForm,
    passwordScore,
    profileNotice,
    saveProfile,
    securityNotice,
    setAvatarCrop,
    setShowPasswords,
    showPasswords,
    update,
    updatePasswordField,
    uploadCroppedAvatar,
  } = controller;

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
          <ProfileSidebar {...controller} />

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
