import {
  CRM_PORTAL_HOSTS,
  ELEARNING_PORTAL_HOSTS,
  LCMS_PORTAL_HOSTS,
  LMS_PORTAL_HOSTS,
} from "@/config/portal-urls";

const LOGIN_PATH = "/login";
const LOCALHOSTS = new Set(["localhost", "127.0.0.1"]);
const ALLOWED_PORTAL_HOSTS = new Set([
  ...CRM_PORTAL_HOSTS,
  ...ELEARNING_PORTAL_HOSTS,
  ...LCMS_PORTAL_HOSTS,
  ...LMS_PORTAL_HOSTS,
].map((host) => host.toLowerCase()));

export function normalizeSsoReturnTo(rawReturnTo: string) {
  let url: URL;

  try {
    url = new URL(rawReturnTo);
  } catch {
    return null;
  }

  if (!isAllowedSsoReturnUrl(url)) {
    return null;
  }

  const nestedRedirect = getNestedLoginRedirect(url);
  if (nestedRedirect) {
    return nestedRedirect;
  }

  return url.toString();
}

export function isAllowedSsoReturnHost(hostname: string) {
  let normalized = hostname.trim().toLowerCase();
  normalized = normalized.replace("org.edu.local", "erg.edu.local").replace("org.edu.vn", "erg.edu.vn");
  return LOCALHOSTS.has(normalized) || [...ALLOWED_PORTAL_HOSTS].some((host) => host.split(":")[0] === normalized);
}

function isAllowedSsoReturnUrl(url: URL) {
  const hostname = url.hostname.toLowerCase().replace("org.edu.local", "erg.edu.local").replace("org.edu.vn", "erg.edu.vn");
  const host = url.host.toLowerCase().replace("org.edu.local", "erg.edu.local").replace("org.edu.vn", "erg.edu.vn");
  if (LOCALHOSTS.has(hostname)) return true;
  return ALLOWED_PORTAL_HOSTS.has(host);
}

function getNestedLoginRedirect(url: URL) {
  if (normalizePathname(url.pathname) !== LOGIN_PATH) {
    return null;
  }

  const redirect = normalizeLocalRedirect(url.searchParams.get("redirect"));
  if (!redirect) {
    return null;
  }

  return new URL(redirect, url.origin).toString();
}

function normalizePathname(pathname: string) {
  const normalized = pathname.replace(/\/+$/, "");
  return normalized || "/";
}

function normalizeLocalRedirect(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return null;
  }

  return value;
}
