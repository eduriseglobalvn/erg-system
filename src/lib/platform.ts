export function isTauriRuntime() {
  if (typeof window === "undefined") {
    return false;
  }

  return Boolean("__TAURI_INTERNALS__" in window || "__TAURI__" in window);
}

export function shouldUseHashRouter() {
  if (typeof window === "undefined") {
    return false;
  }

  const protocol = window.location.protocol;
  return isTauriRuntime() || protocol === "tauri:" || protocol === "file:";
}

export function getApiBase() {
  return normalizeApiBaseForRuntime(import.meta.env.VITE_API_BASE?.trim() ?? "");
}

export function getGradingStrategy() {
  return import.meta.env.VITE_GRADING_STRATEGY?.trim() === "server-authoritative"
    ? "server-authoritative"
    : "client-first";
}

declare global {
  interface Window {
    __TAURI__?: unknown;
    __TAURI_INTERNALS__?: unknown;
  }
}

function normalizeApiBaseForRuntime(apiBase: string) {
  if (!apiBase || typeof window === "undefined") {
    return apiBase;
  }

  try {
    const configuredUrl = new URL(apiBase);
    const currentHostname = window.location.hostname.toLowerCase();
    const apiHostname = configuredUrl.hostname.toLowerCase();
    const appIsOnDeviceHost = currentHostname !== "localhost" && currentHostname !== "127.0.0.1";
    const apiIsLocalhost = apiHostname === "localhost" || apiHostname === "127.0.0.1";

    if (appIsOnDeviceHost && apiIsLocalhost) {
      return window.location.origin;
    }
  } catch {
    return apiBase;
  }

  return apiBase;
}
