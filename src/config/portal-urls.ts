export const LCMS_PORTAL_HOST = "lcms.erg.edu.vn:3001";
export const LMS_PORTAL_HOST = "lms.erg.edu.vn:3001";
export const CRM_PORTAL_HOST = "crm.erg.edu.vn:3001";
export const ELEARNING_PORTAL_HOST = "elearning.erg.edu.vn:3001";
export const ELEARNING_VUONG_PORTAL_HOST = "elearning.vuongtran.io.vn";
export const LCMS_PORTAL_HOSTS = [LCMS_PORTAL_HOST];
export const CRM_PORTAL_HOSTS = [CRM_PORTAL_HOST];
export const ELEARNING_PORTAL_HOSTS = [ELEARNING_PORTAL_HOST, ELEARNING_VUONG_PORTAL_HOST];

export function getPortalUrl(host: string, path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const protocol = typeof window === "undefined" ? "http:" : window.location.protocol;
  return `${protocol}//${host}${normalizedPath}`;
}

export function getLmsPortalUrl(path = "/") {
  return getPortalUrl(LMS_PORTAL_HOST, path);
}

export function getCrmPortalUrl(path = "/") {
  return getPortalUrl(CRM_PORTAL_HOST, path);
}

export function getLcmsPortalUrl(path = "/") {
  return getPortalUrl(LCMS_PORTAL_HOST, path);
}

export function getElearningPortalUrl(path = "/") {
  return getPortalUrl(ELEARNING_PORTAL_HOST, path);
}

export function isPortalHost(targetHost: string | string[]) {
  if (typeof window === "undefined") return false;

  const hosts = Array.isArray(targetHost) ? targetHost : [targetHost];
  return hosts.some((host) => window.location.host.toLowerCase() === host.toLowerCase());
}

export function shouldRedirectLocalPortal(targetHost: string) {
  if (typeof window === "undefined") return false;

  const currentHost = window.location.host.toLowerCase();
  const currentHostname = window.location.hostname.toLowerCase();

  if (currentHost === targetHost) return false;

  return (
    currentHostname === "localhost" ||
    currentHostname === "127.0.0.1" ||
    currentHostname === "::1" ||
    currentHostname.endsWith(".erg.edu.local") ||
    currentHostname.endsWith(".erg.edu.vn")
  );
}
