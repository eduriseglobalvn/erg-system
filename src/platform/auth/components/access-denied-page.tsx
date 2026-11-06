import { useEffect, useMemo } from "react";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import GppBadRoundedIcon from "@mui/icons-material/GppBadRounded";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import LockPersonRoundedIcon from "@mui/icons-material/LockPersonRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";

import { ERG_ASSETS } from "@/config/seo";
import { authApi } from "@/platform/auth/api/auth-api";
import { AccessDeniedWorkspaceTargetCard } from "@/platform/auth/components/access-denied-workspace-target";
import { logoutAccount } from "@/platform/auth/api/auth-storage";
import { readStoredAuthSession } from "@/platform/auth/api/auth-token-storage";
import { getCurrentStudentSession, logoutStudentSession } from "@/platform/auth/api/student-auth-storage";
import { useAuthSession } from "@/platform/auth/hooks/use-auth-session";
import { evaluatePermission } from "@/platform/auth/permissions/permission-evaluator";
import { routeAcceptedPermissions, routePermissionForPath } from "@/platform/auth/permissions/route-permission-matrix";
import {
  accessDeniedWorkspaceLabel,
  accessDeniedPathLabel,
  goBackFromAccessDenied,
  portalKeyFromAccessDeniedValue,
  resolveAccessDeniedTargets,
  resolveWorkspaceLandingTarget,
  sanitizeAccessDeniedRedirect,
  workspaceFromAccessDeniedPortal,
} from "@/platform/auth/utils/access-denied";
import { canAccessPortal } from "@/platform/auth/utils/portal-access";
import { alpha } from "@mui/material/styles";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

export function AccessDeniedPage() {
  const auth = useAuthSession();
  const location = useLocation();
  const navigate = useNavigate();
  const params = useMemo(() => new URLSearchParams(location.searchStr), [location.searchStr]);
  const portal = params.get("portal") ?? "";
  const emailFromQuery = params.get("email") ?? "";
  const redirect = sanitizeAccessDeniedRedirect(params.get("redirect"));
  const requestedWorkspace = workspaceFromAccessDeniedPortal(portal);
  const workspaceLabel = accessDeniedWorkspaceLabel(portal);
  const accountEmail = auth.account?.email || emailFromQuery;
  const targets = resolveAccessDeniedTargets({
    requestedPortal: portal,
    workspaces: auth.session?.workspaces,
    roles: auth.session?.roles,
    portals: auth.session?.portals,
    permissions: auth.session?.permissions,
    deniedPermissions: auth.session?.deniedPermissions,
  });

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
    <Box
      component="main"
      sx={{
        background: "radial-gradient(120% 120% at 50% 0%, #F8FAFD 0%, #EEF2F7 100%)",
        color: "text.primary",
        display: "flex",
        minHeight: "100svh",
        px: { xs: 2, sm: 3, lg: 4 },
        py: { xs: 4, sm: 6, lg: 8 },
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Manrope', sans-serif",
      }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3, margin: "auto", maxWidth: 840, width: "100%" }}>
        {/* Top Minimal Apple Header */}
        <Box component="header" sx={{ alignItems: "center", display: "flex", justifyContent: "space-between", px: { xs: 1, sm: 1.5 } }}>
          <Box sx={{ alignItems: "center", display: "flex", gap: 1.75 }}>
            <Box
              alt="ERG EduRise Global"
              component="img"
              src={ERG_ASSETS.logo}
              sx={{
                height: { xs: 46, sm: 54 },
                width: { xs: 46, sm: 54 },
                objectFit: "contain",
                borderRadius: "14px",
                filter: "drop-shadow(0 4px 12px rgba(15, 23, 42, 0.08))",
              }}
            />
            <Box>
              <Typography
                sx={{
                  color: "text.primary",
                  fontSize: { xs: 17, sm: 20 },
                  fontWeight: 850,
                  letterSpacing: "-0.03em",
                  lineHeight: 1.15,
                }}
              >
                ERG System
              </Typography>
              <Typography
                sx={{
                  color: "text.disabled",
                  fontSize: { xs: 11, sm: 12 },
                  fontWeight: 600,
                  letterSpacing: "0.02em",
                  mt: 0.25,
                }}
              >
                EduRise Global Platform
              </Typography>
            </Box>
          </Box>
          <Chip
            icon={<LockPersonRoundedIcon sx={{ fontSize: "15px !important", color: `${ergEnterpriseTokens.color.textMuted} !important` }} />}
            label="CHÍNH SÁCH BẢO MẬT ERG"
            sx={{
              bgcolor: "rgba(255, 255, 255, 0.8)",
              backdropFilter: "blur(12px)",
              borderColor: "divider",
              color: "text.secondary",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.06em",
              height: 32,
              borderRadius: "980px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
            }}
            variant="outlined"
          />
        </Box>

        {/* Apple Style Main Card */}
        <Paper
          component="section"
          elevation={0}
          sx={{
            bgcolor: "#FFFFFF",
            border: `1px solid ${ergEnterpriseTokens.color.border}`,
            borderRadius: "24px",
            boxShadow: "0 24px 60px -12px rgba(15, 23, 42, 0.08), 0 3px 12px rgba(15, 23, 42, 0.02)",
            p: { xs: 3, sm: 5, md: 6 },
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Subtle Apple Ambient Glow in Card Background */}
          <Box
            sx={{
              position: "absolute",
              top: -80,
              right: -80,
              width: 240,
              height: 240,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(239, 68, 68, 0.05) 0%, rgba(255,255,255,0) 70%)",
              pointerEvents: "none",
            }}
          />

          <Stack spacing={4}>
            {/* Hero Section */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.25 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Box
                  sx={{
                    alignItems: "center",
                    background: `linear-gradient(135deg, ${alpha(ergEnterpriseTokens.color.danger, 0.12)} 0%, ${alpha(ergEnterpriseTokens.color.warning, 0.1)} 100%)`,
                    border: `1px solid ${alpha(ergEnterpriseTokens.color.danger, 0.16)}`,
                    borderRadius: "18px",
                    display: "flex",
                    height: 58,
                    justifyContent: "center",
                    width: 58,
                    boxShadow: `0 4px 14px ${alpha(ergEnterpriseTokens.color.danger, 0.12)}`,
                  }}
                >
                  <GppBadRoundedIcon sx={{ color: "error.main", fontSize: 32 }} />
                </Box>
                <Box>
                  <Typography
                    sx={{
                      color: "error.main",
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                    }}
                  >
                    403 · Access Restricted
                  </Typography>
                  <Typography
                    component="h1"
                    sx={{
                      fontSize: { xs: 24, sm: 28, md: 32 },
                      fontWeight: 600,
                      letterSpacing: "-0.03em",
                      lineHeight: 1.2,
                      color: "text.primary",
                      mt: 0.25,
                    }}
                  >
                    Không thể vào {workspaceLabel}
                  </Typography>
                </Box>
              </Box>

              <Typography
                sx={{
                  color: "text.secondary",
                  fontSize: 14.5,
                  lineHeight: 1.65,
                  maxWidth: 680,
                }}
              >
                Tài khoản của bạn đã đăng nhập nhưng session hiện tại chưa có quyền cần thiết cho workspace này. Quyền được xác minh lại ở server, vì vậy không thể tự cấp quyền từ trình duyệt.
              </Typography>
            </Box>

            {/* Current Account Capsule */}
            <Paper
              sx={{
                alignItems: "center",
                bgcolor: "rgba(245, 245, 247, 0.75)",
                border: `1px solid ${ergEnterpriseTokens.color.border}`,
                borderRadius: "16px",
                display: "flex",
                gap: 1.75,
                p: 2,
              }}
              variant="outlined"
            >
              <Avatar
                sx={{
                  bgcolor: alpha(ergEnterpriseTokens.color.primary, 0.12),
                  color: "primary.main",
                  fontWeight: 600,
                  fontSize: 15,
                  height: 42,
                  width: 42,
                  borderRadius: "12px",
                }}
              >
                {(accountEmail || "?").slice(0, 1).toUpperCase()}
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ color: "text.disabled", fontSize: 11.5, fontWeight: 600, letterSpacing: "0.02em" }}>
                  Tài khoản hiện tại
                </Typography>
                <Typography
                  sx={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: "text.primary",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {accountEmail || "Phiên đăng nhập hiện tại"}
                </Typography>
              </Box>
              <Chip
                icon={<CheckCircleRoundedIcon sx={{ fontSize: "16px !important", color: `${ergEnterpriseTokens.color.success} !important` }} />}
                label="Đã xác thực"
                size="small"
                sx={{
                  bgcolor: alpha(ergEnterpriseTokens.color.success, 0.1),
                  border: `1px solid ${alpha(ergEnterpriseTokens.color.success, 0.2)}`,
                  color: "success.main",
                  fontSize: 11.5,
                  fontWeight: 600,
                  height: 26,
                  ml: "auto",
                  borderRadius: "980px",
                }}
              />
            </Paper>

            {/* Entitled Workspaces or Recovery Callout */}
            {targets.length > 0 ? (
              <Box>
                <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: "text.primary", mb: 1.75 }}>
                  Bạn có thể mở workspace được cấp quyền
                </Typography>
                <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { sm: "repeat(2, minmax(0,1fr))" } }}>
                  {targets.map((target) => (
                    <AccessDeniedWorkspaceTargetCard key={target.workspace} target={target} />
                  ))}
                </Box>
              </Box>
            ) : (
              <Paper
                sx={{
                  bgcolor: alpha(ergEnterpriseTokens.color.warning, 0.06),
                  border: `1px solid ${alpha(ergEnterpriseTokens.color.warning, 0.2)}`,
                  borderRadius: "16px",
                  p: 2.25,
                }}
                variant="outlined"
              >
                <Typography sx={{ color: "#B45309", fontSize: 13.5, fontWeight: 600 }}>
                  Chưa tìm thấy workspace khả dụng
                </Typography>
                <Typography sx={{ color: "#78350F", fontSize: 13, lineHeight: 1.6, mt: 0.5 }}>
                  Vui lòng liên hệ quản trị viên ERG để được gán đúng workspace và capability.
                </Typography>
              </Paper>
            )}

            <Divider sx={{ borderColor: "rgba(0, 0, 0, 0.07)" }} />

            {/* Action Bar */}
            <Box
              sx={{
                alignItems: { sm: "center" },
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                flexWrap: "wrap",
                gap: 1.5,
              }}
            >
              <Button
                onClick={loginAgain}
                startIcon={<PersonRoundedIcon sx={{ fontSize: 18 }} />}
                sx={{
                  bgcolor: "text.primary",
                  borderRadius: "980px",
                  color: "#FFFFFF",
                  fontSize: 14,
                  fontWeight: 600,
                  minHeight: 46,
                  px: 3,
                  textTransform: "none",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
                  transition: "all 180ms ease",
                  "&:hover": {
                    bgcolor: "#333336",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.16)",
                    transform: "translateY(-1px)",
                  },
                  "&:active": {
                    transform: "scale(0.98)",
                  },
                }}
                variant="contained"
              >
                Đăng nhập tài khoản khác
              </Button>

              <Button
                component={Link}
                startIcon={<HomeRoundedIcon sx={{ fontSize: 18 }} />}
                sx={{
                  borderColor: "divider",
                  borderRadius: "980px",
                  color: "text.primary",
                  fontSize: 14,
                  fontWeight: 600,
                  minHeight: 46,
                  px: 2.75,
                  textTransform: "none",
                  "&:hover": {
                    borderColor: "rgba(0, 0, 0, 0.3)",
                    bgcolor: "rgba(0, 0, 0, 0.03)",
                  },
                  "&:active": {
                    transform: "scale(0.98)",
                  },
                }}
                to="/"
                variant="outlined"
              >
                Về trang chủ
              </Button>

              <Button
                onClick={() => goBackFromAccessDenied(() => void navigate({ to: "/", replace: true }))}
                startIcon={<ArrowBackRoundedIcon sx={{ fontSize: 18 }} />}
                sx={{
                  color: "text.secondary",
                  fontSize: 14,
                  fontWeight: 600,
                  minHeight: 46,
                  ml: { sm: "auto" },
                  px: 2,
                  textTransform: "none",
                  borderRadius: "980px",
                  "&:hover": {
                    color: "text.primary",
                    bgcolor: "rgba(0, 0, 0, 0.04)",
                  },
                }}
                variant="text"
              >
                Quay lại
              </Button>
            </Box>

            <Typography sx={{ color: "text.disabled", fontSize: 11.5, lineHeight: 1.6, textAlign: "left" }}>
              Trang yêu cầu: {accessDeniedPathLabel(redirect)}
            </Typography>
          </Stack>
        </Paper>

        {/* Footer Notice */}
        <Typography
          component="footer"
          sx={{
            color: "text.disabled",
            fontSize: 12,
            textAlign: "center",
            lineHeight: 1.6,
            px: 2,
          }}
        >
          Nếu bạn cho rằng đây là nhầm lẫn, hãy gửi email tài khoản và workspace cần truy cập cho quản trị viên ERG.
        </Typography>
      </Box>
    </Box>
  );
}

export default AccessDeniedPage;
