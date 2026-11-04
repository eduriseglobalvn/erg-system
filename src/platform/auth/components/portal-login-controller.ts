import type { FormEvent } from "react";

import { getAuthScope, getCurrentAccount } from "@/platform/auth/api/auth-storage";
import type { StoredAuthSession } from "@/platform/auth/api/auth-token-storage";
import { loginStudent } from "@/platform/auth/api/student-auth-storage";
import { useAuthSession } from "@/platform/auth/hooks/use-auth-session";
import { isAuthOnlyRedirect, sanitizeLocalRedirect } from "@/platform/auth/utils/auth-redirects";
import { hasAdminLikeClaims } from "@/platform/auth/permissions/admin-like";
import { PLATFORM_ROOT_ADMIN_EMAIL, projectVerifiedWorkspaces } from "@/platform/auth/permissions/workspace-capability-projection";
import { resolveWorkspaceLandingTarget } from "@/platform/auth/utils/access-denied";
import { canAccessPortal } from "@/platform/auth/utils/portal-access";
import { ApiClientError } from "@/lib/api-client";
import { adminPath, teacherPath } from "@/platform/workspaces/workspace-paths";
import { canonicalWorkspaceForPath } from "@/platform/workspaces/workspace-route";
import type { Workspace } from "@/platform/workspaces/workspace-domain";
import type { TeacherAccount } from "@/platform/auth/types/auth-types";

type PortalKey = NonNullable<StoredAuthSession["portal"]>;
type AuthSession = ReturnType<typeof useAuthSession>;

export async function safely(auth: AuthSession, run: () => unknown | Promise<unknown>, onAccessDenied?: () => void) {
  try {
    await run();
  } catch (error) {
    if (isAccessDeniedError(error) && onAccessDenied) {
      onAccessDenied();
      return;
    }
    auth.setNotice({ tone: "error", message: getFriendlyAuthErrorMessage(error, "Không thể đăng nhập tài khoản này.") });
  }
}

export function handleLoginSubmit(
  event: FormEvent<HTMLFormElement>,
  auth: AuthSession,
  portal: PortalKey,
  redirect: string,
  navigateTo: (path: string) => void,
  options?: LoginRedirectOptions,
) {
  event.preventDefault();
  void safely(auth, async () => {
    const account = await auth.actions.login(portal);
    redirectAfterAuth(account ?? getCurrentAccount(portal), portal, redirect, navigateTo, options);
  });
}

export function handleRegisterSubmit(
  event: FormEvent<HTMLFormElement>,
  auth: AuthSession,
  portal: PortalKey,
  redirect: string,
  navigateTo: (path: string) => void,
  options?: LoginRedirectOptions,
) {
  event.preventDefault();
  void safely(auth, async () => {
    const account = await auth.actions.register(portal);
    redirectAfterAuth(account ?? getCurrentAccount(portal), portal, redirect, navigateTo, options);
  });
}

export function handleStudentLoginSubmit(event: FormEvent<HTMLFormElement>, auth: AuthSession, redirect: string, navigateTo: (path: string) => void, setNotice: (notice: AuthSession["notice"]) => void) {
  event.preventDefault();
  void (async () => {
    try {
      const session = await loginStudent({ email: auth.loginForm.email, password: auth.loginForm.password, rememberMe: auth.rememberMe });
      setNotice({ tone: "success", message: `Chào ${session.name}, đang chuyển vào Student Workspace.` });
      navigateTo(redirect);
    } catch (error) {
      setNotice({ tone: "error", message: getFriendlyAuthErrorMessage(error, "Không thể đăng nhập tài khoản học sinh này.") });
    }
  })();
}

export type LoginRedirectOptions = {
  hasExplicitRedirect?: boolean;
  session?: StoredAuthSession | null;
};

export function redirectAfterAuth(
  account: AuthSession["account"],
  portal: PortalKey,
  redirect: string,
  navigateTo: (path: string) => void,
  options: LoginRedirectOptions = {},
) {
  const session = options.session ?? getAuthScope(portal).session;
  const destination = options.hasExplicitRedirect === false
    ? resolveDefaultPostLoginRedirect(account, portal, session)
    : redirect;
  const targetPortal = portalForRedirect(destination, portal);
  const teacherSession = getAuthScope(targetPortal).session ?? session;
  const canAccessTarget = canAccessPortal({ portal: targetPortal, teacherAccount: account, teacherSession });
  navigateTo(canAccessTarget || isAuthOnlyRedirect(targetPortal, destination)
    ? destination
    : accessDeniedPath(targetPortal, account?.email ?? "", destination));
}

const LOCKED_CODES = new Set(["ACCOUNT_LOCKED", "AUTH_ACCOUNT_LOCKED"]);
const TOO_MANY_CODES = new Set(["AUTH_TOO_MANY_ATTEMPTS", "RATE_LIMITED"]);

/** "Thử lại sau X phút" when the backend put retry seconds in the error details; empty otherwise. */
function retryHint(details: unknown) {
  const seconds = details && typeof details === "object"
    ? Number((details as Record<string, unknown>).retryAfterSeconds ?? (details as Record<string, unknown>).retry_after_seconds)
    : NaN;
  return Number.isFinite(seconds) && seconds > 0 ? ` Thử lại sau ${Math.ceil(seconds / 60)} phút.` : "";
}

export function getFriendlyAuthErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiClientError) {
    if (error.status === 0 || error.code === "NETWORK_ERROR" || error.code === "API_BASE_MISSING") {
      return "Chưa kết nối được máy chủ ERG. Vui lòng kiểm tra kết nối mạng rồi thử lại.";
    }
    if (LOCKED_CODES.has(error.code) || error.status === 423) {
      return `Tài khoản đang tạm khóa do đăng nhập sai nhiều lần.${retryHint(error.details) || " Vui lòng thử lại sau ít phút hoặc liên hệ quản trị viên để được mở khóa."}`;
    }
    if (TOO_MANY_CODES.has(error.code) || error.status === 429) {
      return `Bạn đã thử đăng nhập quá nhiều lần.${retryHint(error.details) || " Vui lòng thử lại sau ít phút."}`;
    }
    if (error.status === 401) return "Email hoặc mật khẩu chưa đúng. Vui lòng kiểm tra lại thông tin đăng nhập.";
    if (error.code === "AUTH_LOGIN_IN_PROGRESS") return "Một tab khác đang xử lý đăng nhập cho tài khoản này. Vui lòng chờ một chút rồi thử lại.";
    return error.message || fallback;
  }
  if (error instanceof TypeError && error.message.toLowerCase().includes("fetch")) {
    return "Chưa kết nối được máy chủ ERG. Vui lòng kiểm tra kết nối mạng rồi thử lại.";
  }
  if (error instanceof Error) return error.message || fallback;
  return fallback;
}

export function googleEmailFromIdToken(idToken?: string) {
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

export function sanitizeRedirect(value: string | null, fallback = "/") {
  return !value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\") ? fallback : value;
}

export function defaultPortalRedirect(portal: PortalKey) {
  if (portal === "lcms") return adminPath("/content/resources");
  if (portal === "lms") return teacherPath("/home");
  return "/";
}

export function resolveDefaultPostLoginRedirect(
  account: TeacherAccount | null | undefined,
  portal: PortalKey,
  session: StoredAuthSession | null = getAuthScope(portal).session,
) {
  // Keep the dedicated portal defaults for an explicit Admin/Student login;
  // workspace inference is needed for the shared LMS login only.
  if (portal === "lcms" || portal === "admin" || portal === "elearning") return defaultPortalRedirect(portal);

  const preferredWorkspace = preferredWorkspaceForLogin(portal, account, session);
  const workspaces = projectVerifiedWorkspaces({
    accountEmail: account?.email ?? session?.accountEmail,
    workspaces: session?.workspaces,
    roles: session?.roles,
    permissions: session?.permissions,
    deniedPermissions: session?.deniedPermissions,
    portals: session?.portals,
  });
  const landingTarget = resolveWorkspaceLandingTarget({
    preferredWorkspace,
    workspaces,
    roles: session?.roles,
    permissions: session?.permissions,
    deniedPermissions: session?.deniedPermissions,
    portals: session?.portals,
  });

  return landingTarget?.path ?? defaultPortalRedirect(portal);
}

export function accessDeniedPath(portal: PortalKey, email: string, redirect: string) {
  return `/access-denied?${new URLSearchParams({ portal, email, redirect }).toString()}`;
}

function preferredWorkspaceForLogin(
  portal: PortalKey,
  account: TeacherAccount | null | undefined,
  session: StoredAuthSession | null,
): Workspace | undefined {
  if (portal === "lcms" || portal === "admin") return "ADMIN";
  if (portal === "elearning") return "STUDENT";

  const roles = [...(account?.roles ?? []), ...(session?.roles ?? [])].map((role) => role.trim().toLowerCase());
  const adminLike = account?.role === "admin"
    || account?.email.trim().toLowerCase() === PLATFORM_ROOT_ADMIN_EMAIL
    || hasAdminLikeClaims(roles, session?.permissions);

  if (adminLike) return "ADMIN";

  const workspaces = projectVerifiedWorkspaces({
    accountEmail: account?.email ?? session?.accountEmail,
    workspaces: session?.workspaces,
    roles: session?.roles,
    permissions: session?.permissions,
    deniedPermissions: session?.deniedPermissions,
    portals: session?.portals,
  });
  if (workspaces.includes("TEACHER")) return "TEACHER";
  if (workspaces.includes("STUDENT")) return "STUDENT";
  if (workspaces.includes("ADMIN")) return "ADMIN";
  return undefined;
}

function portalForRedirect(redirect: string, fallback: PortalKey): PortalKey {
  const workspace = canonicalWorkspaceForPath(sanitizeLocalRedirect(redirect) ?? redirect);
  if (workspace === "ADMIN") return "lcms";
  if (workspace === "TEACHER") return "lms";
  if (workspace === "STUDENT") return "elearning";
  return fallback;
}

function isAccessDeniedError(error: unknown) {
  if (!(error instanceof ApiClientError)) return false;
  if (LOCKED_CODES.has(error.code)) return false;
  const code = error.code.toLowerCase();
  return error.status === 403 || code.includes("forbidden") || code.includes("denied") || code.includes("permission");
}
