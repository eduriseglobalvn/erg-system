import Box from "@mui/material/Box";
import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode, type SyntheticEvent } from "react";
import { Link, useLocation } from "@/routes/router-compat";
import ArrowLeft from "@mui/icons-material/ArrowBackRounded";
import BadgeCheck from "@mui/icons-material/VerifiedRounded";
import Building2 from "@mui/icons-material/BusinessRounded";
import Camera from "@mui/icons-material/PhotoCameraRounded";
import CheckCircle2 from "@mui/icons-material/CheckCircleRounded";
import Eye from "@mui/icons-material/VisibilityRounded";
import EyeOff from "@mui/icons-material/VisibilityOffRounded";
import KeyRound from "@mui/icons-material/KeyRounded";
import LockKeyhole from "@mui/icons-material/LockRounded";
import Mail from "@mui/icons-material/EmailRounded";
import Phone from "@mui/icons-material/PhoneRounded";
import Save from "@mui/icons-material/SaveRounded";
import ShieldCheck from "@mui/icons-material/SecurityRounded";
import Upload from "@mui/icons-material/FileUploadRounded";
import UserRound from "@mui/icons-material/PersonRounded";

import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import IconButton from "@mui/material/IconButton";
import Skeleton from "@mui/material/Skeleton";
import TextField from "@mui/material/TextField";
import { usePacedStateBatch } from "@/hooks/use-paced-state-batch";
import { authApi } from "@/platform/auth/api/auth-api";
import { getCurrentAccount, saveCurrentAccount } from "@/platform/auth/api/auth-storage";
import type { TeacherAccount } from "@/platform/auth/types/auth-types";

type ProfileFormState = {
  fullName: string;
  phone: string;
  department: string;
  title: string;
  avatarUrl: string;
  bio: string;
};

type PasswordFormState = {
  currentPassword: string;
  nextPassword: string;
  confirmPassword: string;
};

type ProfileTab = "profile" | "security";

type Notice = { tone: "success" | "error"; message: string };
const CROP_PREVIEW_SIZE = 320;
const CROP_OUTPUT_SIZE = 512;

type AvatarCropState = {
  file: File;
  previewUrl: string;
  zoom: number;
  offset: { x: number; y: number };
  image: { width: number; height: number } | null;
  drag: { pointerId: number; startX: number; startY: number; originX: number; originY: number } | null;
};
const emptyForm: ProfileFormState = {
  fullName: "",
  phone: "",
  department: "ERG",
  title: "Giáo viên",
  avatarUrl: "",
  bio: "",
};

const emptyPasswordForm: PasswordFormState = {
  currentPassword: "",
  nextPassword: "",
  confirmPassword: "",
};

export function ProfilePage() {
  const location = useLocation();
  const [account, setAccount] = useState<TeacherAccount | null>(() => getCurrentAccount());
  const [form, setForm] = useState<ProfileFormState>(() => toForm(getCurrentAccount()));
  const [passwordForm, setPasswordForm] = useState<PasswordFormState>(emptyPasswordForm);
  const [activeTab, setActiveTab] = useState<ProfileTab>("profile");
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);
  const [profileNotice, setProfileNotice] = useState<Notice | null>(null);
  const [securityNotice, setSecurityNotice] = useState<Notice | null>(null);
  const [avatarCrop, setAvatarCrop] = useState<AvatarCropState | null>(null);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const paceStateUpdate = usePacedStateBatch();

  useEffect(() => {
    const tab = new URLSearchParams(location.search).get("tab");
    if (tab === "profile" || tab === "security") {
      paceStateUpdate(() => setActiveTab(tab));
    }
  }, [location.search, paceStateUpdate]);

  useEffect(() => {
    let cancelled = false;

    void authApi
      .profile()
      .then((profile) => {
        if (cancelled) return;
        const nextAccount: TeacherAccount = { ...profile };
        setAccount(nextAccount);
        setForm(toForm(nextAccount));
        saveCurrentAccount(nextAccount);
      })
      .catch(() => {
        if (cancelled) return;
        const current = getCurrentAccount();
        setAccount(current);
        setForm(toForm(current));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    return () => {
      if (avatarCrop?.previewUrl) URL.revokeObjectURL(avatarCrop.previewUrl);
    };
  }, [avatarCrop?.previewUrl]);

  const initials = useMemo(() => getInitials(form.fullName || account?.email || "ERG"), [account?.email, form.fullName]);
  const avatarUrl = form.avatarUrl.trim();
  const completionItems = useMemo(
    () => [Boolean(form.fullName.trim()), Boolean(form.phone.trim()), Boolean(form.department.trim()), Boolean(form.title.trim())],
    [form.department, form.fullName, form.phone, form.title],
  );
  const completedCount = completionItems.filter(Boolean).length;
  const completionPercent = Math.round((completedCount / completionItems.length) * 100);
  const passwordScore = getPasswordScore(passwordForm.nextPassword);
  const canChangePassword = Boolean(account?.id && account.provider === "password");

  const update = (field: keyof ProfileFormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const updatePasswordField = (field: keyof PasswordFormState, value: string) => {
    setPasswordForm((current) => ({ ...current, [field]: value }));
  };

  const saveProfile = async () => {
    if (!account) return;
    setIsSavingProfile(true);
    setProfileNotice(null);

    try {
      const updated = await authApi.updateProfile(account.id, form);
      const nextAccount: TeacherAccount = {
        ...account,
        ...updated,
        fullName: updated.fullName || form.fullName,
        phone: updated.phone || form.phone,
        department: form.department,
        title: form.title,
        avatarUrl: updated.avatarUrl || form.avatarUrl,
        bio: updated.bio || form.bio,
      };
      saveCurrentAccount(nextAccount);
      setAccount(nextAccount);
      setForm(toForm(nextAccount));
      setProfileNotice({ tone: "success", message: "Hồ sơ đã được cập nhật." });
    } catch (error) {
      setProfileNotice({ tone: "error", message: error instanceof Error ? error.message : "Không thể cập nhật hồ sơ." });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const changePassword = async () => {
    if (!account || !canChangePassword) return;
    setIsSavingPassword(true);
    setSecurityNotice(null);

    try {
      const nextPassword = passwordForm.nextPassword.trim();
      if (!passwordForm.currentPassword.trim()) {
        throw new Error("Vui lòng nhập mật khẩu hiện tại.");
      }
      if (nextPassword.length < 8) {
        throw new Error("Mật khẩu mới cần tối thiểu 8 ký tự.");
      }
      if (nextPassword !== passwordForm.confirmPassword.trim()) {
        throw new Error("Mật khẩu xác nhận chưa khớp.");
      }
      await authApi.updatePassword(account.id, {
        currentPassword: passwordForm.currentPassword,
        nextPassword,
      });
      setPasswordForm(emptyPasswordForm);
      setSecurityNotice({ tone: "success", message: "Mật khẩu đã được thay đổi thành công." });
    } catch (error) {
      setSecurityNotice({ tone: "error", message: error instanceof Error ? error.message : "Không thể đổi mật khẩu." });
    } finally {
      setIsSavingPassword(false);
    }
  };

  const openAvatarCropper = (file: File | null) => {
    if (!file) return;
    setProfileNotice(null);

    if (!file.type.startsWith("image/")) {
      setProfileNotice({ tone: "error", message: "Vui lòng chọn file ảnh hợp lệ." });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setProfileNotice({ tone: "error", message: "Avatar tối đa 5MB." });
      return;
    }

    if (avatarCrop?.previewUrl) URL.revokeObjectURL(avatarCrop.previewUrl);
    setAvatarCrop({
      file,
      previewUrl: URL.createObjectURL(file),
      zoom: 1,
      offset: { x: 0, y: 0 },
      image: null,
      drag: null,
    });
  };

  const closeAvatarCropper = () => {
    setAvatarCrop((current) => {
      if (current?.previewUrl) URL.revokeObjectURL(current.previewUrl);
      return null;
    });
  };

  const uploadCroppedAvatar = async () => {
    if (!account || !avatarCrop) return;
    setProfileNotice(null);
    setIsUploadingAvatar(true);

    try {
      const croppedFile = await createCroppedAvatarFile(avatarCrop);
      const updated = await authApi.uploadAvatar(account.id, croppedFile);
      const nextAccount: TeacherAccount = {
        ...account,
        ...updated,
        department: account.department,
        title: account.title,
        avatarUrl: updated.avatarUrl || account.avatarUrl || "",
      };
      saveCurrentAccount(nextAccount);
      setAccount(nextAccount);
      setForm((current) => ({ ...current, avatarUrl: nextAccount.avatarUrl ?? "" }));
      setProfileNotice({ tone: "success", message: "Avatar đã được căn chỉnh và upload lên R2 theo thư mục avatar/{userID}." });
      closeAvatarCropper();
    } catch (error) {
      setProfileNotice({ tone: "error", message: error instanceof Error ? error.message : "Không thể upload avatar." });
    } finally {
      setIsUploadingAvatar(false);
    }
  };
  const primaryAction = activeTab === "security" ? changePassword : saveProfile;
  const primaryDisabled = activeTab === "security" ? !canChangePassword || isSavingPassword : !account || isSavingProfile;

  return (
    <Box component="main" sx={{"minHeight":"100vh","backgroundColor":"#f7f8fa","paddingInline":"calc(0.25rem * 4)","paddingBlock":"calc(0.25rem * 5)","color":"oklch(12.9% 0.042 264.695)","@media (min-width: 64rem)":{"paddingInline":"calc(0.25rem * 8)"}}}>
      <Box component="div" sx={{"marginInline":"auto","display":"flex","width":"100%","maxWidth":"80rem","flexDirection":"column","gap":"calc(0.25rem * 5)"}}>
        <Box component="header" sx={{"overflow":"hidden","borderRadius":"0.5rem","borderStyle":"solid","borderWidth":"1px","borderColor":"oklch(92.9% 0.013 255.508)","backgroundColor":"#fff","boxShadow":"0 0 #0000, 0 0 #0000, 0 0 #0000, 0 0 #0000, 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)"}}><Box component="div" sx={{"height":"calc(0.25rem * 1.5)","backgroundColor":"var(--erg-blue)"}} /><Box component="div" sx={{"display":"flex","flexDirection":"column","gap":"calc(0.25rem * 4)","paddingInline":"calc(0.25rem * 5)","paddingBlock":"calc(0.25rem * 4)","@media (min-width: 64rem)":{"flexDirection":"row","alignItems":"center","justifyContent":"space-between"}}}>
          <Box component="div" sx={{"display":"flex","alignItems":"center","gap":"calc(0.25rem * 3)"}}>
            <Button component={Link} to="/" variant="outlined" startIcon={<ArrowLeft sx={{ fontSize: 16 }} />} sx={{"height":"calc(0.25rem * 10)","borderRadius":"0.5rem","backgroundColor":"#fff"}}>
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

function ProfileFormPanel({ account, form, isSaving, notice, onSave, onUpdate }: {
  account: TeacherAccount | null;
  form: ProfileFormState;
  isSaving: boolean;
  notice: Notice | null;
  onSave: () => Promise<void>;
  onUpdate: (field: keyof ProfileFormState, value: string) => void;
}) {
  return (
    <Box component="div" sx={{"borderRadius":"0.5rem","borderStyle":"solid","borderWidth":"1px","borderColor":"oklch(92.9% 0.013 255.508)","backgroundColor":"#fff","padding":"calc(0.25rem * 5)","boxShadow":"0 0 #0000, 0 0 #0000, 0 0 #0000, 0 0 #0000, 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)","@media (min-width: 64rem)":{"padding":"calc(0.25rem * 6)"}}}>
      <SectionHeader
        icon={<UserRound sx={{ fontSize: 20 }} />}
        eyebrow="Thông tin cá nhân"
        title="Hồ sơ hiển thị trong LMS"
        description="Thông tin này dùng cho lời chào, phân quyền, danh sách thành viên và các luồng quản trị."
        action={
          <Button variant="contained" onClick={() => void onSave()} disabled={!account || isSaving} startIcon={isSaving ? <CircularProgress color="inherit" size={16} /> : <Save sx={{ fontSize: 16 }} />} sx={{"height":"calc(0.25rem * 10)","borderRadius":"0.5rem","backgroundColor":"var(--erg-blue)","paddingInline":"calc(0.25rem * 4)","color":"#fff","&:hover":{"@media (hover: hover)":{"backgroundColor":"var(--erg-blue-hover)"}}}}>
            Lưu hồ sơ
          </Button>
        }
      />

      <NoticeBox notice={notice} />

      <Box component="div" sx={{"marginTop":"calc(0.25rem * 6)","display":"grid","gap":"calc(0.25rem * 4)","@media (min-width: 48rem)":{"gridTemplateColumns":"repeat(2, minmax(0, 1fr))"}}}>
        <Field icon={<UserRound sx={{ fontSize: 16 }} />} label="Họ và tên">
          <TextField fullWidth size="small" value={form.fullName} onChange={(event) => onUpdate("fullName", event.target.value)} placeholder="Nhập họ và tên" />
        </Field>
        <Field icon={<Phone sx={{ fontSize: 16 }} />} label="Số điện thoại">
          <TextField fullWidth size="small" value={form.phone} onChange={(event) => onUpdate("phone", event.target.value)} placeholder="Nhập số điện thoại" />
        </Field>
        <Field icon={<Mail sx={{ fontSize: 16 }} />} label="Email đăng nhập">
          <TextField fullWidth size="small" value={account?.email ?? ""} disabled slotProps={{ htmlInput: { readOnly: true } }} />
        </Field>
        <Field icon={<Building2 sx={{ fontSize: 16 }} />} label="Bộ phận">
          <TextField fullWidth size="small" value={form.department} onChange={(event) => onUpdate("department", event.target.value)} placeholder="ERG / LMS / Trung tâm" />
        </Field>
        <Field icon={<BadgeCheck sx={{ fontSize: 16 }} />} label="Chức danh">
          <TextField fullWidth size="small" value={form.title} onChange={(event) => onUpdate("title", event.target.value)} placeholder="Giáo viên / Quản trị viên" />
        </Field>
        <Field icon={<UserRound sx={{ fontSize: 16 }} />} label="Giới thiệu ngắn" fullWidth>
          <TextField fullWidth multiline minRows={4} value={form.bio} onChange={(event) => onUpdate("bio", event.target.value)} placeholder="Một vài dòng giới thiệu về vai trò hoặc chuyên môn của bạn" />
        </Field>
      </Box>
    </Box>
  );
}

function SecurityPanel({
  account,
  canChangePassword,
  form,
  isSaving,
  notice,
  passwordScore,
  showPasswords,
  onChangePassword,
  onTogglePasswords,
  onUpdate,
}: {
  account: TeacherAccount | null;
  canChangePassword: boolean;
  form: PasswordFormState;
  isSaving: boolean;
  notice: Notice | null;
  passwordScore: number;
  showPasswords: boolean;
  onChangePassword: () => Promise<void>;
  onTogglePasswords: () => void;
  onUpdate: (field: keyof PasswordFormState, value: string) => void;
}) {
  const passwordType = showPasswords ? "text" : "password";

  return (
    <Box component="div" sx={{"display":"grid","gap":"calc(0.25rem * 5)"}}>
      <Box component="div" sx={{"borderRadius":"0.5rem","borderStyle":"solid","borderWidth":"1px","borderColor":"oklch(92.9% 0.013 255.508)","backgroundColor":"#fff","padding":"calc(0.25rem * 5)","boxShadow":"0 0 #0000, 0 0 #0000, 0 0 #0000, 0 0 #0000, 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)","@media (min-width: 64rem)":{"padding":"calc(0.25rem * 6)"}}}>
        <SectionHeader
          icon={<ShieldCheck sx={{ fontSize: 20 }} />}
          eyebrow="Bảo mật tài khoản"
          title="Đổi mật khẩu đăng nhập"
          description="Mật khẩu mới được gửi thẳng tới BE và chỉ cho phép đổi mật khẩu của chính tài khoản đang đăng nhập."
          action={
            <Button variant="contained" onClick={() => void onChangePassword()} disabled={!canChangePassword || isSaving} startIcon={isSaving ? <CircularProgress color="inherit" size={16} /> : <KeyRound sx={{ fontSize: 16 }} />} sx={{"height":"calc(0.25rem * 10)","borderRadius":"0.375rem","backgroundColor":"var(--erg-blue)","paddingInline":"calc(0.25rem * 4)","color":"#fff","&:hover":{"@media (hover: hover)":{"backgroundColor":"var(--erg-blue-hover)"}}}}>
              Đổi mật khẩu
            </Button>
          }
        />

        <NoticeBox notice={notice} />

        {!canChangePassword ? (
          <Box component="div" sx={{"marginTop":"calc(0.25rem * 5)","borderRadius":"0.5rem","borderStyle":"solid","borderWidth":"1px","borderColor":"oklch(92.4% 0.12 95.746)","backgroundColor":"oklch(98.7% 0.022 95.277)","paddingInline":"calc(0.25rem * 4)","paddingBlock":"calc(0.25rem * 3)","fontSize":"0.875rem","lineHeight":"calc(1.25 / 0.875)","fontWeight":"600","color":"oklch(47.3% 0.137 46.201)"}}>
            Tài khoản này đang dùng provider {account?.provider ?? "khác"}, nên chưa bật đổi mật khẩu local trên màn hình này.
          </Box>
        ) : null}

        <Box component="div" sx={{"marginTop":"calc(0.25rem * 6)","display":"grid","gap":"calc(0.25rem * 4)","@media (min-width: 48rem)":{"gridTemplateColumns":"repeat(2, minmax(0, 1fr))"}}}>
          <Field icon={<LockKeyhole sx={{ fontSize: 16 }} />} label="Mật khẩu hiện tại" fullWidth>
            <PasswordInput
              disabled={!canChangePassword}
              type={passwordType}
              value={form.currentPassword}
              onChange={(value) => onUpdate("currentPassword", value)}
              onToggle={onTogglePasswords}
              show={showPasswords}
              placeholder="Nhập mật khẩu hiện tại"
            />
          </Field>
          <Field icon={<KeyRound sx={{ fontSize: 16 }} />} label="Mật khẩu mới">
            <TextField fullWidth size="small" disabled={!canChangePassword} type={passwordType} value={form.nextPassword} onChange={(event) => onUpdate("nextPassword", event.target.value)} placeholder="Tối thiểu 8 ký tự" />
          </Field>
          <Field icon={<KeyRound sx={{ fontSize: 16 }} />} label="Nhập lại mật khẩu mới">
            <TextField fullWidth size="small" disabled={!canChangePassword} type={passwordType} value={form.confirmPassword} onChange={(event) => onUpdate("confirmPassword", event.target.value)} placeholder="Nhập lại mật khẩu mới" />
          </Field>
        </Box>

        <Box component="div" sx={{"marginTop":"calc(0.25rem * 5)","borderRadius":"0.5rem","borderStyle":"solid","borderWidth":"1px","borderColor":"oklch(92.9% 0.013 255.508)","backgroundColor":"oklch(98.4% 0.003 247.858)","padding":"calc(0.25rem * 4)"}}>
          <Box component="div" sx={{"display":"flex","alignItems":"center","justifyContent":"space-between","gap":"calc(0.25rem * 3)","fontSize":"0.875rem","lineHeight":"calc(1.25 / 0.875)","fontWeight":"500","color":"oklch(37.2% 0.044 257.287)"}}>
            <span>Độ mạnh mật khẩu mới</span>
            <span>{passwordScoreLabel(passwordScore)}</span>
          </Box>
          <Box component="div" sx={{"marginTop":"calc(0.25rem * 3)","display":"grid","gridTemplateColumns":"repeat(4, minmax(0, 1fr))","gap":"calc(0.25rem * 2)"}}>
            {[0, 1, 2, 3].map((index) => (
              <Box key={index} sx={{ bgcolor: index < passwordScore ? "primary.main" : "divider", borderRadius: 999, height: 8 }} />
            ))}
          </Box>
          <Box component="p" sx={{"marginTop":"calc(0.25rem * 3)","fontSize":"0.875rem","lineHeight":"calc(0.25rem * 6)","color":"oklch(55.4% 0.046 257.417)"}}>
            Gợi ý: dùng tối thiểu 8 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt để giảm rủi ro bị đoán mật khẩu.
          </Box>
        </Box>
      </Box>

      <Box component="div" sx={{"borderRadius":"0.5rem","borderStyle":"solid","borderWidth":"1px","borderColor":"oklch(92.9% 0.013 255.508)","backgroundColor":"#fff","padding":"calc(0.25rem * 5)","boxShadow":"0 0 #0000, 0 0 #0000, 0 0 #0000, 0 0 #0000, 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)","@media (min-width: 64rem)":{"padding":"calc(0.25rem * 6)"}}}>
        <SectionHeader
          icon={<CheckCircle2 sx={{ fontSize: 20 }} />}
          eyebrow="Phiên đăng nhập"
          title="Thông tin xác thực hiện tại"
          description="Khu vực này giúp người dùng hiểu tài khoản đang đăng nhập bằng phương thức nào."
        />
        <Box component="div" sx={{"marginTop":"calc(0.25rem * 5)","display":"grid","gap":"calc(0.25rem * 3)","@media (min-width: 48rem)":{"gridTemplateColumns":"repeat(3, minmax(0, 1fr))"}}}>
          <InfoTile label="Provider" value={account?.provider ?? "Không rõ"} />
          <InfoTile label="Trạng thái" value={account?.status ?? "Không rõ"} />
          <InfoTile label="Onboarding" value={account?.isProfileCompleted ? "Đã hoàn tất" : "Cần bổ sung"} />
        </Box>
      </Box>
    </Box>
  );
}

export function AvatarCropDialog({ crop, isUploading, onChange, onClose, onPickAnother, onUpload }: {
  crop: AvatarCropState | null;
  isUploading: boolean;
  onChange: (crop: AvatarCropState | null | ((current: AvatarCropState | null) => AvatarCropState | null)) => void;
  onClose: () => void;
  onPickAnother: () => void;
  onUpload: () => Promise<void>;
}) {
  const geometry = crop?.image ? getAvatarGeometry(crop.image, crop.zoom, crop.offset, CROP_PREVIEW_SIZE) : null;

  const updateZoom = (value: number) => {
    onChange((current) => {
      if (!current) return current;
      const nextZoom = Number(value.toFixed(2));
      return {
        ...current,
        zoom: nextZoom,
        offset: current.image ? clampAvatarOffset(current.offset, current.image, nextZoom, CROP_PREVIEW_SIZE) : current.offset,
      };
    });
  };

  const startDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!crop?.image) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    onChange((current) =>
      current
        ? {
            ...current,
            drag: {
              pointerId: event.pointerId,
              startX: event.clientX,
              startY: event.clientY,
              originX: current.offset.x,
              originY: current.offset.y,
            },
          }
        : current,
    );
  };

  const moveDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    onChange((current) => {
      if (!current?.drag || !current.image || current.drag.pointerId !== event.pointerId) return current;
      const offset = clampAvatarOffset(
        {
          x: current.drag.originX + event.clientX - current.drag.startX,
          y: current.drag.originY + event.clientY - current.drag.startY,
        },
        current.image,
        current.zoom,
        CROP_PREVIEW_SIZE,
      );
      return { ...current, offset };
    });
  };

  const endDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    onChange((current) => {
      if (!current?.drag || current.drag.pointerId !== event.pointerId) return current;
      return { ...current, drag: null };
    });
  };

  return (
    <Dialog
      open={Boolean(crop)}
      onClose={() => onClose()}
      maxWidth={false}
      slotProps={{ paper: { sx: { maxWidth: 760, borderRadius: 2, overflow: "hidden" } } }}
    >
      <div>
        <Box component="div" sx={{"height":"calc(0.25rem * 1.5)","backgroundColor":"var(--erg-blue)"}} />
        <Box component="div" sx={{"borderBottomStyle":"solid","borderBottomWidth":"1px","borderColor":"oklch(92.9% 0.013 255.508)","paddingInline":"calc(0.25rem * 6)","paddingBlock":"calc(0.25rem * 5)"}}>
          <Box component="h2" sx={{"fontSize":"1.25rem","lineHeight":"calc(1.75 / 1.25)","fontWeight":"600","color":"var(--foreground)"}}>Căn chỉnh ảnh đại diện</Box>
          <Box component="p" sx={{"fontSize":"0.875rem","lineHeight":"calc(0.25rem * 5)","color":"var(--muted-foreground)"}}>Kéo ảnh để đặt khuôn mặt vào giữa khung, điều chỉnh zoom rồi lưu lên R2.</Box>
        </Box>

        <Box sx={{ display: "grid", gap: 3, gridTemplateColumns: { lg: "360px minmax(0,1fr)" }, p: 3 }}>
          <Box component="div" sx={{"display":"flex","flexDirection":"column","alignItems":"center","gap":"calc(0.25rem * 4)"}}>
            <Box component="div"
              sx={{"position":"relative","display":"grid","WebkitUserSelect":"none","userSelect":"none","placeItems":"center","overflow":"hidden","borderRadius":"0.5rem","borderStyle":"solid","borderWidth":"1px","borderColor":"oklch(92.9% 0.013 255.508)","backgroundColor":"oklch(12.9% 0.042 264.695)"}}
              style={{ width: CROP_PREVIEW_SIZE, height: CROP_PREVIEW_SIZE }}
              onPointerDown={startDrag}
              onPointerMove={moveDrag}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
            >
              {crop ? (
                <Box component="img"
                  src={crop.previewUrl}
                  alt="Avatar preview"
                  sx={{"position":"absolute","maxWidth":"none","cursor":"grab","objectFit":"cover","&:active":{"cursor":"grabbing"}}}
                  draggable={false}
                  style={
                    geometry
                      ? {
                          width: geometry.width,
                          height: geometry.height,
                          left: CROP_PREVIEW_SIZE / 2 + geometry.offset.x,
                          top: CROP_PREVIEW_SIZE / 2 + geometry.offset.y,
                          transform: "translate(-50%, -50%)",
                        }
                      : { maxWidth: "100%" }
                  }
                  onLoad={(event: SyntheticEvent<HTMLImageElement>) => {
                    const image = event.currentTarget;
                    onChange((current) =>
                      current
                        ? {
                            ...current,
                            image: { width: image.naturalWidth, height: image.naturalHeight },
                            offset: { x: 0, y: 0 },
                          }
                        : current,
                    );
                  }}
                />
              ) : null}
              <Box component="div" sx={{"pointerEvents":"none","position":"absolute","inset":"calc(0.25rem * 0)","backgroundColor":"color-mix(in srgb, oklch(12.9% 0.042 264.695) 70%, transparent)","@supports (color: color-mix(in lab, red, red))":{"backgroundColor":"color-mix(in oklab, oklch(12.9% 0.042 264.695) 70%, transparent)"}}} />
              <Box component="div" sx={{"pointerEvents":"none","position":"absolute","left":"calc(1 / 2 * 100%)","top":"calc(1 / 2 * 100%)","width":"240px","height":"240px","translate":"0 calc(calc(1 / 2 * 100%) * -1)","borderRadius":"9999px","borderStyle":"solid","borderWidth":"2px","borderColor":"#fff"}} />
            </Box>
            <Box component="p" sx={{"textAlign":"center","fontSize":"0.875rem","lineHeight":"calc(1.25 / 0.875)","fontWeight":"500","color":"oklch(55.4% 0.046 257.417)"}}>Ảnh sau khi lưu sẽ được crop vuông 512px và BE tối ưu lại trước khi đưa lên R2.</Box>
          </Box>

          <Box component="div" sx={{"display":"flex","flexDirection":"column","justifyContent":"space-between","gap":"calc(0.25rem * 6)"}}>
            <Box component="div" sx={{"borderRadius":"0.5rem","borderStyle":"solid","borderWidth":"1px","borderColor":"oklch(92.9% 0.013 255.508)","backgroundColor":"oklch(98.4% 0.003 247.858)","padding":"calc(0.25rem * 4)"}}>
              <Box component="div" sx={{"display":"flex","alignItems":"center","justifyContent":"space-between","gap":"calc(0.25rem * 3)"}}>
                <div>
                  <Box component="p" sx={{"fontSize":"0.75rem","lineHeight":"calc(1 / 0.75)","fontWeight":"600","color":"oklch(70.4% 0.04 256.788)"}}>Preview</Box>
                  <Box component="p" sx={{"marginTop":"calc(0.25rem * 1)","fontSize":"0.875rem","lineHeight":"calc(1.25 / 0.875)","fontWeight":"600","color":"oklch(44.6% 0.043 257.281)"}}>Hiển thị trong LMS</Box>
                </div>
                <Box component="div" sx={{"width":"calc(0.25rem * 20)","height":"calc(0.25rem * 20)","overflow":"hidden","borderRadius":"9999px","borderStyle":"solid","borderWidth":"1px","borderColor":"oklch(92.9% 0.013 255.508)","backgroundColor":"#fff","boxShadow":"0 0 #0000, 0 0 #0000, 0 0 #0000, 0 0 #0000, 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)"}}>
                  {crop ? (
                    <Box component="div" sx={{"position":"relative","height":"100%","width":"100%","overflow":"hidden","borderRadius":"9999px","backgroundColor":"oklch(96.8% 0.007 247.896)"}}>
                      <Box component="img"
                        src={crop.previewUrl}
                        alt="Avatar round preview"
                        sx={{"position":"absolute","maxWidth":"none"}}
                        draggable={false}
                        style={
                          geometry
                            ? {
                                width: geometry.width / 4,
                                height: geometry.height / 4,
                                left: 40 + geometry.offset.x / 4,
                                top: 40 + geometry.offset.y / 4,
                                transform: "translate(-50%, -50%)",
                              }
                            : { width: "100%", height: "100%", objectFit: "cover" }
                        }
                      />
                    </Box>
                  ) : null}
                </Box>
              </Box>
            </Box>

            <div>
              <Box component="div" sx={{"display":"flex","alignItems":"center","justifyContent":"space-between","fontSize":"0.875rem","lineHeight":"calc(1.25 / 0.875)","fontWeight":"500","color":"oklch(37.2% 0.044 257.287)"}}>
                <span>Zoom</span>
                <span>{Math.round((crop?.zoom ?? 1) * 100)}%</span>
              </Box>
              <Box component="input"
                sx={{"marginTop":"calc(0.25rem * 3)","height":"calc(0.25rem * 2)","width":"100%","accentColor":"var(--erg-blue)"}}
                type="range"
                min={1}
                max={3}
                step={0.05}
                value={crop?.zoom ?? 1}
                onChange={(event) => updateZoom(Number(event.target.value))}
              />
              <Box component="div" sx={{"marginTop":"calc(0.25rem * 4)","display":"flex","gap":"calc(0.25rem * 2)"}}>
                <Button type="button" variant="outlined" sx={{"height":"calc(0.25rem * 10)","borderRadius":"0.5rem"}} onClick={() => updateZoom(1)} disabled={isUploading}>
                  Reset
                </Button>
                <Button type="button" variant="outlined" sx={{"height":"calc(0.25rem * 10)","borderRadius":"0.5rem"}} startIcon={<Upload sx={{ fontSize: 16 }} />} onClick={onPickAnother} disabled={isUploading}>
                  Chọn ảnh khác
                </Button>
              </Box>
            </div>

            <Box component="div" sx={{"borderRadius":"0.5rem","borderStyle":"solid","borderWidth":"1px","borderColor":"#b8d6fa","backgroundColor":"var(--erg-blue-light)","paddingInline":"calc(0.25rem * 4)","paddingBlock":"calc(0.25rem * 3)","fontSize":"0.875rem","lineHeight":"calc(0.25rem * 6)","fontWeight":"600","color":"var(--erg-blue)"}}>
              Đường dẫn R2 sau khi lưu: <Box component="span" sx={{"fontWeight":"600"}}>avatar/{"{userID}"}/...</Box>
            </Box>
          </Box>
        </Box>

        <Box component="div" sx={{"display":"flex","justifyContent":"flex-end","gap":"calc(0.25rem * 2)","borderTopStyle":"solid","borderTopWidth":"1px","borderColor":"oklch(92.9% 0.013 255.508)","backgroundColor":"oklch(98.4% 0.003 247.858)","paddingInline":"calc(0.25rem * 6)","paddingBlock":"calc(0.25rem * 4)"}}>
          <Button type="button" variant="outlined" sx={{"borderRadius":"0.5rem"}} onClick={onClose} disabled={isUploading}>
            Hủy
          </Button>
          <Button type="button" variant="contained" startIcon={isUploading ? <CircularProgress color="inherit" size={16} /> : <Upload sx={{ fontSize: 16 }} />} sx={{"borderRadius":"0.375rem","backgroundColor":"var(--erg-blue)","color":"#fff","&:hover":{"@media (hover: hover)":{"backgroundColor":"var(--erg-blue-hover)"}}}} onClick={() => void onUpload()} disabled={!crop?.image || isUploading}>
            Lưu avatar
          </Button>
        </Box>
      </div>
    </Dialog>
  );
}
function SectionHeader({ action, description, eyebrow, icon, title }: { action?: ReactNode; description: string; eyebrow: string; icon: ReactNode; title: string }) {
  return (
    <Box component="div" sx={{"display":"flex","flexDirection":"column","gap":"calc(0.25rem * 4)","borderBottomStyle":"solid","borderBottomWidth":"1px","borderColor":"oklch(92.9% 0.013 255.508)","paddingBottom":"calc(0.25rem * 5)","@media (min-width: 48rem)":{"flexDirection":"row","alignItems":"flex-start","justifyContent":"space-between"}}}>
      <Box component="div" sx={{"display":"flex","gap":"calc(0.25rem * 3)"}}>
        <Box component="div" sx={{"display":"grid","width":"calc(0.25rem * 11)","height":"calc(0.25rem * 11)","flexShrink":"0","placeItems":"center","borderRadius":"0.5rem","backgroundColor":"var(--erg-blue-light)","color":"var(--erg-blue)"}}>{icon}</Box>
        <div>
          <Box component="p" sx={{"fontSize":"0.75rem","lineHeight":"calc(1 / 0.75)","fontWeight":"600","color":"var(--erg-red)"}}>{eyebrow}</Box>
          <Box component="h2" sx={{"marginTop":"calc(0.25rem * 1)","fontSize":"1rem","lineHeight":"calc(1.5 / 1)","fontWeight":"600","color":"oklch(12.9% 0.042 264.695)"}}>{title}</Box>
          <Box component="p" sx={{"marginTop":"calc(0.25rem * 1)","maxWidth":"42rem","fontSize":"0.875rem","lineHeight":"calc(0.25rem * 6)","color":"oklch(55.4% 0.046 257.417)"}}>{description}</Box>
        </div>
      </Box>
      {action ? <Box component="div" sx={{"flexShrink":"0"}}>{action}</Box> : null}
    </Box>
  );
}

function Field({ children, fullWidth = false, icon, label }: { children: ReactNode; fullWidth?: boolean; icon: ReactNode; label: string }) {
  return (
    <Box component="label" sx={{ gridColumn: fullWidth ? { md: "1 / -1" } : undefined }}>
      <Box component="span" sx={{"marginBottom":"calc(0.25rem * 2)","display":"flex","alignItems":"center","gap":"calc(0.25rem * 2)","fontSize":"0.75rem","lineHeight":"calc(1 / 0.75)","fontWeight":"600","color":"oklch(70.4% 0.04 256.788)"}}>
        {icon}
        {label}
      </Box>
      {children}
    </Box>
  );
}

function PasswordInput({ disabled, onChange, onToggle, placeholder, show, type, value }: {
  disabled: boolean;
  onChange: (value: string) => void;
  onToggle: () => void;
  placeholder: string;
  show: boolean;
  type: "password" | "text";
  value: string;
}) {
  return (
    <Box sx={{ position: "relative" }}>
      <TextField fullWidth size="small" disabled={disabled} type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} sx={{ "& .MuiInputBase-input": { pr: 6 } }} />
      <IconButton
        aria-label={show ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
        sx={{"position":"absolute","right":"calc(0.25rem * 2)","top":"calc(1 / 2 * 100%)","display":"grid","width":"calc(0.25rem * 8)","height":"calc(0.25rem * 8)","translate":"0 calc(calc(1 / 2 * 100%) * -1)","placeItems":"center","borderRadius":"0.5rem","color":"oklch(55.4% 0.046 257.417)","transitionProperty":"color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, translate, scale, rotate, filter, -webkit-backdrop-filter, backdrop-filter, display, content-visibility, overlay, pointer-events","transitionTimingFunction":"cubic-bezier(0.4, 0, 0.2, 1)","transitionDuration":"150ms","&:hover":{"@media (hover: hover)":{"backgroundColor":"oklch(96.8% 0.007 247.896)","color":"oklch(20.8% 0.042 265.755)"}}}}
        size="small"
        onClick={onToggle}
      >
        {show ? <EyeOff sx={{ fontSize: 16 }} /> : <Eye sx={{ fontSize: 16 }} />}
      </IconButton>
    </Box>
  );
}

function ProfileTabButton({ active, description, icon, onClick, title }: { active: boolean; description: string; icon: ReactNode; onClick: () => void; title: string }) {
  return (
    <Box component="button"
      sx={{ alignItems: "center", bgcolor: active ? "var(--erg-blue-light)" : "background.paper", border: "1px solid", borderColor: active ? "primary.main" : "transparent", borderRadius: 1, boxShadow: active ? 1 : 0, color: active ? "primary.main" : "text.secondary", display: "flex", gap: 1.5, px: 2, py: 1.5, textAlign: "left", transition: "background-color 160ms ease, border-color 160ms ease", "&:hover": active ? {} : { bgcolor: "background.default", borderColor: "divider" } }}
      type="button"
      onClick={onClick}
    >
      <Box component="span" sx={{ bgcolor: active ? "background.paper" : "background.default", borderRadius: 1, display: "grid", height: 36, placeItems: "center", width: 36 }}>{icon}</Box>
      <Box component="span" sx={{"minWidth":"calc(0.25rem * 0)"}}>
        <Box component="span" sx={{"display":"block","fontSize":"0.875rem","lineHeight":"calc(1.25 / 0.875)","fontWeight":"600"}}>{title}</Box>
        <Box component="span" sx={{"marginTop":"calc(0.25rem * 0.5)","display":"block","overflow":"hidden","textOverflow":"ellipsis","whiteSpace":"nowrap","fontSize":"0.75rem","lineHeight":"calc(1 / 0.75)","fontWeight":"500","color":"oklch(55.4% 0.046 257.417)"}}>{description}</Box>
      </Box>
    </Box>
  );
}

function NoticeBox({ notice }: { notice: Notice | null }) {
  if (!notice) return null;
  return (
    <Box sx={{ bgcolor: notice.tone === "success" ? "success.50" : "error.50", border: "1px solid", borderColor: notice.tone === "success" ? "success.light" : "error.light", borderRadius: 1, color: notice.tone === "success" ? "success.dark" : "error.dark", fontSize: 14, fontWeight: 700, mt: 2.5, px: 2, py: 1.5 }}>
      {notice.message}
    </Box>
  );
}

function ProfileLine({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <Box component="div" sx={{"display":"flex","alignItems":"center","gap":"calc(0.25rem * 3)","borderRadius":"0.5rem","backgroundColor":"oklch(98.4% 0.003 247.858)","paddingInline":"calc(0.25rem * 3)","paddingBlock":"calc(0.25rem * 2)"}}>
      <Box component="span" sx={{"color":"var(--erg-blue)"}}>{icon}</Box>
      <Box component="div" sx={{"minWidth":"calc(0.25rem * 0)","flex":"1"}}>
        <Box component="p" sx={{"fontSize":"11px","fontWeight":"500","color":"oklch(70.4% 0.04 256.788)"}}>{label}</Box>
        <Box component="p" sx={{"overflow":"hidden","textOverflow":"ellipsis","whiteSpace":"nowrap","fontSize":"0.875rem","lineHeight":"calc(1.25 / 0.875)","fontWeight":"500","color":"oklch(20.8% 0.042 265.755)"}}>{value}</Box>
      </Box>
    </Box>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <Box component="div" sx={{"borderRadius":"0.5rem","borderStyle":"solid","borderWidth":"1px","borderColor":"oklch(92.9% 0.013 255.508)","backgroundColor":"oklch(98.4% 0.003 247.858)","paddingInline":"calc(0.25rem * 4)","paddingBlock":"calc(0.25rem * 3)"}}>
      <Box component="p" sx={{"fontSize":"0.75rem","lineHeight":"calc(1 / 0.75)","fontWeight":"500","color":"oklch(70.4% 0.04 256.788)"}}>{label}</Box>
      <Box component="p" sx={{"marginTop":"calc(0.25rem * 1)","fontSize":"0.875rem","lineHeight":"calc(1.25 / 0.875)","fontWeight":"600","color":"oklch(12.9% 0.042 264.695)"}}>{value}</Box>
    </Box>
  );
}

function toForm(account: TeacherAccount | null): ProfileFormState {
  return {
    fullName: account?.fullName ?? emptyForm.fullName,
    phone: account?.phone ?? emptyForm.phone,
    department: account?.department ?? emptyForm.department,
    title: account?.title ?? emptyForm.title,
    avatarUrl: account?.avatarUrl ?? emptyForm.avatarUrl,
    bio: account?.bio ?? emptyForm.bio,
  };
}

function getInitials(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  const first = parts.at(0)?.charAt(0) ?? "E";
  const last = parts.length > 1 ? parts.at(-1)?.charAt(0) : "";
  return `${first}${last}`.toUpperCase();
}

function getPasswordScore(value: string) {
  if (!value) return 0;
  const checks = [value.length >= 8, /[A-Z]/.test(value), /[a-z]/.test(value) && /\d/.test(value), /[^A-Za-z0-9]/.test(value)];
  return checks.filter(Boolean).length;
}

function passwordScoreLabel(score: number) {
  if (score >= 4) return "Mạnh";
  if (score >= 3) return "Khá";
  if (score >= 2) return "Trung bình";
  if (score >= 1) return "Yếu";
  return "Chưa nhập";
}

function getAvatarGeometry(image: { width: number; height: number }, zoom: number, offset: { x: number; y: number }, cropSize: number) {
  const baseScale = cropSize / Math.min(image.width, image.height);
  const scale = baseScale * zoom;
  return {
    width: image.width * scale,
    height: image.height * scale,
    offset: clampAvatarOffset(offset, image, zoom, cropSize),
  };
}

function clampAvatarOffset(offset: { x: number; y: number }, image: { width: number; height: number }, zoom: number, cropSize: number) {
  const baseScale = cropSize / Math.min(image.width, image.height);
  const width = image.width * baseScale * zoom;
  const height = image.height * baseScale * zoom;
  const maxX = Math.max(0, (width - cropSize) / 2);
  const maxY = Math.max(0, (height - cropSize) / 2);
  return {
    x: clamp(offset.x, -maxX, maxX),
    y: clamp(offset.y, -maxY, maxY),
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

async function createCroppedAvatarFile(crop: AvatarCropState) {
  if (!crop.image) throw new Error("Ảnh chưa sẵn sàng để crop.");
  const image = await loadImage(crop.previewUrl);
  const geometry = getAvatarGeometry({ width: image.naturalWidth, height: image.naturalHeight }, crop.zoom, crop.offset, CROP_PREVIEW_SIZE);
  const canvas = document.createElement("canvas");
  canvas.width = CROP_OUTPUT_SIZE;
  canvas.height = CROP_OUTPUT_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Trình duyệt không hỗ trợ xử lý ảnh.");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, CROP_OUTPUT_SIZE, CROP_OUTPUT_SIZE);
  const factor = CROP_OUTPUT_SIZE / CROP_PREVIEW_SIZE;
  const dx = (CROP_PREVIEW_SIZE / 2 - geometry.width / 2 + geometry.offset.x) * factor;
  const dy = (CROP_PREVIEW_SIZE / 2 - geometry.height / 2 + geometry.offset.y) * factor;
  ctx.drawImage(image, dx, dy, geometry.width * factor, geometry.height * factor);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => {
      if (result) resolve(result);
      else reject(new Error("Không thể tạo file avatar."));
    }, "image/jpeg", 0.9);
  });
  return new File([blob], "avatar.jpg", { type: "image/jpeg" });
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Không thể đọc ảnh avatar."));
    image.src = src;
  });
}
