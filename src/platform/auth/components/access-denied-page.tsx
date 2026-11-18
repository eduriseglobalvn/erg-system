import { useEffect, useMemo } from "react";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import GppBadRoundedIcon from "@mui/icons-material/GppBadRounded";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";

import { ERG_ASSETS } from "@/config/seo";
import { canonicalWorkspaceForPath } from "@/platform/workspaces/workspace-route";
import { authApi } from "@/platform/auth/api/auth-api";
import { AccessDeniedWorkspaceTargetCard } from "@/platform/auth/components/access-denied-workspace-target";
import { logoutAccount } from "@/platform/auth/api/auth-storage";
import { readStoredAuthSession } from "@/platform/auth/api/auth-token-storage";
import { getCurrentStudentSession, logoutStudentSession } from "@/platform/auth/api/student-auth-storage";
import { useAuthSession } from "@/platform/auth/hooks/use-auth-session";
import { evaluatePermission } from "@/platform/auth/permissions/permission-evaluator";
import { misroutedStudentHome } from "@/platform/auth/permissions/student-only";
import { projectVerifiedWorkspaces } from "@/platform/auth/permissions/workspace-capability-projection";
import { routeAcceptedPermissions, routePermissionForPath } from "@/platform/auth/permissions/route-permission-matrix";
import {
  accessDeniedWorkspaceLabel,
  goBackFromAccessDenied,
  portalKeyFromAccessDeniedValue,
  resolveAccessDeniedTargets,
  resolveWorkspaceLandingTarget,
  sanitizeAccessDeniedRedirect,
  workspaceFromAccessDeniedPortal,
} from "@/platform/auth/utils/access-denied";
import { canAccessPortal } from "@/platform/auth/utils/portal-access";
import { ergEnterpriseTokens as t } from "@/themes/erg-enterprise-tokens";

export function AccessDeniedPage() {
  const auth = useAuthSession();
  const location = useLocation();
  const navigate = useNavigate();
  const params = useMemo(() => new URLSearchParams(location.searchStr), [location.searchStr]);
  const portal = params.get("portal") ?? "";
  const emailFromQuery = params.get("email") ?? "";
  const redirect = sanitizeAccessDeniedRedirect(params.get("redirect"));
  const requestedWorkspace = workspaceFromAccessDeniedPortal(portal);
  // The page asked for names the workspace ("/admin" is the Admin Workspace), whatever portal key the redirect carried.
  const workspaceLabel = accessDeniedWorkspaceLabel(canonicalWorkspaceForPath(redirect.split(/[?#]/, 1)[0]) ?? portal);
  const accountEmail = auth.account?.email || emailFromQuery;
  const targets = resolveAccessDeniedTargets({
    requestedPortal: portal,
    workspaces: auth.session?.workspaces,
    roles: auth.session?.roles,
    portals: auth.session?.portals,
    permissions: auth.session?.permissions,
    deniedPermissions: auth.session?.deniedPermissions,
  });

  // A learner-only account never rests on this page: it goes to the student home.
  const studentHome = auth.account
    ? misroutedStudentHome({ workspaces: projectVerifiedWorkspaces({ ...auth.session }), lifecycle: auth.account.lifecycle }, redirect.split(/[?#]/, 1)[0])
    : null;
  useEffect(() => {
    if (studentHome) void navigate({ href: studentHome, replace: true });
  }, [navigate, studentHome]);

  useEffect(() => {
    const portalKey = portalKeyFromAccessDeniedValue(portal);
    if (!portalKey) return;

    const teacherSession = auth.session ?? readStoredAuthSession(portalKey) ?? readStoredAuthSession();
    const studentSession = getCurrentStudentSession();
    if (!canAccessPortal({ portal: portalKey, studentSession, teacherAccount: auth.account, teacherSession })) return;

    const landingTarget = resolveWorkspaceLandingTarget({
      preferredWorkspace: requestedWorkspace,
      workspaces: teacherSession?.workspaces,
      roles: teacherSession?.roles,
      portals: teacherSession?.portals,
      permissions: teacherSession?.permissions,
      deniedPermissions: teacherSession?.deniedPermissions,
    });
    if (requestedWorkspace && landingTarget?.workspace !== requestedWorkspace) return;

    // Bouncing back to a route the guard will deny again is an infinite redirect loop.
    if (requestedWorkspace) {
      const entry = routePermissionForPath(redirect, requestedWorkspace);
      if (!entry || !routeAcceptedPermissions(entry).some((permission) => evaluatePermission({ permission, grantedPermissions: teacherSession?.permissions, deniedPermissions: teacherSession?.deniedPermissions }))) return;
    }

    void navigate({ href: redirect, replace: true });
  }, [auth.account, auth.session, navigate, portal, redirect, requestedWorkspace]);

  function loginAgain() {
    void authApi.logout().catch(() => undefined);
    logoutStudentSession();
    logoutAccount();
    void navigate({ replace: true, search: { redirect }, to: "/login" });
  }

  return (
    <Box component="main" sx={{ bgcolor: t.color.surfaceSubtle, display: "grid", minHeight: "100svh", placeItems: "center", px: 2, py: { xs: 4, sm: 6 } }}>
      <Paper component="section" variant="outlined" sx={{ borderColor: t.color.border, borderRadius: `${t.radius.shell}px`, maxWidth: 480, p: { xs: 3, sm: 4 }, width: "100%" }}>
        <Stack spacing={3}>
          <Box sx={{ alignItems: "center", display: "flex", gap: 1.5 }}>
            <Box alt="" component="img" src={ERG_ASSETS.logo} sx={{ height: 40, objectFit: "contain", width: 40 }} />
            <Typography component="p" variant="subtitle2">ERG EduRise Global</Typography>
          </Box>

          <Stack spacing={1}>
            <Box sx={{ alignItems: "center", color: "error.main", display: "flex", gap: 0.75 }}>
              <GppBadRoundedIcon fontSize="small" />
              <Typography component="p" variant="caption">Không có quyền</Typography>
            </Box>
            <Typography component="h1" variant="h1">Bạn chưa có quyền vào {workspaceLabel}</Typography>
            <Typography color="text.secondary" variant="body2">
              Tài khoản này chưa được cấp quyền dùng khu vực này. Nếu bạn cần dùng, nhờ phòng đào tạo hoặc quản trị viên ERG cấp quyền.
            </Typography>
            {accountEmail ? (
              <Typography color="text.secondary" variant="body2">
                Đang đăng nhập: <Box component="strong" sx={{ color: "text.primary", overflowWrap: "anywhere" }}>{accountEmail}</Box>
              </Typography>
            ) : null}
          </Stack>

          {targets.length > 0 ? (
            <Stack spacing={1.5}>
              <Typography component="h2" variant="subtitle2">Bạn có thể mở</Typography>
              {targets.map((target) => (
                <AccessDeniedWorkspaceTargetCard key={target.workspace} target={target} />
              ))}
            </Stack>
          ) : (
            <Alert severity="warning">
              <Typography component="p" variant="subtitle2">Tài khoản chưa có cổng nào dùng được</Typography>
              <Typography variant="body2">Nhờ quản trị viên ERG gán đúng quyền cho tài khoản.</Typography>
            </Alert>
          )}

          <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, flexWrap: "wrap", gap: 1 }}>
            <Button component={Link} startIcon={<HomeRoundedIcon />} sx={{ minHeight: 44 }} to="/" variant="contained">
              Về trang chủ
            </Button>
            <Button onClick={() => goBackFromAccessDenied(() => void navigate({ to: "/", replace: true }))} startIcon={<ArrowBackRoundedIcon />} sx={{ minHeight: 44 }} variant="text">
              Quay lại
            </Button>
            <Button onClick={loginAgain} sx={{ minHeight: 44, ml: { sm: "auto" } }} variant="text">
              Đăng nhập tài khoản khác
            </Button>
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
}

export default AccessDeniedPage;
