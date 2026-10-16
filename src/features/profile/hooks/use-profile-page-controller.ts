import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "@tanstack/react-router";
import { createCroppedAvatarFile } from "@/features/profile/utils/profile-avatar";
import { getPasswordScore, getProfileInitials, validatePasswordChange } from "@/features/profile/utils/profile-utils";
import { EMPTY_PASSWORD_FORM, profileFormFromAccount, type AvatarCropState, type PasswordFormState, type ProfileFormState, type ProfileNotice, type ProfileTab } from "@/features/profile/types/profile-types";
import { usePacedStateBatch } from "@/hooks/use-paced-state-batch";
import { authApi } from "@/platform/auth/api/auth-api";
import { getCurrentAccount, saveCurrentAccount } from "@/platform/auth/api/auth-storage";
import type { TeacherAccount } from "@/platform/auth/types/auth-types";

export function useProfilePageController() {
  const location = useLocation();
  const [account, setAccount] = useState<TeacherAccount | null>(() => getCurrentAccount());
  const [form, setForm] = useState<ProfileFormState>(() => profileFormFromAccount(getCurrentAccount()));
  const [passwordForm, setPasswordForm] = useState<PasswordFormState>(EMPTY_PASSWORD_FORM);
  const [activeTab, setActiveTab] = useState<ProfileTab>("profile");
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);
  const [profileNotice, setProfileNotice] = useState<ProfileNotice | null>(null);
  const [securityNotice, setSecurityNotice] = useState<ProfileNotice | null>(null);
  const [avatarCrop, setAvatarCrop] = useState<AvatarCropState | null>(null);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const paceStateUpdate = usePacedStateBatch();

  useEffect(() => {
    const tab = new URLSearchParams(location.searchStr).get("tab");
    if (tab === "profile" || tab === "security") paceStateUpdate(() => setActiveTab(tab));
  }, [location.searchStr, paceStateUpdate]);
  useEffect(() => {
    let cancelled = false;
    void authApi.profile().then((profile) => {
      if (cancelled) return;
      const nextAccount: TeacherAccount = { ...profile };
      setAccount(nextAccount); setForm(profileFormFromAccount(nextAccount)); saveCurrentAccount(nextAccount);
    }).catch(() => {
      if (cancelled) return;
      const current = getCurrentAccount(); setAccount(current); setForm(profileFormFromAccount(current));
    }).finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, []);
  useEffect(() => () => { if (avatarCrop?.previewUrl) URL.revokeObjectURL(avatarCrop.previewUrl); }, [avatarCrop?.previewUrl]);

  const initials = useMemo(() => getProfileInitials(form.fullName || account?.email || "ERG"), [account?.email, form.fullName]);
  const avatarUrl = form.avatarUrl.trim();
  const completionItems = useMemo(() => [Boolean(form.fullName.trim()), Boolean(form.phone.trim()), Boolean(form.department.trim()), Boolean(form.title.trim())], [form.department, form.fullName, form.phone, form.title]);
  const completionPercent = Math.round((completionItems.filter(Boolean).length / completionItems.length) * 100);
  const passwordScore = getPasswordScore(passwordForm.nextPassword);
  const canChangePassword = Boolean(account?.id && account.provider === "password");
  const update = (field: keyof ProfileFormState, value: string) => setForm((current) => ({ ...current, [field]: value }));
  const updatePasswordField = (field: keyof PasswordFormState, value: string) => setPasswordForm((current) => ({ ...current, [field]: value }));

  const saveProfile = async () => {
    if (!account) return;
    setIsSavingProfile(true); setProfileNotice(null);
    try {
      const updated = await authApi.updateProfile(account.id, form);
      const nextAccount: TeacherAccount = { ...account, ...updated, fullName: updated.fullName || form.fullName, phone: updated.phone || form.phone, department: form.department, title: form.title, avatarUrl: updated.avatarUrl || form.avatarUrl, bio: updated.bio || form.bio };
      saveCurrentAccount(nextAccount); setAccount(nextAccount); setForm(profileFormFromAccount(nextAccount));
      setProfileNotice({ tone: "success", message: "Hồ sơ đã được cập nhật." });
    } catch (error) {
      setProfileNotice({ tone: "error", message: error instanceof Error ? error.message : "Không thể cập nhật hồ sơ." });
    } finally { setIsSavingProfile(false); }
  };
  const changePassword = async () => {
    if (!account || !canChangePassword) return;
    setIsSavingPassword(true); setSecurityNotice(null);
    try {
      const nextPassword = passwordForm.nextPassword.trim();
      const validationError = validatePasswordChange(passwordForm);
      if (validationError) throw new Error(validationError);
      await authApi.updatePassword(account.id, { currentPassword: passwordForm.currentPassword, nextPassword });
      setPasswordForm(EMPTY_PASSWORD_FORM); setSecurityNotice({ tone: "success", message: "Mật khẩu đã được thay đổi thành công." });
    } catch (error) {
      setSecurityNotice({ tone: "error", message: error instanceof Error ? error.message : "Không thể đổi mật khẩu." });
    } finally { setIsSavingPassword(false); }
  };
  const openAvatarCropper = (file: File | null) => {
    if (!file) return;
    setProfileNotice(null);
    if (!file.type.startsWith("image/")) { setProfileNotice({ tone: "error", message: "Vui lòng chọn file ảnh hợp lệ." }); return; }
    if (file.size > 5 * 1024 * 1024) { setProfileNotice({ tone: "error", message: "Avatar tối đa 5MB." }); return; }
    if (avatarCrop?.previewUrl) URL.revokeObjectURL(avatarCrop.previewUrl);
    setAvatarCrop({ file, previewUrl: URL.createObjectURL(file), zoom: 1, offset: { x: 0, y: 0 }, image: null, drag: null });
  };
  const closeAvatarCropper = () => setAvatarCrop((current) => {
    if (current?.previewUrl) URL.revokeObjectURL(current.previewUrl);
    return null;
  });
  const uploadCroppedAvatar = async () => {
    if (!account || !avatarCrop) return;
    setProfileNotice(null); setIsUploadingAvatar(true);
    try {
      const croppedFile = await createCroppedAvatarFile(avatarCrop);
      const updated = await authApi.uploadAvatar(account.id, croppedFile);
      const nextAccount: TeacherAccount = { ...account, ...updated, department: account.department, title: account.title, avatarUrl: updated.avatarUrl || account.avatarUrl || "" };
      saveCurrentAccount(nextAccount); setAccount(nextAccount);
      setForm((current) => ({ ...current, avatarUrl: nextAccount.avatarUrl ?? "" }));
      setProfileNotice({ tone: "success", message: "Avatar đã được căn chỉnh và upload lên R2 theo thư mục avatar/{userID}." });
      closeAvatarCropper();
    } catch (error) {
      setProfileNotice({ tone: "error", message: error instanceof Error ? error.message : "Không thể upload avatar." });
    } finally { setIsUploadingAvatar(false); }
  };
  return {
    account, activeTab, avatarCrop, avatarInputRef, avatarUrl, canChangePassword, changePassword, closeAvatarCropper,
    completionPercent, form, initials, isLoading, isSavingPassword, isSavingProfile, isUploadingAvatar,
    openAvatarCropper, passwordForm, passwordScore, profileNotice, saveProfile, securityNotice, setActiveTab,
    setAvatarCrop, setShowPasswords, showPasswords, update, updatePasswordField, uploadCroppedAvatar,
  };
}
