import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { TEACHER_LOCAL_SESSION_KEY, TEACHER_TEMP_SESSION_KEY } from "./platform/auth/api/auth-token-storage";
import { hydrateSessionFromCookie } from "./platform/auth/api/cross-domain-session";
import App from "./App";
import { injectFontDisplaySwap } from "./config/fonts";

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
