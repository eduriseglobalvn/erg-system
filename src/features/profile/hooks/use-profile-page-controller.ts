import { useEffect, useMemo, useState } from "react";
import { useLocation } from "@tanstack/react-router";
import { getPasswordScore, getProfileInitials, validatePasswordChange } from "@/features/profile/utils/profile-utils";
import { EMPTY_PASSWORD_FORM, profileFormFromAccount, type PasswordFormState, type ProfileFormState, type ProfileNotice, type ProfileTab } from "@/features/profile/types/profile-types";
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
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);
  const [profileNotice, setProfileNotice] = useState<ProfileNotice | null>(null);
  const [securityNotice, setSecurityNotice] = useState<ProfileNotice | null>(null);
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

  // Department and job title are staff fields; students never see or edit them.
  const showWorkRoleFields = !location.pathname.startsWith("/student");
  const initials = useMemo(() => getProfileInitials(form.fullName || account?.email || "ERG"), [account?.email, form.fullName]);
  const avatarUrl = form.avatarUrl.trim();
  const completionItems = useMemo(
    () => showWorkRoleFields
      ? [Boolean(form.fullName.trim()), Boolean(form.phone.trim()), Boolean(form.department.trim()), Boolean(form.title.trim())]
      : [Boolean(form.fullName.trim()), Boolean(form.phone.trim()), Boolean(form.avatarUrl.trim())],
    [form.avatarUrl, form.department, form.fullName, form.phone, form.title, showWorkRoleFields],
  );
  const completionPercent = Math.round((completionItems.filter(Boolean).length / completionItems.length) * 100);
  const passwordScore = getPasswordScore(passwordForm.nextPassword);
  const canChangePassword = Boolean(account?.id && account.provider === "password");
  const update = (field: keyof ProfileFormState, value: string) => setForm((current) => ({ ...current, [field]: value }));
  const updatePasswordField = (field: keyof PasswordFormState, value: string) => setPasswordForm((current) => ({ ...current, [field]: value }));

  const saveProfile = async () => {
    if (!account) return;
    setIsSavingProfile(true); setProfileNotice(null);
    try {
      // Students keep the department/title the server already has instead of the staff defaults in the form.
      const payload = showWorkRoleFields ? form : { ...form, department: account.department, title: account.title };
      const updated = await authApi.updateProfile(account.id, payload);
      const nextAccount: TeacherAccount = { ...account, ...updated, fullName: updated.fullName || form.fullName, phone: updated.phone || form.phone, department: payload.department, title: payload.title, avatarUrl: updated.avatarUrl || form.avatarUrl, bio: updated.bio || form.bio };
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
  return {
    account, activeTab, avatarUrl, canChangePassword, changePassword,
    completionPercent, form, initials, isLoading, isSavingPassword, isSavingProfile,
    passwordForm, passwordScore, profileNotice, saveProfile, securityNotice, setActiveTab,
    setShowPasswords, showPasswords, showWorkRoleFields, update, updatePasswordField,
  };
}
