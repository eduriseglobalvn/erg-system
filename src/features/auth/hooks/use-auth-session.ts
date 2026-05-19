import { useEffect, useMemo, useState } from "react";

import {
  AUTH_ACCOUNT_CHANGED_EVENT,
  getCurrentAccount,
  logoutAccount,
  providerLabel,
  saveServerAuthSession,
} from "@/features/auth/api/auth-storage";
import { authApi } from "@/features/auth/api/auth-api";
import { requestGoogleIdToken } from "@/features/auth/api/google-identity";
import { useI18n } from "@/features/i18n";
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
} from "@/features/auth/types/auth-types";

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

export function useAuthSession() {
  const { t } = useI18n();
  const [mode, setMode] = useState<AuthMode>("login");
  const [accountTab, setAccountTab] = useState<AccountTab>("profile");
  const [account, setAccount] = useState<TeacherAccount | null>(() => getCurrentAccount());
  const [notice, setNotice] = useState<Notice | null>(null);
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loginForm, setLoginForm] = useState<LoginFormState>(defaultLoginForm);
  const [registerForm, setRegisterForm] = useState<RegisterFormState>(defaultRegisterForm);
  const [profileForm, setProfileForm] = useState<ProfileFormState>(() => createProfileForm(getCurrentAccount()));
  const [passwordForm, setPasswordForm] = useState<PasswordFormState>(defaultPasswordForm);

  useEffect(() => {
    function handleAuthAccountChanged() {
      const nextAccount = getCurrentAccount();
      setAccount(nextAccount);
      setProfileForm(createProfileForm(nextAccount));
      if (!nextAccount) {
        setAccountTab("profile");
      }
    }

    window.addEventListener(AUTH_ACCOUNT_CHANGED_EVENT, handleAuthAccountChanged);
    return () => window.removeEventListener(AUTH_ACCOUNT_CHANGED_EVENT, handleAuthAccountChanged);
  }, []);

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

  async function login() {
    if (!hasApiBase()) {
      throw new Error("API chưa được cấu hình nên không thể đăng nhập bằng tài khoản thật.");
    }

    const nextAccount = saveServerAuthSession(
      await authApi.login({
        email: loginForm.email,
        password: loginForm.password,
        rememberMe,
      }),
      rememberMe,
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

  async function register() {
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

    const nextAccount = saveServerAuthSession(
      await registerWithApiThenLogin({
        email: registerForm.email,
        fullName: registerForm.fullName,
        password: registerForm.password,
      }),
      true,
    );

    setAccount(nextAccount);
    setProfileForm(createProfileForm(nextAccount));
    setMode("login");
    setAccountTab("profile");
    setRegisterForm(defaultRegisterForm);
    pushNotice({ tone: "success", message: t("auth.noticeCreatedAndLoggedIn") });

    return nextAccount;
  }

  async function loginByProvider(provider: "google", providedIdToken?: string) {
    if (!hasApiBase()) {
      throw new Error("API chưa được cấu hình nên không thể đăng nhập bằng nhà cung cấp ngoài.");
    }

    const idToken = providedIdToken ?? (await requestGoogleIdToken());
    const nextAccount = saveServerAuthSession(await authApi.loginWithProvider(provider, rememberMe, idToken), rememberMe);
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
        account: await authApi.updateProfile(account.id, profileForm),
      },
      true,
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
        account: await authApi.updatePassword(account.id, {
          currentPassword: passwordForm.currentPassword,
          nextPassword: passwordForm.nextPassword,
        }),
      },
      true,
    );
    setAccount(nextAccount);
    setProfileForm(createProfileForm(nextAccount));
    setPasswordForm(defaultPasswordForm);
    pushNotice({ tone: "success", message: t("auth.noticePasswordUpdated") });
  }

  function signOut() {
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

async function registerWithApiThenLogin(input: { email: string; fullName: string; password: string }) {
  await authApi.register({
    email: input.email,
    fullName: input.fullName,
    password: input.password,
    department: "ERG",
  });

  return authApi.login({
    email: input.email,
    password: input.password,
    rememberMe: true,
  });
}
