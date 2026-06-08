import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";

import {
  AUTH_ACCOUNT_CHANGED_EVENT,
  getCurrentAccount,
  logoutAccount,
  providerLabel,
  saveServerAuthSession,
} from "@/platform/auth/api/auth-storage";
import { authApi } from "@/platform/auth/api/auth-api";
import { clearTeacherSessionSnapshot, readStoredAuthSession, resolveCurrentPortal } from "@/platform/auth/api/auth-token-storage";
import { requestGoogleIdToken } from "@/platform/auth/api/google-identity";
import { logoutStudentSession } from "@/platform/auth/api/student-auth-storage";
import { useI18n } from "@/platform/i18n";
import { usePacedStateBatch } from "@/hooks/use-paced-state-batch";
import { AUTH_SESSION_INVALID_EVENT, AUTH_SESSION_REPLACED_EVENT, hasApiBase } from "@/lib/api-client";
import type {
  AccountTab,
  AuthMode,
  LoginFormState,
  Notice,
  PasswordFormState,
  ProfileFormState,
  RegisterFormState,
  TeacherAccount,
} from "@/platform/auth/types/auth-types";
import type { StoredAuthSession } from "@/platform/auth/api/auth-token-storage";

const defaultLoginForm: LoginFormState = {
  email: "",
  password: "",
};

const defaultRegisterForm: RegisterFormState = {
  fullName: "",
  email: "",
  department: "",
  password: "",
  confirmPassword: "",
};

const defaultProfileForm: ProfileFormState = {
  fullName: "",
  phone: "",
  department: "",
  title: "",
};

const defaultPasswordForm: PasswordFormState = {
  currentPassword: "",
  nextPassword: "",
  confirmPassword: "",
};

function createProfileForm(account: TeacherAccount | null): ProfileFormState {
  if (!account) return defaultProfileForm;

  return {
    fullName: account.fullName,
    phone: account.phone ?? "",
    department: account.department,
    title: account.title,
  };
}

export function useAuthSession(portal: StoredAuthSession["portal"] = resolveCurrentPortal()) {
  const { t } = useI18n();
  const paceStateUpdate = usePacedStateBatch();
  const [mode, setMode] = useState<AuthMode>("login");
  const [accountTab, setAccountTab] = useState<AccountTab>("profile");
  const [account, setAccount] = useState<TeacherAccount | null>(() => getCurrentAccount(portal));
  const [notice, setNotice] = useState<Notice | null>(null);
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loginForm, setLoginForm] = useState<LoginFormState>(defaultLoginForm);
  const [registerForm, setRegisterForm] = useState<RegisterFormState>(defaultRegisterForm);
  const [profileForm, setProfileForm] = useState<ProfileFormState>(() => createProfileForm(getCurrentAccount(portal)));
  const [passwordForm, setPasswordForm] = useState<PasswordFormState>(defaultPasswordForm);
  const loginMutation = useMutation({
    mutationKey: ["auth", "login"],
    mutationFn: authApi.login,
  });
  const registerMutation = useMutation({
    mutationKey: ["auth", "register"],
    mutationFn: authApi.register,
  });
  const providerLoginMutation = useMutation({
    mutationKey: ["auth", "provider-login"],
    mutationFn: ({ provider, rememberMe, idToken, portal }: { provider: "google"; rememberMe: boolean; idToken: string; portal: "admin" | "crm" | "lcms" | "lms" }) =>
      authApi.loginWithProvider(provider, rememberMe, idToken, portal),
  });
  const profileMutation = useMutation({
    mutationKey: ["auth", "profile"],
    mutationFn: ({ accountId, nextProfileForm }: { accountId: string; nextProfileForm: ProfileFormState }) =>
      authApi.updateProfile(accountId, nextProfileForm),
  });
  const passwordMutation = useMutation({
    mutationKey: ["auth", "password"],
    mutationFn: ({ accountId, currentPassword, nextPassword }: { accountId: string; currentPassword: string; nextPassword: string }) =>
      authApi.updatePassword(accountId, { currentPassword, nextPassword }),
  });
  const logoutMutation = useMutation({
    mutationKey: ["auth", "logout"],
    mutationFn: authApi.logout,
  });
  const [isHydratingProfile, setIsHydratingProfile] = useState(false);
  const hydratingProfileRef = useRef(false);

  useEffect(() => {
    function handleAuthAccountChanged() {
      const nextAccount = getCurrentAccount(portal);
      setAccount(nextAccount);
      setProfileForm(createProfileForm(nextAccount));
      if (!nextAccount) {
        setAccountTab("profile");
      }
    }

    window.addEventListener(AUTH_ACCOUNT_CHANGED_EVENT, handleAuthAccountChanged);
    return () => window.removeEventListener(AUTH_ACCOUNT_CHANGED_EVENT, handleAuthAccountChanged);
  }, [portal]);

  useEffect(() => {
    if (account || hydratingProfileRef.current || isHydratingProfile || !hasApiBase()) return;
    const teacherSession = readStoredAuthSession(portal);
    if (!teacherSession?.accessToken) return;

    let isCancelled = false;
    hydratingProfileRef.current = true;
    paceStateUpdate(() => {
      if (!isCancelled) setIsHydratingProfile(true);
    });

    authApi.profile()
      .then((profile) => {
        if (isCancelled) return;
        const nextAccount = saveServerAuthSession({ account: profile }, true, portal);
        setAccount(nextAccount);
        setProfileForm(createProfileForm(nextAccount));
        setAccountTab("profile");
      })
      .catch(() => {
        if (isCancelled) return;
        logoutAccount();
        setAccount(null);
        setProfileForm(defaultProfileForm);
      })
      .finally(() => {
        hydratingProfileRef.current = false;
        if (!isCancelled) setIsHydratingProfile(false);
      });

    return () => {
      isCancelled = true;
      hydratingProfileRef.current = false;
    };
  }, [account, isHydratingProfile, paceStateUpdate, portal]);

  useEffect(() => {
    function handleSessionReplaced() {
      logoutAccount();
      setAccount(null);
      setProfileForm(defaultProfileForm);
      setAccountTab("profile");
      pushNotice({
        tone: "info",
        message: "Tài khoản đã được đăng nhập trên thiết bị khác. Vui lòng đăng nhập lại.",
      });
    }

    function handleSessionInvalid() {
      logoutAccount();
      setAccount(null);
      setProfileForm(defaultProfileForm);
      setAccountTab("profile");
      pushNotice({
        tone: "info",
        message: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
      });
    }

    window.addEventListener(AUTH_SESSION_REPLACED_EVENT, handleSessionReplaced);
    window.addEventListener(AUTH_SESSION_INVALID_EVENT, handleSessionInvalid);
    return () => {
      window.removeEventListener(AUTH_SESSION_REPLACED_EVENT, handleSessionReplaced);
      window.removeEventListener(AUTH_SESSION_INVALID_EVENT, handleSessionInvalid);
    };
  }, []);

  const accountCapabilities = useMemo(
    () =>
      account?.features ?? [
        t("auth.heroSubtitle"),
        t("auth.accountInfoSubtitle"),
        t("auth.accountSecuritySubtitle"),
        t("auth.viewStudentUiCaption"),
      ],
    [account, t],
  );

  function pushNotice(nextNotice: Notice) {
    setNotice(nextNotice);
  }

  async function login(portal: StoredAuthSession["portal"] = "lms") {
    if (!hasApiBase()) {
      throw new Error("API chưa được cấu hình nên không thể đăng nhập bằng tài khoản thật.");
    }

    const nextAccount = saveServerAuthSession(
      await loginMutation.mutateAsync({
        email: loginForm.email,
        password: loginForm.password,
        rememberMe,
        portal: portal === "elearning" ? "lms" : portal,
      }),
      rememberMe,
      portal,
    );

    setAccount(nextAccount);
    setProfileForm(createProfileForm(nextAccount));
    setAccountTab("profile");
    pushNotice({
      tone: "success",
      message: t("auth.noticeWelcomeBack", { name: nextAccount.fullName }),
    });

    return nextAccount;
  }

  async function register(portal: StoredAuthSession["portal"] = "lms") {
    if (!registerForm.fullName.trim() || !registerForm.email.trim() || !registerForm.department.trim()) {
      throw new Error(t("auth.errorMissingRegisterFields"));
    }

    if (registerForm.password.length < 8) {
      throw new Error(t("auth.errorPasswordMin"));
    }

    if (registerForm.password !== registerForm.confirmPassword) {
      throw new Error(t("auth.errorPasswordConfirmMismatch"));
    }

    if (!hasApiBase()) {
      throw new Error("API chưa được cấu hình nên không thể đăng ký tài khoản thật.");
    }

    await registerMutation.mutateAsync({
      email: registerForm.email,
      fullName: registerForm.fullName,
      password: registerForm.password,
      department: "ERG",
    });

    const nextAccount = saveServerAuthSession(
      await loginMutation.mutateAsync({
        email: registerForm.email,
        password: registerForm.password,
        rememberMe: true,
        portal: portal === "elearning" ? "lms" : portal,
      }),
      true,
      portal,
    );

    setAccount(nextAccount);
    setProfileForm(createProfileForm(nextAccount));
    setMode("login");
    setAccountTab("profile");
    setRegisterForm(defaultRegisterForm);
    pushNotice({ tone: "success", message: t("auth.noticeCreatedAndLoggedIn") });

    return nextAccount;
  }

  async function loginByProvider(provider: "google", providedIdToken?: string, loginPortal: StoredAuthSession["portal"] = portal) {
    if (!hasApiBase()) {
      throw new Error("API chưa được cấu hình nên không thể đăng nhập bằng nhà cung cấp ngoài.");
    }

    const idToken = providedIdToken ?? (await requestGoogleIdToken());
    const targetPortal = loginPortal === "elearning" ? "lms" : loginPortal ?? "lms";
    const nextAccount = saveServerAuthSession(
      await providerLoginMutation.mutateAsync({ provider, rememberMe, idToken, portal: targetPortal }),
      rememberMe,
      targetPortal,
    );
    setAccount(nextAccount);
    setProfileForm(createProfileForm(nextAccount));
    setAccountTab("profile");
    pushNotice({
      tone: "success",
      message: t("auth.noticeProviderLogin", { provider: providerLabel(provider) }),
    });

    return nextAccount;
  }

  function forgotPassword() {
    pushNotice({
      tone: "info",
      message: t("auth.noticeForgotPassword"),
    });
  }

  async function saveProfile() {
    if (!account) return;

    if (!hasApiBase()) {
      throw new Error("API chưa được cấu hình nên không thể cập nhật hồ sơ thật.");
    }

    const nextAccount = saveServerAuthSession(
      {
        account: await profileMutation.mutateAsync({ accountId: account.id, nextProfileForm: profileForm }),
      },
      true,
      portal,
    );
    setAccount(nextAccount);
    setProfileForm(createProfileForm(nextAccount));
    pushNotice({ tone: "success", message: t("auth.noticeProfileUpdated") });
  }

  async function savePassword() {
    if (!account) return;

    if (passwordForm.nextPassword.length < 8) {
      throw new Error(t("auth.errorPasswordMin"));
    }

    if (passwordForm.nextPassword !== passwordForm.confirmPassword) {
      throw new Error(t("auth.errorNewPasswordConfirmMismatch"));
    }

    if (!hasApiBase()) {
      throw new Error("API chưa được cấu hình nên không thể đổi mật khẩu thật.");
    }

    const nextAccount = saveServerAuthSession(
      {
        account: await passwordMutation.mutateAsync({
          accountId: account.id,
          currentPassword: passwordForm.currentPassword,
          nextPassword: passwordForm.nextPassword,
        }),
      },
      true,
      portal,
    );
    setAccount(nextAccount);
    setProfileForm(createProfileForm(nextAccount));
    setPasswordForm(defaultPasswordForm);
    pushNotice({ tone: "success", message: t("auth.noticePasswordUpdated") });
  }

  function signOut() {
    void logoutMutation.mutateAsync().catch(() => undefined);
    clearTeacherSessionSnapshot();
    logoutStudentSession();
    logoutAccount();
    setAccount(null);
    setProfileForm(defaultProfileForm);
    setAccountTab("profile");
    pushNotice({ tone: "info", message: t("auth.noticeLoggedOut") });
  }

  return {
    mode,
    setMode,
    accountTab,
    setAccountTab,
    account,
    isHydratingProfile,
    notice,
    setNotice,
    rememberMe,
    setRememberMe,
    showPassword,
    setShowPassword,
    loginForm,
    setLoginForm,
    registerForm,
    setRegisterForm,
    profileForm,
    setProfileForm,
    passwordForm,
    setPasswordForm,
    accountCapabilities,
    actions: {
      login,
      register,
      loginByProvider,
      forgotPassword,
      saveProfile,
      savePassword,
      signOut,
    },
  };
}
