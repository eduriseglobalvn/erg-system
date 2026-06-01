import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

import { getStoredAccessToken } from "@/platform/auth/api/auth-token-storage";
import { normalizeSsoReturnTo } from "@/platform/auth/utils/sso-return-to";

/**
 * SSO handoff page loaded on the source portal, for example LMS.
 *
 * Flow:
 * 1. A target portal redirects to `/sso-handoff?returnTo=<target-url>`.
 * 2. This page checks if the user is logged in on the source portal.
 * 3. If logged in, it redirects to returnTo with sso_token appended.
 * 4. If not logged in, it redirects to login and then back to this handoff page.
 */
export function SsoHandoffPage() {
  const [params] = useSearchParams();
  const returnTo = params.get("returnTo");

  useEffect(() => {
    if (!returnTo) return;

    const normalizedReturnTo = normalizeSsoReturnTo(returnTo);
    if (!normalizedReturnTo) {
      console.warn("[SSO] Invalid returnTo URL:", returnTo);
      return;
    }

    const token = getStoredAccessToken();
    if (token) {
      // User is logged in; redirect to target portal with token.
      const url = new URL(normalizedReturnTo);
      url.searchParams.set("sso_token", token);
      window.location.replace(url.toString());
    } else {
      // User is not logged in; redirect to login, then come back here.
      const selfUrl = window.location.href;
      window.location.replace(`/login?redirect=${encodeURIComponent(selfUrl)}`);
    }
  }, [returnTo]);

  return (
    <div className="grid min-h-svh place-items-center bg-slate-50">
      <div className="text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-[var(--erg-blue)]" />
        <p className="mt-4 text-sm text-slate-500">Đang chuyển tiếp đăng nhập...</p>
      </div>
    </div>
  );
}
