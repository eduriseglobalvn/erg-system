import { useState, type FormEvent, type ReactNode } from "react";
import { Navigate, useLocation, useNavigate } from "@/routes/router-compat";
import { useForm } from "@tanstack/react-form";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  TextField,
  Typography,
  Alert,
  Fade,
} from "@mui/material";
import {
  BarChartRounded as BarChart3,
  MenuBookRounded as BookOpenCheck,
  FactCheckRounded as ClipboardCheck,
  SchoolRounded as GraduationCap,
  KeyRounded as KeyRound,
  LocalLibraryRounded as LibraryBig,
  PresentToAllRounded as Presentation,
  School,
  VerifiedUserRounded as ShieldCheck,
} from "@mui/icons-material";

import { ERG_ASSETS } from "@/config/seo";
import { getCurrentAccount } from "@/platform/auth/api/auth-storage";
import {
  readStoredAuthSession,
  type StoredAuthSession,
} from "@/platform/auth/api/auth-token-storage";
import { getCurrentStudentSession, loginStudent } from "@/platform/auth/api/student-auth-storage";
import { AuthFormPanel } from "@/platform/auth/components/auth-form-panel";
import { PortalMobileLoginShell } from "@/platform/auth/components/portal-mobile-login-shell";
import { useAuthSession } from "@/platform/auth/hooks/use-auth-session";
import { buildRedirectPath, isAuthOnlyRedirect } from "@/platform/auth/utils/auth-redirects";
import { canAccessPortal } from "@/platform/auth/utils/portal-access";
import { useIsMobile } from "@/hooks/use-mobile";
import { ApiClientError } from "@/lib/api-client";
import { TsForm } from "@/components/ui/tanstack-form";

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
  icon: React.ElementType;
};

type PortalMetric = {
  label: string;
  value: string;
  icon: React.ElementType;
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
  const auth = useAuthSession(portal);
  const location = useLocation();
  const redirect = buildRedirectPath(location.pathname, location.search, location.hash);
  const studentSession = getCurrentStudentSession();
  const teacherAccount = portal === "elearning" ? getCurrentAccount("lms") ?? getCurrentAccount("lcms") : auth.account;
  const teacherSession = portal === "elearning"
    ? readStoredAuthSession("lms") ?? readStoredAuthSession("lcms") ?? readStoredAuthSession(portal)
    : readStoredAuthSession(portal);

  if (canAccessPortal({ portal, studentSession, teacherAccount, teacherSession })) {
    if (needsOnboarding(teacherAccount)) {
      return (
        <PortalLoginShell copy={getPortalLoginCopy(portal)}>
          <NoticeBanner notice={auth.notice} />
          <OnboardingPanel auth={auth} />
        </PortalLoginShell>
      );
    }

    return <>{children}</>;
  }

  if (teacherAccount) {
    return <Navigate replace to={accessDeniedPath(portal, teacherAccount.email, redirect)} />;
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

  return <Navigate replace to={`/login?redirect=${encodeURIComponent(redirect)}`} />;
}

export function PortalLoginPage({ badge, description, portal, title }: PortalLoginPageProps) {
  const auth = useAuthSession(portal);
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
  const teacherAccount = portal === "elearning" ? getCurrentAccount("lms") ?? getCurrentAccount("lcms") : auth.account;
  const teacherSession = portal === "elearning"
    ? readStoredAuthSession("lms") ?? readStoredAuthSession("lcms") ?? readStoredAuthSession(portal)
    : readStoredAuthSession(portal);

  if (canAccessPortal({ portal, studentSession, teacherAccount, teacherSession })) {
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
              const account = await auth.actions.loginByProvider(provider, idToken, portal);
              redirectAfterAuth(account ?? getCurrentAccount(portal), portal, redirect, (path) => navigate(path, { replace: true }));
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
      message: getFriendlyAuthErrorMessage(error, "Không thể đăng nhập tài khoản này."),
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
    const account = await auth.actions.login(portal);
    redirectAfterAuth(account ?? getCurrentAccount(portal), portal, redirect, navigateTo);
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
    const account = await auth.actions.register(portal);
    redirectAfterAuth(account ?? getCurrentAccount(portal), portal, redirect, navigateTo);
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
        message: getFriendlyAuthErrorMessage(error, "Không thể đăng nhập tài khoản học sinh này."),
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
      teacherSession: readStoredAuthSession(portal),
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

function getFriendlyAuthErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiClientError) {
    if (error.status === 0 || error.code === "NETWORK_ERROR" || error.code === "API_BASE_MISSING") {
      return "Chưa kết nối được máy chủ ERG. Vui lòng kiểm tra API/backend hoặc cấu hình môi trường rồi thử lại.";
    }

    if (error.status === 401) {
      return "Email hoặc mật khẩu chưa đúng. Vui lòng kiểm tra lại thông tin đăng nhập.";
    }

    return error.message || fallback;
  }

  if (error instanceof TypeError && error.message.toLowerCase().includes("fetch")) {
    return "Chưa kết nối được máy chủ ERG. Vui lòng kiểm tra API/backend hoặc cấu hình môi trường rồi thử lại.";
  }

  if (error instanceof Error) {
    return error.message || fallback;
  }

  return fallback;
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

function validateRequired(value: string, label: string) {
  return value.trim() ? undefined : `${label} là bắt buộc.`;
}

function defaultPortalRedirect(portal: PortalKey) {
  if (portal === "lcms") return "/resources";
  if (portal === "admin" || portal === "crm") return "/";
  return "/";
}

function accessDeniedPath(portal: PortalKey, email: string, redirect: string) {
  return `/access-denied?${new URLSearchParams({ portal, email, redirect }).toString()}`;
}

function getPortalLoginCopy(portal: PortalKey): PortalLoginCopy {
  switch (portal) {
    case "admin":
    case "crm":
      return {
        badge: "CRM Portal",
        mobileLabel: "Quản trị ERG",
        title: "Quản trị hệ thống ERG",
        description: "Đăng nhập tài khoản quản trị để quản lý dữ liệu nguồn, trường/trung tâm, tài khoản, câu hỏi, quiz bank và học liệu xuất bản.",
        formTitle: "Đăng nhập CRM",
        formSubtitle: "Chỉ dành cho quản trị viên hệ thống hoặc tài khoản được cấp quyền CRM.",
        formFootnote: "Tài khoản giáo viên thường không thể vào CRM. Nếu cần quyền quản trị, vui lòng liên hệ quản trị viên ERG.",
        credentialLabel: "Email quản trị",
        credentialPlaceholder: "admin@erg.edu.vn",
        allowGoogle: true,
        allowRegister: false,
        visualKicker: "System back office",
        visualTitle: "Một nơi quản lý dữ liệu nguồn, phân quyền và xuất bản học liệu cho toàn hệ thống.",
        visualDescription: "CRM tách khỏi workflow giáo viên để tránh lẫn thao tác dạy học hằng ngày với quản trị dữ liệu nguồn.",
        trustItems: [
          { label: "Phân quyền chặt", caption: "CRM-only", icon: KeyRound },
          { label: "Dữ liệu nguồn", caption: "Câu hỏi, quiz, học liệu", icon: ShieldCheck },
          { label: "Quản lý hệ thống", caption: "Trường, lớp, tài khoản", icon: BarChart3 },
        ],
        metrics: [
          { label: "Câu hỏi", value: "Bank", icon: ClipboardCheck },
          { label: "Học liệu", value: "Publish", icon: LibraryBig },
          { label: "Tài khoản", value: "ACL", icon: School },
        ],
      };
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
    case "lcms":
      return {
        badge: "LCMS Portal",
        mobileLabel: "LCMS ERG",
        title: "Quản trị nội dung học tập",
        description: "Đăng nhập tài khoản được cấp quyền để quản lý ngân hàng câu hỏi, quiz bank, học liệu, taxonomy và xuất bản nội dung cho LMS.",
        formTitle: "Đăng nhập LCMS",
        formSubtitle: "Dành cho đội vận hành nội dung, học liệu và quản trị viên được cấp quyền LCMS/LMS.",
        formFootnote: "LCMS dùng quyền LMS đã gộp, nhưng được tách portal để không lẫn với kho học liệu giáo viên.",
        credentialLabel: "Email nội bộ",
        credentialPlaceholder: "admin@erg.edu.vn",
        allowGoogle: true,
        allowRegister: false,
        visualKicker: "Learning content management",
        visualTitle: "Một nơi quản trị nội dung nguồn trước khi đưa sang lớp học.",
        visualDescription: "LCMS tập trung vào biên soạn, phân loại, kiểm duyệt và xuất bản nội dung học tập; không phải CRM và cũng không phải kho mở tài liệu của giáo viên.",
        trustItems: [
          { label: "Nội dung nguồn", caption: "Question, quiz, học liệu", icon: LibraryBig },
          { label: "Xuất bản có kiểm soát", caption: "Metadata, taxonomy", icon: ShieldCheck },
          { label: "Dùng quyền LMS", caption: "Không tách account", icon: KeyRound },
        ],
        metrics: [
          { label: "Câu hỏi", value: "Bank", icon: ClipboardCheck },
          { label: "Quiz", value: "Author", icon: Presentation },
          { label: "Học liệu", value: "Publish", icon: LibraryBig },
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
      className="relative grid min-h-screen overflow-hidden bg-[#dfeeff] bg-cover bg-center px-4 py-6 text-[#1C252E] sm:px-6"
      style={{ backgroundImage: "url('https://media.erg.edu.vn/logo/bg.jpg')" }}
    >
      <div className="pointer-events-none absolute inset-0 bg-white/10" />

      <section className="relative z-10 mx-auto flex w-full max-w-[460px] flex-col justify-center">
        <div className="rounded-[24px] border border-white/55 bg-white/32 p-5 shadow-[0_30px_90px_rgba(72,81,156,0.20)] backdrop-blur-2xl sm:p-7">
          <header className="mb-7 grid justify-items-center text-center">
            <img alt="ERG" className="h-auto w-28 object-contain drop-shadow-[0_12px_26px_rgba(72,81,156,0.16)]" src={ERG_ASSETS.logo} />
          </header>
          {children}
        </div>
      </section>
    </main>
  );
}

function NoticeBanner({ notice }: { notice: AuthSession["notice"] }) {
  if (!notice) return null;

  return (
    <Fade in>
      <Alert
        severity={notice.tone === "success" ? "success" : notice.tone === "error" ? "error" : "info"}
        sx={{
          mb: 2.5,
          borderRadius: 1.5,
          fontSize: 14,
          "& .MuiAlert-icon": {
            fontSize: 20,
          },
          ...(notice.tone === "success" && {
            bgcolor: "rgba(34,197,94,0.08)",
            border: "1px solid rgba(34,197,94,0.2)",
            color: "#15803D",
            "& .MuiAlert-icon": { color: "#15803D" },
          }),
          ...(notice.tone === "error" && {
            bgcolor: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.2)",
            color: "#B91C1C",
            "& .MuiAlert-icon": { color: "#B91C1C" },
          }),
          ...(notice.tone === "info" && {
            bgcolor: "rgba(0,184,217,0.08)",
            border: "1px solid rgba(0,184,217,0.2)",
            color: "#007A8C",
            "& .MuiAlert-icon": { color: "#007A8C" },
          }),
        }}
      >
        {notice.message}
      </Alert>
    </Fade>
  );
}

function OnboardingPanel({ auth }: { auth: AuthSession }) {
  const form = useForm({
    defaultValues: auth.profileForm,
    onSubmit: () => {
      void safely(auth, () => auth.actions.saveProfile());
    },
  });

  return (
    <Card
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        boxShadow: "none",
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Chip
          label="Onboarding"
          size="small"
          sx={{
            bgcolor: "rgba(105,108,255,0.1)",
            color: "#696CFF",
            fontSize: 11,
            fontWeight: 600,
            height: 24,
          }}
        />
        <Typography
          sx={{
            mt: 2,
            fontSize: 18,
            fontWeight: 600,
            color: "#242424",
          }}
        >
          Hoàn tất hồ sơ trước khi vào LMS
        </Typography>
        <Typography
          sx={{
            mt: 1,
            fontSize: 14,
            color: "#64748b",
            lineHeight: 1.6,
          }}
        >
          Lần đầu đăng nhập cần có họ tên và số điện thoại để admin ERG quản lý phân quyền, hỗ trợ tài khoản và đối soát lớp học.
        </Typography>

        <TsForm
          className="mt-3 flex flex-col gap-2.5"
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            void form.handleSubmit();
          }}
        >
          <form.Field
            name="fullName"
            validators={{
              onChange: ({ value }) => validateRequired(value, "Họ và tên"),
            }}
          >
            {(field) => (
              <Box>
                <Typography
                  component="label"
                  sx={{
                    display: "block",
                    fontSize: 14,
                    fontWeight: 500,
                    color: "#374151",
                    mb: 1,
                  }}
                >
                  Họ và tên
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => {
                    field.handleChange(event.target.value);
                    auth.setProfileForm({ ...auth.profileForm, fullName: event.target.value });
                  }}
                  error={!!field.state.meta.errors.length}
                  helperText={field.state.meta.errors[0]}
                  placeholder="Nhập họ và tên"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 1.5,
                      "& fieldset": { borderColor: "#D1D5DB" },
                      "&:hover fieldset": { borderColor: "#9CA3AF" },
                      "&.Mui-focused fieldset": { borderColor: "#696CFF" },
                    },
                  }}
                />
              </Box>
            )}
          </form.Field>
          <form.Field
            name="phone"
            validators={{
              onChange: ({ value }) => validateRequired(value, "Số điện thoại"),
            }}
          >
            {(field) => (
              <Box>
                <Typography
                  component="label"
                  sx={{
                    display: "block",
                    fontSize: 14,
                    fontWeight: 500,
                    color: "#374151",
                    mb: 1,
                  }}
                >
                  Số điện thoại
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  inputMode="tel"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => {
                    field.handleChange(event.target.value);
                    auth.setProfileForm({ ...auth.profileForm, phone: event.target.value });
                  }}
                  error={!!field.state.meta.errors.length}
                  helperText={field.state.meta.errors[0]}
                  placeholder="Nhập số điện thoại"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 1.5,
                      "& fieldset": { borderColor: "#D1D5DB" },
                      "&:hover fieldset": { borderColor: "#9CA3AF" },
                      "&.Mui-focused fieldset": { borderColor: "#696CFF" },
                    },
                  }}
                />
              </Box>
            )}
          </form.Field>
          <Box>
            <Typography
              component="label"
              sx={{
                display: "block",
                fontSize: 14,
                fontWeight: 500,
                color: "#374151",
                mb: 1,
              }}
            >
              Chức danh
            </Typography>
            <TextField
              fullWidth
              size="small"
              value={auth.profileForm.title}
              onChange={(event) => auth.setProfileForm({ ...auth.profileForm, title: event.target.value })}
              placeholder="Nhập chức danh (tùy chọn)"
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 1.5,
                  "& fieldset": { borderColor: "#D1D5DB" },
                  "&:hover fieldset": { borderColor: "#9CA3AF" },
                  "&.Mui-focused fieldset": { borderColor: "#696CFF" },
                },
              }}
            />
          </Box>
          <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
            {([canSubmit, isSubmitting]) => (
              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={!canSubmit || isSubmitting}
                sx={{
                  mt: 1,
                  height: 44,
                  borderRadius: 1.5,
                  fontSize: 14,
                  fontWeight: 600,
                  textTransform: "none",
                  bgcolor: "#1C252E",
                  "&:hover": { bgcolor: "#374151" },
                }}
              >
                Lưu và tiếp tục
              </Button>
            )}
          </form.Subscribe>
        </TsForm>
      </CardContent>
    </Card>
  );
}

export function NoPermissionNotice({ accountEmail, portal }: { accountEmail: string; portal: PortalKey }) {
  return (
    <Alert
      severity="warning"
      sx={{
        mb: 2.5,
        borderRadius: 1.5,
        fontSize: 14,
        bgcolor: "rgba(255,171,0,0.1)",
        border: "1px solid rgba(255,171,0,0.2)",
        color: "#B76E00",
        "& .MuiAlert-icon": { color: "#B76E00" },
      }}
    >
      Tài khoản {accountEmail} chưa có quyền truy cập {portal}. Vui lòng đăng nhập bằng tài khoản được cấp quyền.
    </Alert>
  );
}
