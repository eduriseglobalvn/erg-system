import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { TEACHER_LOCAL_SESSION_KEY, TEACHER_TEMP_SESSION_KEY } from "./features/auth/api/auth-token-storage";
import { hydrateSessionFromCookie } from "./features/auth/api/cross-domain-session";
import App from "./App";
import baseCssText from "./index.css?inline";
import globalCssText from "./styles/globals.css?inline";

// Run SSO hydration synchronously before React mounts.
// This picks up ?sso_token= from the URL (cross-portal handoff) or cross-domain cookies
// and writes the session to localStorage so auth guards see it on first render.
hydrateSessionFromCookie(TEACHER_LOCAL_SESSION_KEY, TEACHER_TEMP_SESSION_KEY);
injectCompiledStyles("erg-base-css", baseCssText);
injectCompiledStyles("erg-global-css", globalCssText);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

function injectCompiledStyles(styleId: string, cssText: string) {
  if (typeof document === "undefined") return;
  if (document.getElementById(styleId)) return;

  const styleElement = document.createElement("style");
  styleElement.id = styleId;
  styleElement.textContent = cssText;
  document.head.appendChild(styleElement);
}
