import { useState, type FormEvent, type ReactNode } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import {
  BarChart3,
  BookOpenCheck,
  ClipboardCheck,
  FileText,
  GraduationCap,
  KeyRound,
  LibraryBig,
  Presentation,
  School,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

import { ERG_ASSETS } from "@/config/seo";
import { getCurrentAccount } from "@/features/auth/api/auth-storage";
import {
  readStoredAuthSession,
  type StoredAuthSession,
} from "@/features/auth/api/auth-token-storage";
import { getCurrentStudentSession, loginStudent } from "@/features/auth/api/student-auth-storage";
import { AuthFormPanel } from "@/features/auth/components/auth-form-panel";
import { PortalMobileLoginShell } from "@/features/auth/components/portal-mobile-login-shell";
import { useAuthSession } from "@/features/auth/hooks/use-auth-session";
import { buildRedirectPath, isAuthOnlyRedirect } from "@/features/auth/utils/auth-redirects";
import { canAccessPortal } from "@/features/auth/utils/portal-access";
import { normalizeSsoReturnTo } from "@/features/auth/utils/sso-return-to";
import { useIsMobile } from "@/hooks/use-mobile";
import { ApiClientError } from "@/lib/api-client";
import { cn } from "@/lib/utils";

type PortalKey = NonNullable<StoredAuthSession["portal"]>;
type AuthSession = ReturnType<typeof useAuthSession>;

type PortalAuthGateProps = {
  children: ReactNode;
  portal: PortalKey;
};

type PortalLoginPageProps = {
  portal: PortalKey;
  badge?: string;
  title?: string;
  description?: string;
};

type PortalVisualItem = {
  label: string;
  caption: string;
  icon: LucideIcon;
};

type PortalMetric = {
  label: string;
  value: string;
  icon: LucideIcon;
};

type PortalLoginCopy = {
  badge: string;
  mobileLabel: string;
  title: string;
  description: string;
  formTitle: string;
  formSubtitle: string;
  formFootnote?: string;
  credentialLabel: string;
  credentialPlaceholder: string;
  allowGoogle: boolean;
  allowRegister: boolean;
  visualKicker: string;
  visualTitle: string;
  visualDescription: string;
  trustItems: PortalVisualItem[];
  metrics: PortalMetric[];
};

export function PortalAuthGate({ children, portal }: PortalAuthGateProps) {
  const auth = useAuthSession();
  const location = useLocation();
  const redirect = buildRedirectPath(location.pathname, location.search, location.hash);
  const studentSession = getCurrentStudentSession();
  const teacherSession = readStoredAuthSession(portal) ?? readStoredAuthSession();

  if (canAccessPortal({ portal, studentSession, teacherAccount: auth.account, teacherSession })) {
    if (needsOnboarding(auth.account)) {
      return (
        <PortalLoginShell copy={getPortalLoginCopy(portal)}>
          <NoticeBanner notice={auth.notice} />
          <OnboardingPanel auth={auth} />
        </PortalLoginShell>
      );
    }

    return <>{children}</>;
  }

  if (auth.account) {
    return <Navigate replace to={accessDeniedPath(portal, auth.account.email, redirect)} />;
  }

  // Cross-portal SSO: if we're on HocLieu and not logged in, try to get a token from LMS.
  // Use a sessionStorage flag to prevent infinite redirect loops.
  if (portal === "hoclieu" && typeof window !== "undefined") {
    const currentHost = window.location.host.toLowerCase();
    const isOnHocLieu = currentHost.startsWith("hoclieu.");
    const ssoAttempted = window.sessionStorage.getItem("sso-attempted");
    if (isOnHocLieu && !ssoAttempted) {
      window.sessionStorage.setItem("sso-attempted", "1");
      const returnTo = normalizeSsoReturnTo(window.location.href) ?? window.location.href;
      const lmsHandoffUrl = `${window.location.protocol}//lms.erg.edu.vn:3001/sso-handoff?returnTo=${encodeURIComponent(returnTo)}`;
      window.location.replace(lmsHandoffUrl);
      return null;
    }
  }

  return <Navigate replace to={`/login?redirect=${encodeURIComponent(redirect)}`} />;
}

export function AuthenticatedAccountGate({ children }: { children: ReactNode }) {
  const auth = useAuthSession();
  const location = useLocation();
  const redirect = buildRedirectPath(location.pathname, location.search, location.hash);

  if (auth.account) {
    return <>{children}</>;
  }

  if (typeof window !== "undefined") {
    const currentHost = window.location.host.toLowerCase();
    const isOnHocLieu = currentHost.startsWith("hoclieu.");
    const ssoAttempted = window.sessionStorage.getItem("sso-attempted");
    if (isOnHocLieu && !ssoAttempted) {
      window.sessionStorage.setItem("sso-attempted", "1");
      const returnTo = normalizeSsoReturnTo(window.location.href) ?? window.location.href;
      const lmsHandoffUrl = `${window.location.protocol}//lms.erg.edu.vn:3001/sso-handoff?returnTo=${encodeURIComponent(returnTo)}`;
      window.location.replace(lmsHandoffUrl);
      return null;
    }
  }

  return <Navigate replace to={`/login?redirect=${encodeURIComponent(redirect)}`} />;
}

export function PortalLoginPage({ badge, description, portal, title }: PortalLoginPageProps) {
  const auth = useAuthSession();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [studentNotice, setStudentNotice] = useState<AuthSession["notice"] | null>(null);
  const redirect = sanitizeRedirect(new URLSearchParams(location.search).get("redirect"), defaultPortalRedirect(portal));
  const copy = getPortalLoginCopy(portal);
  const resolvedCopy = {
    ...copy,
    badge: badge ?? copy.badge,
    title: title ?? copy.title,
    description: description ?? copy.description,
  };
  const studentSession = getCurrentStudentSession();
  const teacherSession = readStoredAuthSession(portal) ?? readStoredAuthSession();

  if (canAccessPortal({ portal, studentSession, teacherAccount: auth.account, teacherSession })) {
    return <Navigate replace to={redirect} />;
  }
  if (portal !== "elearning" && auth.account && isAuthOnlyRedirect(portal, redirect)) {
    return <Navigate replace to={redirect} />;
  }
  if (portal !== "elearning" && auth.account) {
    return <Navigate replace to={accessDeniedPath(portal, auth.account.email, redirect)} />;
  }

  return (
    <PortalLoginShell copy={resolvedCopy}>
      <NoticeBanner notice={portal === "elearning" ? studentNotice : auth.notice} />
      <AuthFormPanel
        mode={auth.mode}
        rememberMe={auth.rememberMe}
        showPassword={auth.showPassword}
        loginForm={auth.loginForm}
        registerForm={auth.registerForm}
        onModeChange={auth.setMode}
        onRememberMeChange={auth.setRememberMe}
        onShowPasswordToggle={() => auth.setShowPassword((current) => !current)}
        onLoginFormChange={auth.setLoginForm}
        onRegisterFormChange={auth.setRegisterForm}
        onLoginSubmit={(event) =>
          portal === "elearning"
            ? handleStudentLoginSubmit(event, auth, redirect, (path) => navigate(path, { replace: true }), setStudentNotice)
            : handleLoginSubmit(event, auth, portal, redirect, (path) => navigate(path, { replace: true }))
        }
        onRegisterSubmit={(event) =>
          handleRegisterSubmit(event, auth, portal, redirect, (path) => navigate(path, { replace: true }))
        }
        onForgotPassword={() => {
          if (portal === "elearning") {
            setStudentNotice({
              tone: "info",
              message: "Tài khoản học sinh chỉ được cấp bởi nhà trường hoặc ERG. Nếu quên mật khẩu, vui lòng liên hệ giáo viên phụ trách.",
            });
            return;
          }
          auth.actions.forgotPassword();
        }}
        onProviderLogin={(provider, idToken) =>
          void safely(
            auth,
            async () => {
              const account = await auth.actions.loginByProvider(provider, idToken);
              redirectAfterAuth(account ?? getCurrentAccount(), portal, redirect, (path) => navigate(path, { replace: true }));
            },
            () => navigate(accessDeniedPath(portal, googleEmailFromIdToken(idToken) || auth.loginForm.email, redirect), { replace: true }),
          )
        }
        allowGoogle={resolvedCopy.allowGoogle}
        allowRegister={resolvedCopy.allowRegister}
        credentialLabel={resolvedCopy.credentialLabel}
        credentialPlaceholder={resolvedCopy.credentialPlaceholder}
        loginFootnote={resolvedCopy.formFootnote}
        loginSubtitle={resolvedCopy.formSubtitle}
        loginTitle={resolvedCopy.formTitle}
        mobileVariant={isMobile}
      />
    </PortalLoginShell>
  );
}

export function TeacherPortalAuthGate({ children }: Omit<PortalAuthGateProps, "portal">) {
  return <PortalAuthGate portal="lms">{children}</PortalAuthGate>;
}

export function StudentPortalAuthGate({ children }: Omit<PortalAuthGateProps, "portal">) {
  return <PortalAuthGate portal="elearning">{children}</PortalAuthGate>;
}

function needsOnboarding(account: AuthSession["account"]) {
  return account?.isProfileCompleted === false;
}

async function safely(auth: AuthSession, run: () => unknown | Promise<unknown>, onAccessDenied?: () => void) {
  try {
    await run();
  } catch (error) {
    if (isAccessDeniedError(error) && onAccessDenied) {
      onAccessDenied();
      return;
    }

    auth.setNotice({
      tone: "error",
      message: error instanceof Error ? error.message : "Không thể đăng nhập tài khoản này.",
    });
  }
}

function handleLoginSubmit(
  event: FormEvent<HTMLFormElement>,
  auth: AuthSession,
  portal: PortalKey,
  redirect: string,
  navigateTo: (path: string) => void,
) {
  event.preventDefault();
  void safely(auth, async () => {
    const account = await auth.actions.login();
    redirectAfterAuth(account ?? getCurrentAccount(), portal, redirect, navigateTo);
  });
}

function handleRegisterSubmit(
  event: FormEvent<HTMLFormElement>,
  auth: AuthSession,
  portal: PortalKey,
  redirect: string,
  navigateTo: (path: string) => void,
) {
  event.preventDefault();
  void safely(auth, async () => {
    const account = await auth.actions.register();
    redirectAfterAuth(account ?? getCurrentAccount(), portal, redirect, navigateTo);
  });
}

function handleStudentLoginSubmit(
  event: FormEvent<HTMLFormElement>,
  auth: AuthSession,
  redirect: string,
  navigateTo: (path: string) => void,
  setNotice: (notice: AuthSession["notice"]) => void,
) {
  event.preventDefault();
  void (async () => {
    try {
      const session = await loginStudent({
        email: auth.loginForm.email,
        password: auth.loginForm.password,
        rememberMe: auth.rememberMe,
      });
      setNotice({
        tone: "success",
        message: `Chào ${session.name}, đang chuyển vào Elearning.`,
      });
      navigateTo(redirect);
    } catch (error) {
      setNotice({
        tone: "error",
        message: error instanceof Error ? error.message : "Không thể đăng nhập tài khoản học sinh này.",
      });
    }
  })();
}

function redirectAfterAuth(
  account: AuthSession["account"],
  portal: PortalKey,
  redirect: string,
  navigateTo: (path: string) => void,
) {
  navigateTo(
    canAccessPortal({
      portal,
      teacherAccount: account,
      teacherSession: readStoredAuthSession(portal) ?? readStoredAuthSession(),
    }) || isAuthOnlyRedirect(portal, redirect)
      ? redirect
      : accessDeniedPath(portal, account?.email ?? "", redirect),
  );
}

function isAccessDeniedError(error: unknown) {
  if (error instanceof ApiClientError) {
    const code = error.code.toLowerCase();
    return error.status === 403 || code.includes("forbidden") || code.includes("denied") || code.includes("permission");
  }

  return false;
}

function googleEmailFromIdToken(idToken?: string) {
  if (!idToken || typeof window === "undefined") return "";

  try {
    const payload = idToken.split(".")[1];
    if (!payload) return "";
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const claims = JSON.parse(window.atob(padded)) as { email?: unknown };
    return typeof claims.email === "string" ? claims.email : "";
  } catch {
    return "";
  }
}

function sanitizeRedirect(value: string | null, fallback = "/") {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return fallback;
  return value;
}

function defaultPortalRedirect(portal: PortalKey) {
  if (portal === "hoclieu") return "/kho-hoc-lieu";
  return "/";
}

function accessDeniedPath(portal: PortalKey, email: string, redirect: string) {
  return `/access-denied?${new URLSearchParams({ portal, email, redirect }).toString()}`;
}

function getPortalLoginCopy(portal: PortalKey): PortalLoginCopy {
  switch (portal) {
    case "elearning":
      return {
        badge: "Elearning Portal",
        mobileLabel: "Cổng học sinh ERG",
        title: "Cổng bài tập học sinh",
        description: "Đăng nhập bằng tài khoản học sinh được ERG cấp để làm bài, xem tiến độ và tiếp tục lớp học trực tuyến.",
        formTitle: "Đăng nhập Elearning",
        formSubtitle: "Chỉ sử dụng tài khoản học sinh do ERG hoặc nhà trường cấp.",
        formFootnote: "Tài khoản học sinh chỉ có quyền vào Elearning. Nếu quên mật khẩu, vui lòng liên hệ giáo viên phụ trách hoặc quản trị viên trường.",
        credentialLabel: "Mã học sinh hoặc email",
        credentialPlaceholder: "Ví dụ: HS001 hoặc email ERG",
        allowGoogle: false,
        allowRegister: false,
        visualKicker: "Student workspace",
        visualTitle: "Một nơi để học sinh nhận bài, làm bài và theo dõi tiến độ.",
        visualDescription: "Elearning tập trung vào trải nghiệm học sinh: ít thao tác, vào lớp nhanh và không lẫn với khu quản trị giáo viên.",
        trustItems: [
          { label: "Tài khoản được cấp", caption: "Không tự đăng ký", icon: KeyRound },
          { label: "Chỉ vào Elearning", caption: "Đúng quyền học sinh", icon: ShieldCheck },
          { label: "Theo dõi tiến độ", caption: "Bài tập và kết quả", icon: BarChart3 },
        ],
        metrics: [
          { label: "Bài tập", value: "Làm bài", icon: ClipboardCheck },
          { label: "Lớp học", value: "Theo lớp", icon: School },
          { label: "Tiến độ", value: "Cá nhân", icon: BookOpenCheck },
        ],
      };
    case "hoclieu":
      return {
        badge: "Học liệu Portal",
        mobileLabel: "Kho học liệu ERG",
        title: "Kho học liệu giáo viên",
        description: "Đăng nhập tài khoản giáo viên có quyền để mở sách mềm, giáo án, bài giảng, quiz bank và tài nguyên giảng dạy ERG.",
        formTitle: "Đăng nhập kho học liệu",
        formSubtitle: "Dành cho giáo viên và nhân sự được cấp quyền truy cập học liệu.",
        formFootnote: "Nếu tài khoản chưa có quyền vào kho học liệu, vui lòng liên hệ quản trị viên ERG để được cấp quyền theo trường hoặc vai trò.",
        credentialLabel: "Email giáo viên",
        credentialPlaceholder: "teacher@erg.edu.vn",
        allowGoogle: true,
        allowRegister: false,
        visualKicker: "Teaching resource library",
        visualTitle: "Tài nguyên dạy học được gom đúng lớp, đúng môn và đúng định dạng.",
        visualDescription: "Học liệu ưu tiên thao tác của giáo viên trước tiết dạy: tìm nhanh, mở nhanh, xem đúng viewer và không lẫn với LMS.",
        trustItems: [
          { label: "Theo trường được cấp", caption: "Phân quyền giáo viên", icon: School },
          { label: "Viewer bảo mật", caption: "Ẩn link tài nguyên", icon: ShieldCheck },
          { label: "Đúng định dạng file", caption: "PDF, PPTX, Video", icon: FileText },
        ],
        metrics: [
          { label: "Sách mềm", value: "PDF", icon: LibraryBig },
          { label: "Bài giảng", value: "PPTX", icon: Presentation },
          { label: "Đánh giá", value: "Quiz", icon: ClipboardCheck },
        ],
      };
    case "lms":
    default:
      return {
        badge: "LMS Portal",
        mobileLabel: "LMS giáo viên ERG",
        title: "Quản lý lớp học ERG",
        description: "Đăng nhập tài khoản giáo viên để quản lý lớp, theo dõi học sinh, xem báo cáo và điều phối hoạt động học tập.",
        formTitle: "Đăng nhập LMS",
        formSubtitle: "Dành cho giáo viên, điều phối viên và quản trị viên được cấp quyền.",
        formFootnote: "Quyền truy cập LMS được cấp theo vai trò và trường phụ trách. Tài khoản không đúng quyền sẽ không vào được hệ thống.",
        credentialLabel: "Email nội bộ",
        credentialPlaceholder: "teacher@erg.edu.vn",
        allowGoogle: true,
        allowRegister: false,
        visualKicker: "Teacher operations",
        visualTitle: "Một bảng điều khiển cho lớp học, học sinh và báo cáo vận hành.",
        visualDescription: "LMS là khu làm việc của giáo viên: quản lý lớp, theo dõi tiến độ, xem dữ liệu học tập và phối hợp với trường.",
        trustItems: [
          { label: "Phân quyền vai trò", caption: "Giáo viên, admin", icon: KeyRound },
          { label: "Theo trường phụ trách", caption: "Không lẫn dữ liệu", icon: School },
          { label: "Báo cáo học tập", caption: "Theo dõi kết quả", icon: BarChart3 },
        ],
        metrics: [
          { label: "Lớp học", value: "Quản lý", icon: School },
          { label: "Học sinh", value: "Theo dõi", icon: GraduationCap },
          { label: "Báo cáo", value: "Dữ liệu", icon: BarChart3 },
        ],
      };
  }
}

function PortalLoginShell({ children, copy }: { children: ReactNode; copy: PortalLoginCopy }) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <PortalMobileLoginShell copy={copy}>{children}</PortalMobileLoginShell>;
  }

  return (
    <main
      className="grid min-h-svh place-items-center overflow-hidden bg-[linear-gradient(135deg,#f7fbff_0%,#eef4ff_52%,#fff8f8_100%)] px-4 py-8 text-slate-950 sm:px-6 lg:px-8"
      style={{ paddingBottom: isMobile ? 24 : undefined, paddingTop: isMobile ? 24 : undefined }}
    >
      <section
        className="grid w-full max-w-[1060px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_30px_100px_-55px_rgba(15,23,42,0.55)] lg:grid-cols-[minmax(0,1fr)_minmax(360px,430px)]"
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "minmax(0,1fr)" : undefined,
          minHeight: isMobile ? "auto" : undefined,
          width: "100%",
        }}
      >
        {!isMobile ? (
        <aside className="relative hidden min-h-[620px] overflow-hidden bg-[linear-gradient(155deg,var(--erg-blue)_0%,#2435a7_52%,#a3134f_130%)] p-8 text-white lg:block">
          <div className="absolute left-10 top-16 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute bottom-10 right-8 h-36 w-36 rounded-full bg-red-300/20 blur-3xl" />
          <div className="relative z-10 flex h-full flex-col">
            <img alt="ERG" className="h-12 w-fit rounded-lg bg-white px-3 py-2 object-contain" src={ERG_ASSETS.logo} />

            <div className="mt-8 inline-flex w-fit rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-white/85">
              {copy.badge}
            </div>
            <h1 className="mt-5 max-w-xl text-4xl font-black leading-tight tracking-tight text-white">
              {copy.title}
            </h1>
            <p className="mt-4 max-w-lg text-base leading-7 text-white/78">{copy.description}</p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {copy.trustItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="rounded-xl border border-white/12 bg-white/10 px-4 py-4 shadow-[0_18px_38px_-30px_rgba(0,0,0,0.5)] backdrop-blur">
                    <Icon className="h-5 w-5 text-white" />
                    <p className="mt-3 text-xs font-black text-white">{item.label}</p>
                    <p className="mt-1 text-[11px] font-semibold text-white/58">{item.caption}</p>
                  </div>
                );
              })}
            </div>

            <div className="mt-7 rounded-2xl border border-white/12 bg-white/12 p-5 shadow-[0_24px_60px_-36px_rgba(0,0,0,0.55)] backdrop-blur">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/50">{copy.visualKicker}</p>
              <h2 className="mt-3 max-w-md text-2xl font-black leading-tight text-white">{copy.visualTitle}</h2>
              <p className="mt-3 text-sm leading-6 text-white/68">{copy.visualDescription}</p>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {copy.metrics.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="rounded-xl bg-white px-4 py-3 text-slate-950">
                      <Icon className="h-4 w-4 text-[var(--erg-red)]" />
                      <p className="mt-3 text-xl font-black">{item.value}</p>
                      <p className="mt-1 text-xs font-bold text-slate-500">{item.label}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </aside>
        ) : null}

        <div
          className="flex min-h-[620px] items-center bg-white px-5 py-6 sm:px-8"
          style={{ minHeight: isMobile ? "auto" : undefined, padding: isMobile ? "20px 16px 24px" : undefined }}
        >
          <div className="mx-auto w-full max-w-[420px]">
            <div
              className="mb-6 flex items-center gap-3 lg:hidden"
              style={{ alignItems: "center", display: "flex", gap: 12, marginBottom: 20 }}
            >
              <img alt="ERG" className="h-11 w-auto object-contain" src={ERG_ASSETS.logo} style={{ height: 42, width: "auto", objectFit: "contain" }} />
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--erg-blue)]" style={{ color: "var(--erg-blue)", fontSize: 10, fontWeight: 900, letterSpacing: "0.2em", textTransform: "uppercase" }}>{copy.badge}</p>
                <p className="text-sm font-bold text-slate-500" style={{ color: "#64748b", fontSize: 14, fontWeight: 700, marginTop: 4 }}>{copy.mobileLabel}</p>
              </div>
            </div>
            {children}
          </div>
        </div>
      </section>
    </main>
  );
}

function NoticeBanner({ notice }: { notice: AuthSession["notice"] }) {
  if (!notice) return null;

  return (
    <div
      className={cn(
        "mb-4 rounded-xl border px-4 py-3 text-sm font-medium shadow-sm",
        notice.tone === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : notice.tone === "error"
            ? "border-rose-200 bg-rose-50 text-rose-700"
            : "border-blue-200 bg-blue-50 text-blue-700",
      )}
    >
      {notice.message}
    </div>
  );
}

function OnboardingPanel({ auth }: { auth: AuthSession }) {
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void safely(auth, () => auth.actions.saveProfile());
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-blue-700">
        Onboarding
      </div>
      <h2 className="mt-4 text-2xl font-black tracking-tight text-slate-950">Hoàn tất hồ sơ trước khi vào LMS</h2>
      <p className="mt-2 text-sm leading-7 text-slate-500">
        Lần đầu đăng nhập cần có họ tên và số điện thoại để admin ERG quản lý phân quyền, hỗ trợ tài khoản và đối soát lớp học.
      </p>

      <form className="mt-6 space-y-4" onSubmit={submit}>
        <label className="grid gap-2 text-sm font-bold text-slate-700">
          Họ và tên
          <input
            className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
            required
            value={auth.profileForm.fullName}
            onChange={(event) => auth.setProfileForm({ ...auth.profileForm, fullName: event.target.value })}
          />
        </label>
        <label className="grid gap-2 text-sm font-bold text-slate-700">
          Số điện thoại
          <input
            className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
            inputMode="tel"
            required
            value={auth.profileForm.phone}
            onChange={(event) => auth.setProfileForm({ ...auth.profileForm, phone: event.target.value })}
          />
        </label>
        <label className="grid gap-2 text-sm font-bold text-slate-700">
          Chức danh
          <input
            className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
            value={auth.profileForm.title}
            onChange={(event) => auth.setProfileForm({ ...auth.profileForm, title: event.target.value })}
          />
        </label>
        <button
          className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-slate-950 px-5 text-sm font-black text-white transition hover:bg-slate-800"
          type="submit"
        >
          Lưu và tiếp tục
        </button>
      </form>
    </div>
  );
}

export function NoPermissionNotice({ accountEmail, portal }: { accountEmail: string; portal: PortalKey }) {
  return (
    <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800 shadow-sm">
      Tài khoản {accountEmail} chưa có quyền truy cập {portal}. Vui lòng đăng nhập bằng tài khoản được cấp quyền.
    </div>
  );
}
