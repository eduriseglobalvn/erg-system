import { useEffect } from "react";
import GppBadRoundedIcon from "@mui/icons-material/GppBadRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import { Link, useNavigate, useSearchParams } from "@/routes/router-compat";

import { ERG_ASSETS } from "@/config/seo";
import { authApi } from "@/platform/auth/api/auth-api";
import { logoutAccount } from "@/platform/auth/api/auth-storage";
import { readStoredAuthSession, type StoredAuthSession } from "@/platform/auth/api/auth-token-storage";
import { getCurrentStudentSession, logoutStudentSession } from "@/platform/auth/api/student-auth-storage";
import { useAuthSession } from "@/platform/auth/hooks/use-auth-session";
import { canAccessPortal } from "@/platform/auth/utils/portal-access";

type PortalKey = NonNullable<StoredAuthSession["portal"]>;

const portalLabels: Record<string, string> = {
  admin: "Admin",
  crm: "CRM",
  lcms: "LCMS",
  lms: "LMS",
  elearning: "Elearning",
};

export function AccessDeniedPage() {
  const auth = useAuthSession();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const portal = params.get("portal") ?? "";
  const email = params.get("email") ?? "";
  const redirect = sanitizeRedirect(params.get("redirect"));
  const portalLabel = portalLabels[portal] ?? "hệ thống ERG";

  useEffect(() => {
    const portalKey = toPortalKey(portal);
    if (!portalKey) return;

    const teacherSession = readStoredAuthSession(portalKey) ?? readStoredAuthSession();
    const studentSession = getCurrentStudentSession();
    if (!canAccessPortal({ portal: portalKey, studentSession, teacherAccount: auth.account, teacherSession })) return;

    navigate(redirect, { replace: true });
  }, [auth.account, navigate, portal, redirect]);

  function loginAgain() {
    void authApi.logout().catch(() => undefined);
    logoutStudentSession();
    logoutAccount();
    navigate(`/login?redirect=${encodeURIComponent(redirect)}`, { replace: true });
  }

  return (
    <Box component="main" sx={{ bgcolor: "background.default", color: "text.primary", display: "grid", minHeight: "100svh", px: 2, py: 5, placeItems: "center" }}>
      <Paper component="section" elevation={1} sx={{ border: "1px solid", borderColor: "divider", maxWidth: 780, overflow: "hidden", width: "100%" }}>
        <Box sx={{ display: "grid", gridTemplateColumns: { md: "280px minmax(0,1fr)" } }}>
          <Box component="aside" sx={{ bgcolor: "primary.main", color: "primary.contrastText", p: 4 }}>
            <Box alt="ERG" component="img" src={ERG_ASSETS.logo} sx={{ bgcolor: "common.white", borderRadius: 1, height: 48, objectFit: "contain", px: 1.5, py: 1, width: "fit-content" }} />
            <Box sx={{ alignItems: "center", bgcolor: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 1, display: "flex", height: 64, justifyContent: "center", mt: 5, width: 64 }}>
              <GppBadRoundedIcon sx={{ fontSize: 32 }} />
            </Box>
            <Box component="p" sx={{ color: "rgba(255,255,255,0.6)", fontSize: 11, fontWeight: 700, m: 0, mt: 3 }}>Access denied</Box>
            <Box component="h1" sx={{ fontSize: 20, fontWeight: 700, lineHeight: 1.25, m: 0, mt: 1.5 }}>Tài khoản chưa có quyền truy cập.</Box>
          </Box>

          <Box sx={{ p: { xs: 4, sm: 5 } }}>
            <Box component="p" sx={{ color: "error.main", fontSize: 14, fontWeight: 700, m: 0 }}>Không đủ quyền</Box>
            <Box component="h2" sx={{ fontSize: 20, fontWeight: 700, m: 0, mt: 1.5 }}>Không thể vào {portalLabel}</Box>
            <Box component="p" sx={{ color: "text.secondary", fontSize: 14, lineHeight: 1.75, m: 0, mt: 2 }}>
              {email ? (
                <>
                  Tài khoản <Box component="span" sx={{ color: "text.primary", fontWeight: 700 }}>{email}</Box> đã đăng nhập thành công nhưng chưa được cấp quyền vào {portalLabel}.
                </>
              ) : (
                <>Tài khoản hiện tại chưa được cấp quyền vào {portalLabel}.</>
              )}{" "}
              Vui lòng liên hệ quản trị viên ERG để được cấp quyền theo vai trò hoặc trường phụ trách.
            </Box>

            <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { sm: "repeat(2, minmax(0,1fr))" }, mt: 4 }}>
              <Button
                type="button"
                onClick={loginAgain}
                sx={{ height: 48, px: 2.5 }}
                variant="contained"
              >
                Đăng nhập tài khoản khác
              </Button>
              <Button
                component={Link}
                to="/"
                sx={{ height: 48, px: 2.5 }}
                variant="outlined"
              >
                Về trang chủ
              </Button>
            </Box>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}

function sanitizeRedirect(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

function toPortalKey(value: string): PortalKey | undefined {
  if (value === "admin" || value === "crm" || value === "lcms" || value === "lms" || value === "elearning") return value;
  return undefined;
}
