import { useEffect, useState } from "react";
import {
  getCurrentElearningViewerSession,
  type ElearningViewerSession,
} from "@/platform/auth/api/elearning-viewer-session";

/** Current e-learning viewer session, refreshed when the tab regains focus or the session changes. */
export function useElearningViewerAccount() {
  const [account, setAccount] = useState<ElearningViewerSession | null>(() => getCurrentElearningViewerSession());

  useEffect(() => {
    function refreshViewerSession() {
      const nextSession = getCurrentElearningViewerSession();
      setAccount((currentSession) => {
        if (currentSession?.accessToken === nextSession?.accessToken && currentSession?.email === nextSession?.email) {
          return currentSession;
        }

        return nextSession;
      });
    }

    refreshViewerSession();
    window.addEventListener("focus", refreshViewerSession);
    window.addEventListener("storage", refreshViewerSession);
    window.addEventListener("erg-auth-session-replaced", refreshViewerSession);
    window.addEventListener("erg-auth-session-invalid", refreshViewerSession);

    return () => {
      window.removeEventListener("focus", refreshViewerSession);
      window.removeEventListener("storage", refreshViewerSession);
      window.removeEventListener("erg-auth-session-replaced", refreshViewerSession);
      window.removeEventListener("erg-auth-session-invalid", refreshViewerSession);
    };
  }, []);

  return [account, setAccount] as const;
}
