import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./styles/globals.css";
import "./index.css";

import { clearStoredAuthSessions, purgeLegacyAuthStorage } from "./platform/auth/api/auth-token-storage";
import { applyUpdateOnLaunch } from "./platform/pwa/apply-update-on-launch";
import { reloadFresh } from "./platform/pwa/reload-fresh";
import { restoreRememberedStudentSession } from "./platform/auth/api/student-auth-storage";
import { initializeCrossTabAuthSync } from "./platform/auth/api/cross-tab-session";
import { isBffAuthEnabled } from "./lib/api-client";
import App from "./App";
import { injectFontDisplaySwap } from "./config/fonts";

// -- Phase 0: Development service worker cleanup to bypass caching --
if (import.meta.env.DEV && "serviceWorker" in navigator) {
  const devServiceWorkerReloadKey = "erg-dev-sw-cleaned";

  navigator.serviceWorker.getRegistrations().then(async (registrations) => {
    if (!registrations.length) {
      window.sessionStorage.removeItem(devServiceWorkerReloadKey);
      return;
    }

    await Promise.all(registrations.map((registration) => registration.unregister()));

    if (!window.sessionStorage.getItem(devServiceWorkerReloadKey)) {
      window.sessionStorage.setItem(devServiceWorkerReloadKey, "1");
      console.log("Cleared active service workers for development mode.");
      window.location.reload();
    }
  });
}

// A deploy replaces hashed chunks; reload once to pick up the new index instead of a blank route.
const PRELOAD_RELOAD_KEY = "erg-preload-reloaded";
const ROUTE_CHUNK_RELOAD_KEY = "erg-chunk-reload"; // owned/cleared by route-feedback.tsx + App.tsx
window.addEventListener("vite:preloadError", (event) => {
  try {
    // Shares a budget with RouteErrorBoundary (ROUTE_CHUNK_RELOAD_KEY): at most one chunk-error reload per window between both.
    if (window.sessionStorage.getItem(PRELOAD_RELOAD_KEY) || window.sessionStorage.getItem(ROUTE_CHUNK_RELOAD_KEY)) return;
    window.sessionStorage.setItem(PRELOAD_RELOAD_KEY, "1");
    window.sessionStorage.setItem(ROUTE_CHUNK_RELOAD_KEY, "1");
  } catch {
    return;
  }
  event.preventDefault();
  void reloadFresh();
});

// -- Phase 1: session hygiene (must happen before React mount) --
// Legacy bearer material (localStorage session, erg_sso cookie) is purged on every start; URL credentials are rejected.
function bootstrapApplication() {
  purgeLegacyAuthStorage();
  // Clean-break BFF mode must not retain bearer material in browser storage.
  if (isBffAuthEnabled()) clearStoredAuthSessions();
  // After the clear above, so it is not broadcast as a sign-out to other tabs.
  initializeCrossTabAuthSync();

  // -- Phase 2: Font display swap (prevents FOIT on slow connections) --
  injectFontDisplaySwap();

  applyUpdateOnLaunch();

  // -- Phase 3: React mount --
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );

  // Page survived 10s: allow a later deploy to trigger one more chunk-error reload (loop guard stays within a session burst).
  window.setTimeout(() => {
    try {
      window.sessionStorage.removeItem(PRELOAD_RELOAD_KEY);
    } catch {
      // storage unavailable: nothing to clear
    }
  }, 10_000);
}

// A remembered student exchanges the refresh token before first render so route gates see the session.
void restoreRememberedStudentSession().catch(() => undefined).finally(bootstrapApplication);

