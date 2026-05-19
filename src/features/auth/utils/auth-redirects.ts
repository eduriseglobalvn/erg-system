type PortalKey = "hoclieu" | "lms" | "elearning";

export function buildRedirectPath(pathname: string, search = "", hash = "") {
  return `${pathname || "/"}${search}${hash}`;
}

export function isAuthOnlyRedirect(portal: PortalKey, redirect: string) {
  const pathname = localRedirectPathname(redirect);
  if (!pathname) {
    return false;
  }

  if (pathname === "/profile") {
    return portal === "hoclieu" || portal === "lms";
  }

  return portal === "hoclieu" && (pathname === "/cong-dong" || pathname.startsWith("/cong-dong/"));
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
