type PortalKey = "admin" | "crm" | "lcms" | "lms" | "elearning";

/** Query keys that are useful for an ERG deep link and safe to carry to login. */
export const SAFE_REDIRECT_QUERY_KEYS = new Set([
  "tab",
  "view",
  "page",
  "size",
  "search",
  "q",
  "topic",
  "status",
  "sort",
  "filter",
  "mode",
  "date",
  "from",
  "to",
  "schoolId",
  "classId",
  "studentId",
  "subjectId",
  "levelId",
  "topicId",
  "categoryId",
  "educationUnitId",
  "assignmentId",
  "quizId",
  "contentId",
]);

const SENSITIVE_REDIRECT_QUERY_KEYS = new Set([
  "access_token",
  "accessToken",
  "refresh_token",
  "refreshToken",
  "id_token",
  "idToken",
  "token",
  "jwt",
  "sso_token",
  "code",
  "state",
  "redirect",
  "returnTo",
]);

const SAFE_REDIRECT_PATH_PREFIXES = [
  "/",
  "/admin",
  "/teacher",
  "/student",
  "/crm",
  "/home",
  "/resources",
  "/profile",
  "/calendar",
  "/homework",
  "/classes",
  "/question-types",
  "/cong-dong",
  "/portfolio",
  "/quizzes",
  "/kho-hoc-lieu",
  "/chuong-trinh",
  "/schools",
];

export function buildRedirectPath(pathname: string, search = "", hash = "") {
  return sanitizeLocalRedirect(`${pathname || "/"}${search}${hash}`) ?? "/";
}

export function buildLoginRedirectTarget(pathname: string, search = "", hash = "") {
  if (normalizePathname(pathname) === "/login") return null;

  const redirect = buildRedirectPath(pathname, search, hash);
  return `/login?redirect=${encodeURIComponent(redirect)}`;
}

/**
 * Keep only an internal, allowlisted return target. This function is shared by
 * router guards, cross-workspace redirects and SSO normalization so no caller
 * can accidentally copy a token-bearing or cross-origin URL.
 */
export function sanitizeLocalRedirect(raw: string | null | undefined): string | null {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\")) return null;

  try {
    const url = new URL(raw, "https://erg.local");
    if (url.username || url.password || !isSafeRedirectPath(url.pathname)) return null;

    const safeSearch = new URLSearchParams();
    for (const [key, value] of url.searchParams.entries()) {
      if (SENSITIVE_REDIRECT_QUERY_KEYS.has(key)) continue;
      if (!SAFE_REDIRECT_QUERY_KEYS.has(key)) continue;
      safeSearch.append(key, value);
    }

    const pathname = normalizePathname(url.pathname);
    const search = safeSearch.toString();
    const hash = sanitizeHash(url.hash);
    return `${pathname}${search ? `?${search}` : ""}${hash}`;
  } catch {
    return null;
  }
}

export function sanitizeSearch(search: string): string {
  const safeSearch = new URLSearchParams();
  for (const [key, value] of new URLSearchParams(search.startsWith("?") ? search.slice(1) : search).entries()) {
    if (SENSITIVE_REDIRECT_QUERY_KEYS.has(key) || !SAFE_REDIRECT_QUERY_KEYS.has(key)) continue;
    safeSearch.append(key, value);
  }
  const serialized = safeSearch.toString();
  return serialized ? `?${serialized}` : "";
}

export function isAuthOnlyRedirect(portal: PortalKey, redirect: string) {
  const pathname = localRedirectPathname(redirect);
  if (!pathname) return false;

  if (pathname === "/profile") {
    return portal === "admin" || portal === "crm" || portal === "lcms" || portal === "lms";
  }

  return false;
}

function localRedirectPathname(redirect: string) {
  const safe = sanitizeLocalRedirect(redirect);
  if (!safe) return "";

  try {
    return new URL(safe, "https://erg.local").pathname;
  } catch {
    return "";
  }
}

function isSafeRedirectPath(pathname: string) {
  const normalized = normalizePathname(pathname);
  return SAFE_REDIRECT_PATH_PREFIXES.some(
    (prefix) => normalized === prefix || (prefix !== "/" && normalized.startsWith(`${prefix}/`)),
  );
}

function normalizePathname(pathname: string) {
  const normalized = pathname.replace(/\/+/g, "/");
  const withoutTrailingSlash = normalized.replace(/\/+$/, "");
  return withoutTrailingSlash || "/";
}

function sanitizeHash(hash: string) {
  if (!hash) return "";
  return /(?:access[_-]?token|refresh[_-]?token|sso[_-]?token|id[_-]?token|jwt|secret)/i.test(hash) ? "" : hash;
}
