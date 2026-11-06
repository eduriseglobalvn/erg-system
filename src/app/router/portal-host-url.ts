import { sanitizeLocalRedirect } from "@/platform/auth/utils/auth-redirects";

function runtimeHost(host: string) {
  if (typeof window === "undefined") return host;
  if (window.location.port === "3001" && !host.includes(":")) return `${host}:3001`;
  return host;
}

function isLocalRuntimeHost(hostname: string) {
  const normalized = hostname.toLowerCase();
  return normalized === "localhost" || normalized === "127.0.0.1" || normalized === "::1" || normalized.endsWith(".erg.edu.local");
}

/** Absolute URL of `requestedPath` on `targetHost`; the path goes through sanitizeLocalRedirect first. */
export function buildPortalHostUrl(targetHost: string, requestedPath: string, fallbackPath = "/") {
  const safePath = sanitizeLocalRedirect(requestedPath) ?? sanitizeLocalRedirect(fallbackPath) ?? "/";
  const targetUrl = new URL(`https://${runtimeHost(targetHost)}${safePath}`);
  if (typeof window !== "undefined" && isLocalRuntimeHost(window.location.hostname) && window.location.protocol !== "https:") {
    targetUrl.protocol = window.location.protocol;
  }
  return targetUrl.toString();
}
