export const LCMS_PORTAL_HOST = "lcms.erg.edu.local";
export const LMS_PORTAL_HOST = "lms.erg.edu.local";
export const CRM_PORTAL_HOST = "crm.erg.edu.local";
export const ELEARNING_PORTAL_HOST = "elearning.erg.edu.local";
export const ELEARNING_VUONG_PORTAL_HOST = "elearning.vuongtran.io.vn";
export const LCMS_PORTAL_HOSTS = [LCMS_PORTAL_HOST, `${LCMS_PORTAL_HOST}:3001`];
export const LMS_PORTAL_HOSTS = [LMS_PORTAL_HOST, `${LMS_PORTAL_HOST}:3001`];
export const CRM_PORTAL_HOSTS = [CRM_PORTAL_HOST, `${CRM_PORTAL_HOST}:3001`];
export const ELEARNING_PORTAL_HOSTS = [ELEARNING_PORTAL_HOST, `${ELEARNING_PORTAL_HOST}:3001`, ELEARNING_VUONG_PORTAL_HOST];

function getRuntimePortalHost(host: string) {
  if (typeof window === "undefined") return host;
  if (window.location.port === "3001" && !host.includes(":")) return `${host}:3001`;
  return host;
}

export function getPortalUrl(host: string, path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const protocol = typeof window === "undefined" ? "http:" : window.location.protocol;
  
  let resolvedHost = host;
  if (typeof window !== "undefined") {
    const currentHostname = window.location.hostname.toLowerCase();
    if (currentHostname.endsWith(".org.edu.local")) {
      resolvedHost = resolvedHost.replace("erg.edu.local", "org.edu.local");
    } else if (currentHostname.endsWith(".org.edu.vn")) {
      resolvedHost = resolvedHost.replace("erg.edu.vn", "org.edu.vn");
    }
  }

  return `${protocol}//${getRuntimePortalHost(resolvedHost)}${normalizedPath}`;
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
  const currentHost = window.location.host.toLowerCase();
  const currentHostname = window.location.hostname.toLowerCase();

  return hosts.some((host) => {
    let normalizedHost = host.toLowerCase();
    if (currentHostname.endsWith(".org.edu.local")) {
      normalizedHost = normalizedHost.replace("erg.edu.local", "org.edu.local");
    } else if (currentHostname.endsWith(".org.edu.vn")) {
      normalizedHost = normalizedHost.replace("erg.edu.vn", "org.edu.vn");
    }
    return currentHost === normalizedHost || currentHostname === normalizedHost;
  });
}

export function shouldRedirectLocalPortal(targetHost: string) {
  if (typeof window === "undefined") return false;

  const currentHost = window.location.host.toLowerCase();
  const currentHostname = window.location.hostname.toLowerCase();

  let resolvedTargetHost = targetHost;
  if (currentHostname.endsWith(".org.edu.local")) {
    resolvedTargetHost = resolvedTargetHost.replace("erg.edu.local", "org.edu.local");
  } else if (currentHostname.endsWith(".org.edu.vn")) {
    resolvedTargetHost = resolvedTargetHost.replace("erg.edu.vn", "org.edu.vn");
  }

  const runtimeTargetHost = getRuntimePortalHost(resolvedTargetHost).toLowerCase();

  if (currentHost === runtimeTargetHost || currentHostname === resolvedTargetHost.toLowerCase()) return false;

  return (
    currentHostname === "localhost" ||
    currentHostname === "127.0.0.1" ||
    currentHostname === "::1" ||
    currentHostname.endsWith(".erg.edu.local") ||
    currentHostname.endsWith(".erg.edu.vn") ||
    currentHostname.endsWith(".org.edu.local") ||
    currentHostname.endsWith(".org.edu.vn")
  );
}
