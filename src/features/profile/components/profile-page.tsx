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
import Skeleton from "@mui/material/Skeleton";
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
    account, activeTab, avatarCrop, avatarInputRef, avatarUrl, canChangePassword, changePassword, closeAvatarCropper,
    completionPercent, form, initials, isLoading, isSavingPassword, isSavingProfile, isUploadingAvatar,
    openAvatarCropper, passwordForm, passwordScore, profileNotice, saveProfile, securityNotice, setActiveTab,
    setAvatarCrop, setShowPasswords, showPasswords, update, updatePasswordField, uploadCroppedAvatar,
  } = useProfilePageController();

  const primaryAction = activeTab === "security" ? changePassword : saveProfile;
  const primaryDisabled = activeTab === "security" ? !canChangePassword || isSavingPassword : !account || isSavingProfile;

  return (
    <Box component="main" sx={{"minHeight":"100vh","backgroundColor":"#f7f8fa","paddingInline":"calc(0.25rem * 4)","paddingBlock":"calc(0.25rem * 5)","color":"oklch(12.9% 0.042 264.695)","@media (min-width: 64rem)":{"paddingInline":"calc(0.25rem * 8)"}}}>
      <Box component="div" sx={{"marginInline":"auto","display":"flex","width":"100%","maxWidth":"80rem","flexDirection":"column","gap":"calc(0.25rem * 5)"}}>
        <Box component="header" sx={{"overflow":"hidden","borderRadius":"0.5rem","borderStyle":"solid","borderWidth":"1px","borderColor":"oklch(92.9% 0.013 255.508)","backgroundColor":"#fff","boxShadow":"0 0 #0000, 0 0 #0000, 0 0 #0000, 0 0 #0000, 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)"}}><Box component="div" sx={{"height":"calc(0.25rem * 1.5)","backgroundColor":"var(--erg-blue)"}} /><Box component="div" sx={{"display":"flex","flexDirection":"column","gap":"calc(0.25rem * 4)","paddingInline":"calc(0.25rem * 5)","paddingBlock":"calc(0.25rem * 4)","@media (min-width: 64rem)":{"flexDirection":"row","alignItems":"center","justifyContent":"space-between"}}}>
          <Box component="div" sx={{"display":"flex","alignItems":"center","gap":"calc(0.25rem * 3)"}}>
            <Button component={Link} to={workspaceHomePath} variant="outlined" startIcon={<ArrowLeft sx={{ fontSize: 16 }} />} sx={{"height":"calc(0.25rem * 10)","borderRadius":"0.5rem","backgroundColor":"#fff"}}>
              Quay lại LMS
            </Button>
            <Box component="div" sx={{"display":"none","height":"calc(0.25rem * 10)","width":"1px","backgroundColor":"oklch(92.9% 0.013 255.508)","@media (min-width: 40rem)":{"display":"block"}}} />
            <div>
              <Box component="p" sx={{"fontSize":"0.75rem","lineHeight":"calc(1 / 0.75)","fontWeight":"600","color":"var(--erg-red)"}}>ERG account</Box>
              <Box component="h1" sx={{"fontSize":"1.125rem","lineHeight":"calc(1.75 / 1.125)","fontWeight":"600","color":"oklch(12.9% 0.042 264.695)"}}>Hồ sơ và bảo mật</Box>
            </div>
          </Box>
          <Button
            variant="contained"
            onClick={() => void primaryAction()}
            disabled={primaryDisabled}
            startIcon={
              activeTab === "security" ? (
                isSavingPassword ? <CircularProgress color="inherit" size={16} /> : <KeyRound sx={{ fontSize: 16 }} />
              ) : isSavingProfile ? (
                <CircularProgress color="inherit" size={16} />
              ) : (
                <Save sx={{ fontSize: 16 }} />
              )
            }
            sx={{"height":"calc(0.25rem * 10)","borderRadius":"0.375rem","backgroundColor":"var(--erg-blue)","paddingInline":"calc(0.25rem * 4)","color":"#fff","boxShadow":"0 0 #0000, 0 0 #0000, 0 0 #0000, 0 0 #0000, 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)","&:hover":{"@media (hover: hover)":{"backgroundColor":"var(--erg-blue-hover)"}}}}
          >
            {activeTab === "security" ? "Đổi mật khẩu" : "Lưu hồ sơ"}
          </Button>
          </Box>
        </Box>

        {isLoading ? (
          <Box component="div" sx={{"display":"grid","gap":"calc(0.25rem * 2)","borderRadius":"0.5rem","borderStyle":"solid","borderWidth":"1px","borderColor":"#b8d6fa","backgroundColor":"var(--erg-blue-light)","paddingInline":"calc(0.25rem * 5)","paddingBlock":"calc(0.25rem * 3)"}} aria-hidden="true">
            <Skeleton variant="rounded" sx={{"height":"calc(0.25rem * 4)","width":"calc(0.25rem * 64)"}} />
            <Skeleton variant="rounded" sx={{"height":"calc(0.25rem * 3)","width":"calc(0.25rem * 40)"}} />
          </Box>
        ) : null}

        <Box sx={{ display: "grid", gap: 2.5, gridTemplateColumns: { lg: "340px minmax(0,1fr)" } }}>
          <Box component="aside" sx={{"height":"fit-content","borderRadius":"0.5rem","borderStyle":"solid","borderWidth":"1px","borderColor":"#e0e4ea","backgroundColor":"#fff","padding":"calc(0.25rem * 4)","boxShadow":"0 0 #0000, 0 0 #0000, 0 0 #0000, 0 0 #0000, 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)","@media (min-width: 64rem)":{"position":"sticky","top":"calc(0.25rem * 5)"}}}>
            <Box component="div" sx={{"borderRadius":"0.5rem","borderStyle":"solid","borderWidth":"1px","borderColor":"oklch(92.9% 0.013 255.508)","backgroundColor":"oklch(98.4% 0.003 247.858)","padding":"calc(0.25rem * 5)"}}>
              <Box component="div" sx={{"display":"flex","alignItems":"flex-start","gap":"calc(0.25rem * 4)"}}>
                <Box component="div" sx={{"position":"relative","flexShrink":"0"}}>
                  <Box component="div" sx={{"width":"calc(0.25rem * 20)","height":"calc(0.25rem * 20)","overflow":"hidden","borderRadius":"0.5rem","borderStyle":"solid","borderWidth":"4px","borderColor":"#fff","backgroundColor":"var(--erg-blue-light)","boxShadow":"0 0 #0000, 0 0 #0000, 0 0 #0000, 0 0 #0000, 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)"}}>
                    {avatarUrl ? (
                      <Box component="img" src={avatarUrl} alt={form.fullName || "Avatar"} sx={{"height":"100%","width":"100%","objectFit":"cover"}} />
                    ) : (
                      <Box component="div" sx={{"display":"grid","height":"100%","width":"100%","placeItems":"center","fontSize":"1.125rem","lineHeight":"calc(1.75 / 1.125)","fontWeight":"600","color":"var(--erg-blue)"}}>{initials}</Box>
                    )}
                  </Box>
                  <Box component="button"
                    aria-label="Upload avatar"
                    sx={{"position":"absolute","bottom":"calc(0.25rem * -2)","right":"calc(0.25rem * -2)","display":"grid","width":"calc(0.25rem * 10)","height":"calc(0.25rem * 10)","placeItems":"center","borderRadius":"0.5rem","borderStyle":"solid","borderWidth":"4px","borderColor":"oklch(98.4% 0.003 247.858)","backgroundColor":"#fff","color":"var(--erg-blue)","boxShadow":"0 0 #0000, 0 0 #0000, 0 0 #0000, 0 0 #0000, 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)","transitionProperty":"color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, translate, scale, rotate, filter, -webkit-backdrop-filter, backdrop-filter, display, content-visibility, overlay, pointer-events","transitionTimingFunction":"cubic-bezier(0.4, 0, 0.2, 1)","transitionDuration":"150ms","&:hover":{"@media (hover: hover)":{"backgroundColor":"var(--erg-blue-light)"}},"&:disabled":{"cursor":"not-allowed","opacity":"70%"}}}
                    type="button"
                    disabled={!account || isUploadingAvatar}
                    onClick={() => avatarInputRef.current?.click()}
                  >
                    {isUploadingAvatar ? <CircularProgress color="inherit" size={16} /> : <Camera sx={{ fontSize: 16 }} />}
                  </Box>
                  <Box component="input"
                    ref={avatarInputRef}
                    sx={{"position":"absolute","width":"1px","height":"1px","padding":"0","margin":"-1px","overflow":"hidden","clipPath":"inset(50%)","whiteSpace":"nowrap","borderWidth":"0"}}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null;
                      event.target.value = "";
                      openAvatarCropper(file);
                    }}
                  />
                </Box>
                <Box component="div" sx={{"minWidth":"calc(0.25rem * 0)","paddingTop":"calc(0.25rem * 1)"}}>
                  <Box component="h2" sx={{"overflow":"hidden","textOverflow":"ellipsis","whiteSpace":"nowrap","fontSize":"1.125rem","lineHeight":"calc(1.75 / 1.125)","fontWeight":"600","color":"oklch(12.9% 0.042 264.695)"}}>{form.fullName || account?.email || "Tài khoản ERG"}</Box>
                  <Box component="p" sx={{"marginTop":"calc(0.25rem * 1)","overflow":"hidden","textOverflow":"ellipsis","whiteSpace":"nowrap","fontSize":"0.875rem","lineHeight":"calc(1.25 / 0.875)","fontWeight":"500","color":"oklch(55.4% 0.046 257.417)"}}>{account?.email}</Box>
                  <Box component="span" sx={{"marginTop":"calc(0.25rem * 3)","display":"inline-flex","alignItems":"center","gap":"calc(0.25rem * 1.5)","borderRadius":"9999px","borderStyle":"solid","borderWidth":"1px","borderColor":"oklch(90.5% 0.093 164.15)","backgroundColor":"oklch(97.9% 0.021 166.113)","paddingInline":"calc(0.25rem * 3)","paddingBlock":"calc(0.25rem * 1)","fontSize":"0.75rem","lineHeight":"calc(1 / 0.75)","fontWeight":"500","color":"oklch(50.8% 0.118 165.612)"}}>
                    <CheckCircle2 sx={{ fontSize: 14 }} />
                    {account?.status === "ACTIVE" ? "Đang hoạt động" : account?.status || "Chưa rõ"}
                  </Box>
                </Box>
              </Box>

              <Box component="div" sx={{"marginTop":"calc(0.25rem * 5)","borderRadius":"0.5rem","backgroundColor":"#fff","padding":"calc(0.25rem * 3)"}}>
                <Box component="div" sx={{"display":"flex","alignItems":"center","justifyContent":"space-between","fontSize":"0.75rem","lineHeight":"calc(1 / 0.75)","fontWeight":"500","color":"oklch(55.4% 0.046 257.417)"}}>
                  <span>Hoàn thiện hồ sơ</span>
                  <span>{completionPercent}%</span>
                </Box>
                <Box component="div" sx={{"marginTop":"calc(0.25rem * 2)","height":"calc(0.25rem * 2)","overflow":"hidden","borderRadius":"9999px","backgroundColor":"oklch(96.8% 0.007 247.896)"}}>
                  <Box component="div" sx={{"height":"100%","borderRadius":"9999px","backgroundColor":"var(--erg-blue)","transitionProperty":"color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, translate, scale, rotate, filter, -webkit-backdrop-filter, backdrop-filter, display, content-visibility, overlay, pointer-events","transitionTimingFunction":"cubic-bezier(0.4, 0, 0.2, 1)","transitionDuration":"150ms"}} style={{ width: `${completionPercent}%` }} />
                </Box>
              </Box>
            </Box>

            <Box component="nav" sx={{"marginTop":"calc(0.25rem * 4)","display":"grid","gap":"calc(0.25rem * 2)"}} aria-label="Cài đặt tài khoản">
              <ProfileTabButton active={activeTab === "profile"} icon={<UserRound sx={{ fontSize: 16 }} />} onClick={() => setActiveTab("profile")} title="Thông tin hồ sơ" description="Tên, SĐT, avatar" />
              <ProfileTabButton active={activeTab === "security"} icon={<ShieldCheck sx={{ fontSize: 16 }} />} onClick={() => setActiveTab("security")} title="Bảo mật" description="Đổi mật khẩu" />
            </Box>

            <Box component="div" sx={{"marginTop":"calc(0.25rem * 4)","display":"grid","gap":"calc(0.25rem * 2)","borderRadius":"0.5rem","borderStyle":"solid","borderWidth":"1px","borderColor":"oklch(92.9% 0.013 255.508)","backgroundColor":"#fff","padding":"calc(0.25rem * 3)","fontSize":"0.875rem","lineHeight":"calc(1.25 / 0.875)"}}>
              <ProfileLine icon={<BadgeCheck sx={{ fontSize: 16 }} />} label="Vai trò" value={form.title || "Chưa cập nhật"} />
              <ProfileLine icon={<Building2 sx={{ fontSize: 16 }} />} label="Bộ phận" value={form.department || "Chưa cập nhật"} />
              <ProfileLine icon={<Phone sx={{ fontSize: 16 }} />} label="Điện thoại" value={form.phone || "Chưa cập nhật"} />
            </Box>
          </Box>

          <Box component="section" sx={{"minWidth":"calc(0.25rem * 0)"}}>
            {activeTab === "profile" ? (
              <ProfileFormPanel form={form} notice={profileNotice} onSave={saveProfile} onUpdate={update} isSaving={isSavingProfile} account={account} />
            ) : (
              <SecurityPanel
                account={account}
                canChangePassword={canChangePassword}
                form={passwordForm}
                isSaving={isSavingPassword}
                notice={securityNotice}
                passwordScore={passwordScore}
                showPasswords={showPasswords}
                onChangePassword={changePassword}
                onTogglePasswords={() => setShowPasswords((value) => !value)}
                onUpdate={updatePasswordField}
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
