import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

import { getStoredAccessToken } from "@/features/auth/api/auth-token-storage";
import { normalizeSsoReturnTo } from "@/features/auth/utils/sso-return-to";

/**
 * SSO Handoff page — This page is loaded on the "source" portal (e.g. LMS).
 *
 * Flow:
 * 1. HocLieu detects no session → redirects to lms.erg.edu.vn:3001/sso-handoff?returnTo=https://hoclieu.erg.edu.vn:3001/kho-hoc-lieu
 * 2. This page checks if the user is logged in on LMS.
 * 3. If logged in → redirects to returnTo URL with sso_token appended.
 * 4. If not logged in → redirects to LMS login with redirect back to this handoff page.
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
      // User is logged in — redirect to target portal with token
      const url = new URL(normalizedReturnTo);
      url.searchParams.set("sso_token", token);
      window.location.replace(url.toString());
    } else {
      // User is not logged in — redirect to login, then come back here
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
