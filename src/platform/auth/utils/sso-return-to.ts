import {
  CRM_PORTAL_HOSTS,
  ELEARNING_PORTAL_HOSTS,
  LCMS_PORTAL_HOSTS,
  LMS_PORTAL_HOSTS,
} from "@/config/portal-urls";
import { sanitizeLocalRedirect } from "@/platform/auth/utils/auth-redirects";

const LOGIN_PATH = "/login";
const LOCALHOSTS = new Set(["localhost", "127.0.0.1", "::1"]);
const ALLOWED_PORTAL_HOSTS = new Set([
  ...CRM_PORTAL_HOSTS,
  ...ELEARNING_PORTAL_HOSTS,
  ...LCMS_PORTAL_HOSTS,
  ...LMS_PORTAL_HOSTS,
].map((host) => normalizeHost(host)));

export function normalizeSsoReturnTo(rawReturnTo: string) {
  let url: URL;

  try {
    url = new URL(rawReturnTo);
  } catch {
    return null;
  }

  if (!isAllowedSsoReturnUrl(url) || url.username || url.password || !isHttpProtocol(url.protocol)) {
    return null;
  }

  const nestedRedirect = getNestedLoginRedirect(url);
  if (nestedRedirect) return nestedRedirect;

  const safePath = sanitizeLocalRedirect(`${url.pathname}${url.search}${url.hash}`);
  if (!safePath) return null;
  return `${url.origin}${safePath}`;
}

export function isAllowedSsoReturnHost(hostname: string) {
  const normalized = normalizeHost(hostname);
  if (LOCALHOSTS.has(normalized)) return true;
  return [...ALLOWED_PORTAL_HOSTS].some((host) => host.split(":")[0] === normalized);
}

function isAllowedSsoReturnUrl(url: URL) {
  const normalizedHost = normalizeHost(url.host);
  return LOCALHOSTS.has(url.hostname.toLowerCase()) || ALLOWED_PORTAL_HOSTS.has(normalizedHost);
}

function getNestedLoginRedirect(url: URL) {
  if (normalizePathname(url.pathname) !== LOGIN_PATH) return null;

  const redirect = sanitizeLocalRedirect(url.searchParams.get("redirect"));
  return redirect ? `${url.origin}${redirect}` : null;
}

function normalizePathname(pathname: string) {
  const withoutTrailingSlash = pathname.replace(/\/+$/, "");
  return withoutTrailingSlash || "/";
}

function normalizeHost(hostname: string) {
  return hostname
    .trim()
    .toLowerCase()
    .replace(/^www\./, "")
    .replace("org.edu.local", "erg.edu.local")
    .replace("org.edu.vn", "erg.edu.vn");
}

function isHttpProtocol(protocol: string) {
  return protocol === "http:" || protocol === "https:";
}
