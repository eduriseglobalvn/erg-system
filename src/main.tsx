import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./styles/globals.css";
import "./index.css";

import { TEACHER_LOCAL_SESSION_KEY, TEACHER_TEMP_SESSION_KEY } from "./platform/auth/api/auth-token-storage";
import { hydrateSessionFromCookie } from "./platform/auth/api/cross-domain-session";
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

// -- Phase 1: SSO hydration (must happen before React mount) --
// Picks up ?sso_token= from the URL (cross-portal handoff) or cross-domain cookies.
hydrateSessionFromCookie(TEACHER_LOCAL_SESSION_KEY, TEACHER_TEMP_SESSION_KEY);

// -- Phase 2: Font display swap (prevents FOIT on slow connections) --
injectFontDisplaySwap();

// -- Phase 3: React mount --
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

