const DEVICE_ID_STORAGE_KEY = "erg-device-id";
const DEVICE_ID_COOKIE = "erg_device_id";
const DEVICE_ID_MAX_AGE_SECONDS = 365 * 24 * 60 * 60;

export function getOrCreateBrowserDeviceId() {
  const existing = readCookie(DEVICE_ID_COOKIE) || readLocalStorage(DEVICE_ID_STORAGE_KEY);
  if (existing) {
    persistDeviceId(existing);
    return existing;
  }

  const next = createRandomId("device");
  persistDeviceId(next);
  return next;
}

function persistDeviceId(deviceId: string) {
  writeLocalStorage(DEVICE_ID_STORAGE_KEY, deviceId);
  if (typeof document === "undefined" || typeof window === "undefined") return;
  const domain = parentDomain(window.location.hostname);
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  const domainPart = domain ? `; Domain=${domain}` : "";
  document.cookie = `${DEVICE_ID_COOKIE}=${encodeURIComponent(deviceId)}; Path=/; Max-Age=${DEVICE_ID_MAX_AGE_SECONDS}; SameSite=Lax${domainPart}${secure}`;
}

function parentDomain(hostname?: string) {
  const normalized = hostname?.toLowerCase() ?? "";
  if (normalized === "localhost" || normalized === "127.0.0.1" || normalized === "::1") return "";
  const parts = normalized.split(".");
  if (parts.length < 3) return "";
  const secondLast = parts.at(-2);
  if (parts.length >= 4 && secondLast && ["edu", "com", "org", "net", "gov", "co", "ac"].includes(secondLast)) {
    return `.${parts.slice(-3).join(".")}`;
  }
  return `.${parts.slice(-2).join(".")}`;
}

function readCookie(name: string) {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function readLocalStorage(key: string) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeLocalStorage(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // The parent-domain cookie still keeps browser identity stable when storage is unavailable.
  }
}

function createRandomId(prefix: string) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
