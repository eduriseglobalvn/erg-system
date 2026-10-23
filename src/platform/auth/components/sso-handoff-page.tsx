import { useEffect } from "react";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import { useLocation } from "@tanstack/react-router";

import { normalizeSsoReturnTo } from "@/platform/auth/utils/sso-return-to";
import { getSharedAuthUrl } from "@/config/portal-urls";

/**
 * SSO handoff page loaded on the source portal, for example LMS.
 *
 * Flow:
 * 1. A target portal redirects to `/sso-handoff?returnTo=<target-url>`.
 * 2. This page validates the target and sends the browser through the shared
 *    auth origin. The auth/BFF owns the session; credentials never travel in
 *    a query string or cross-domain application cookie.
 */
export function SsoHandoffPage() {
  const params = new URLSearchParams(useLocation().searchStr);
  const returnTo = params.get("returnTo");

  useEffect(() => {
    if (!returnTo) return;

    const normalizedReturnTo = normalizeSsoReturnTo(returnTo);
    if (!normalizedReturnTo) {
      console.warn("[SSO] Invalid returnTo URL:", returnTo);
      return;
    }

    const authUrl = new URL(getSharedAuthUrl());
    authUrl.searchParams.set("redirect", normalizedReturnTo);
    authUrl.searchParams.set("returnTo", normalizedReturnTo);
    window.location.replace(authUrl.toString());
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
