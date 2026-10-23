/**
 * Cross-subdomain compatibility session sharing via the legacy cookie only.
 *
 * localStorage is scoped per origin, so LMS/LCMS/CRM/Elearning hosts each have
 * separate browser storage.
 *
 * Strategy:
 * 1. Try to set a cookie on the parent domain. This works for most domains but
 *    may fail for compound TLDs like `.edu.vn` due to the Public Suffix List.
 * 2. New SSO handoff is routed through auth.erg.edu.vn. URL token handoff is
 *    intentionally disabled; ERG-092 will replace this compatibility cookie
 *    with an HttpOnly BFF session.
 *
 * Flow:
 *   Login on lms.erg.edu.local -> cookie saved + localStorage saved.
 *   Navigate to another portal -> check cookie -> if found, hydrate.
 *   If cookie not found -> redirect to the shared auth origin.
 */

import type { StoredAuthSession } from "@/platform/auth/api/auth-token-storage";

const COOKIE_NAME = "erg_sso";

type CookieSessionPayload = {
  t: string;        // accessToken
  r?: string;       // refreshToken
  e?: string;       // expiresAt
  p?: string;       // portal
  ps?: string[];    // portals
  a?: string;       // accountId
};

// ---------------------------------------------------------------------------
// Domain detection
// ---------------------------------------------------------------------------

function getParentDomain(): string {
  if (typeof window === "undefined") return "";

  const host = window.location.hostname;
  if (host === "localhost" || /^\d+\.\d+\.\d+\.\d+$/.test(host)) return "";

  const parts = host.split(".");
  if (parts.length < 3) return "";

  // For compound TLDs (edu.vn, com.vn, co.uk): use last 3 parts
  const secondLast = parts[parts.length - 2];
  if (parts.length >= 4 && ["edu", "com", "org", "net", "gov", "co", "ac"].includes(secondLast)) {
    return "." + parts.slice(-3).join(".");
  }

  return "." + parts.slice(-2).join(".");
}

// ---------------------------------------------------------------------------
// Cookie helpers
// ---------------------------------------------------------------------------

function setCookie(name: string, value: string, maxAgeSeconds: number): boolean {
  const domain = getParentDomain();
  if (!domain) return false;

  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  const cookieStr = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; domain=${domain}; SameSite=Lax${secure}`;

  if (cookieStr.length > 4000) {
    console.warn(`[AUTH-SSO] Cookie too large (${cookieStr.length})`);
    return false;
  }

  document.cookie = cookieStr;
  return true;
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function deleteCookie(name: string) {
  const domain = getParentDomain();
  if (domain) {
    document.cookie = `${name}=; path=/; max-age=0; domain=${domain}`;
  }
  document.cookie = `${name}=; path=/; max-age=0; path=/`;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function hasAccessToken(sessionJson: string | null): boolean {
  if (!sessionJson) return false;
  try {
    const parsed = JSON.parse(sessionJson) as { accessToken?: string };
    return Boolean(parsed?.accessToken);
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Save the current session into a cross-domain cookie.
 */
export function saveCrossDomainSession(session: {
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: string;
  portal?: StoredAuthSession["portal"];
  portals?: StoredAuthSession["portals"];
  permissions?: string[];
  accountId?: string;
}) {
  if (typeof window === "undefined" || !session.accessToken) return;

  const payload: CookieSessionPayload = {
    t: session.accessToken,
    r: session.refreshToken,
    e: session.expiresAt,
    p: session.portal,
    ps: session.portals,
    a: session.accountId,
  };

  try {
    let json = JSON.stringify(payload);
    if (json.length > 3500) {
      json = JSON.stringify({ ...payload, r: undefined });
    }
    setCookie(COOKIE_NAME, json, 30 * 24 * 60 * 60);
  } catch {
    // Ignore cookie save failures
  }
}

/**
 * Hydrate localStorage from the legacy cross-domain compatibility cookie.
 * Returns `true` if a session was hydrated.
 */
export function hydrateSessionFromCookie(
  localSessionKey: string,
  tempSessionKey: string,
): boolean {
  if (typeof window === "undefined") return false;

  // If existing session already has a valid token, skip
  if (hasAccessToken(window.localStorage.getItem(localSessionKey)) ||
      hasAccessToken(window.sessionStorage.getItem(tempSessionKey))) {
    return false;
  }

  // Try 1: URL token parameter (highest priority — this is an explicit handoff)
  // Cross-domain cookie compatibility is retained only until the BFF cutover.
  const raw = getCookie(COOKIE_NAME);
  if (raw) {
    try {
      const cookieSession = JSON.parse(raw) as CookieSessionPayload;
      if (cookieSession?.t) {
        const session = {
          accessToken: cookieSession.t,
          refreshToken: cookieSession.r,
          expiresAt: cookieSession.e,
          portal: cookieSession.p,
          portals: cookieSession.ps,
          accountId: cookieSession.a,
          rememberMe: true,
          loggedInAt: new Date().toISOString(),
        };
        window.localStorage.setItem(localSessionKey, JSON.stringify(session));
        return true;
      }
    } catch {
      // Ignore parse errors
    }
  }

  return false;
}

/**
 * Clear the cross-domain session cookie (called on logout).
 */
export function clearCrossDomainSession() {
  if (typeof window === "undefined") return;
  deleteCookie(COOKIE_NAME);
}

