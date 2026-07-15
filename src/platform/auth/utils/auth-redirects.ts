type PortalKey = "admin" | "crm" | "lcms" | "lms" | "elearning";

export function buildRedirectPath(pathname: string, search = "", hash = "") {
  return `${pathname || "/"}${search}${hash}`;
}

export function buildLoginRedirectTarget(pathname: string, search = "", hash = "") {
  if (pathname === "/login") return null;

  const redirect = buildRedirectPath(pathname, search, hash);
  return `/login?redirect=${encodeURIComponent(redirect)}`;
}

export function isAuthOnlyRedirect(portal: PortalKey, redirect: string) {
  const pathname = localRedirectPathname(redirect);
  if (!pathname) {
    return false;
  }

  if (pathname === "/profile") {
    return portal === "admin" || portal === "crm" || portal === "lcms" || portal === "lms";
  }

  return false;
}

function localRedirectPathname(redirect: string) {
  if (!redirect.startsWith("/") || redirect.startsWith("//")) {
    return "";
  }

  try {
    return new URL(redirect, "https://erg.local").pathname;
  } catch {
    return "";
  }
}
