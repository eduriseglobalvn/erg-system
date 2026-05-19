const LOGIN_PATH = "/login";
const LOCALHOSTS = new Set(["localhost", "127.0.0.1"]);

export function normalizeSsoReturnTo(rawReturnTo: string) {
  let url: URL;

  try {
    url = new URL(rawReturnTo);
  } catch {
    return null;
  }

  if (!isAllowedSsoReturnHost(url.hostname)) {
    return null;
  }

  const nestedRedirect = getNestedLoginRedirect(url);
  if (nestedRedirect) {
    return nestedRedirect;
  }

  return url.toString();
}

export function isAllowedSsoReturnHost(hostname: string) {
  const normalized = hostname.trim().toLowerCase();
  return normalized === "erg.edu.vn" || normalized.endsWith(".erg.edu.vn") || LOCALHOSTS.has(normalized);
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
