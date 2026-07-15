import { useEffect } from "react";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import { useSearchParams } from "@/routes/router-compat";

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
    <Box sx={{ bgcolor: "background.default", display: "grid", minHeight: "100svh", placeItems: "center" }}>
      <Box sx={{ textAlign: "center" }}>
        <CircularProgress size={32} />
        <Typography color="text.secondary" sx={{ fontSize: 14, mt: 2 }}>Đang chuyển tiếp đăng nhập...</Typography>
      </Box>
    </Box>
  );
}
