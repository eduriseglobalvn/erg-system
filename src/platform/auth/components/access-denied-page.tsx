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
        bgcolor: "#F4F7FB",
        color: "text.primary",
        display: "flex",
        minHeight: "100svh",
        px: { xs: 2, sm: 3, lg: 5 },
        py: { xs: 3, sm: 5, lg: 7 },
      }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, margin: "auto", maxWidth: 1120, width: "100%" }}>
        <Box component="header" sx={{ alignItems: "center", display: "flex", justifyContent: "space-between", px: { xs: 0.5, sm: 1 } }}>
          <Box alt="ERG" component="img" src={ERG_ASSETS.logo} sx={{ height: 38, objectFit: "contain", objectPosition: "left center", width: 96 }} />
          <Chip
            icon={<LockPersonRoundedIcon sx={{ fontSize: 16 }} />}
            label="ERG · ACCESS POLICY"
            sx={{ bgcolor: "rgba(15,108,189,0.08)", color: "primary.main", fontSize: 10, fontWeight: 800, letterSpacing: "0.08em" }}
            variant="outlined"
          />
        </Box>

        <Paper
          component="section"
          elevation={0}
          sx={{ border: "1px solid", borderColor: "rgba(15,23,42,0.1)", borderRadius: 3, boxShadow: "0 22px 60px rgba(15,23,42,0.09)", overflow: "hidden" }}
        >
          <Box sx={{ display: "grid", gridTemplateColumns: { lg: "minmax(280px, 0.72fr) minmax(0, 1.28fr)" } }}>
            <Box
              component="aside"
              sx={{
                bgcolor: "#102B4E",
                color: "common.white",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                minHeight: { lg: 620 },
                p: { xs: 3, sm: 4.5 },
                position: "relative",
              }}
            >
              <Box sx={{ position: "relative", zIndex: 1 }}>
                <Box sx={{ alignItems: "center", display: "flex", gap: 1.5 }}>
                  <Box component="img" alt="ERG" src={ERG_ASSETS.mobileLogo} sx={{ bgcolor: "common.white", borderRadius: 1.5, height: 34, objectFit: "contain", p: 0.6, width: 38 }} />
                  <Typography sx={{ color: "rgba(255,255,255,0.72)", fontSize: 11, fontWeight: 800, letterSpacing: "0.12em" }}>SECURE WORKSPACE</Typography>
                </Box>

                <Box sx={{ alignItems: "center", bgcolor: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.18)", borderRadius: 2.5, display: "flex", height: 72, justifyContent: "center", mt: { xs: 7, sm: 10 }, width: 72 }}>
                  <GppBadRoundedIcon sx={{ color: "#B8E5FF", fontSize: 38 }} />
                </Box>
                <Typography sx={{ color: "#B8E5FF", fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", mt: 3 }}>403 · ACCESS DENIED</Typography>
                <Typography component="h1" sx={{ color: "common.white", fontSize: { xs: 27, sm: 32 }, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.15, mt: 1.5 }}>
                  Quyền truy cập<br />
                  đang được bảo vệ.
                </Typography>
                <Typography sx={{ color: "rgba(255,255,255,0.68)", fontSize: 14, lineHeight: 1.75, maxWidth: 300, mt: 2.5 }}>
                  Bạn đã xác thực thành công. Workspace yêu cầu một capability riêng được quản trị bởi ERG.
                </Typography>
              </Box>
              <Box sx={{ borderTop: "1px solid rgba(255,255,255,0.14)", mt: 7, pt: 2.5, position: "relative", zIndex: 1 }}>
                <Typography sx={{ color: "rgba(255,255,255,0.48)", fontSize: 11, lineHeight: 1.6 }}>ERG Access Policy · Session được kiểm tra ở backend</Typography>
              </Box>
            </Box>

            <Box sx={{ bgcolor: "common.white", p: { xs: 3, sm: 5, lg: 6 } }}>
              <Stack spacing={3.25}>
                <Box>
                  <Typography sx={{ color: "error.main", fontSize: 12, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase" }}>Không đủ quyền</Typography>
                  <Typography component="h2" sx={{ fontSize: { xs: 25, sm: 31 }, fontWeight: 800, letterSpacing: "-0.035em", lineHeight: 1.16, mt: 1.25 }}>
                    Không thể vào {workspaceLabel}
                  </Typography>
                  <Typography sx={{ color: "text.secondary", fontSize: 14, lineHeight: 1.75, maxWidth: 650, mt: 1.75 }}>
                    Tài khoản của bạn đã đăng nhập nhưng session hiện tại chưa có quyền cần thiết cho workspace này. Quyền được xác minh lại ở server, vì vậy không thể tự cấp quyền từ trình duyệt.
                  </Typography>
                </Box>

                <Paper sx={{ alignItems: "center", bgcolor: "#F8FAFC", border: "1px solid", borderColor: "divider", borderRadius: 2, display: "flex", gap: 1.5, p: 2 }} variant="outlined">
                  <Avatar sx={{ bgcolor: "rgba(15,108,189,0.1)", color: "primary.main", fontWeight: 800, height: 40, width: 40 }}>{(accountEmail || "?").slice(0, 1).toUpperCase()}</Avatar>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ color: "text.secondary", fontSize: 11, fontWeight: 700 }}>Tài khoản hiện tại</Typography>
                    <Typography sx={{ fontSize: 14, fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{accountEmail || "Phiên đăng nhập hiện tại"}</Typography>
                  </Box>
                  <CheckCircleRoundedIcon sx={{ color: "success.main", fontSize: 21, ml: "auto" }} />
                </Paper>

                {targets.length > 0 ? (
                  <Box>
                    <Typography sx={{ fontSize: 13, fontWeight: 800, mb: 1.25 }}>Bạn có thể mở workspace được cấp quyền</Typography>
                    <Box sx={{ display: "grid", gap: 1.25, gridTemplateColumns: { sm: "repeat(2, minmax(0,1fr))" } }}>
                      {targets.map((target) => <AccessDeniedWorkspaceTargetCard key={target.workspace} target={target} />)}
                    </Box>
                  </Box>
                ) : (
                  <Paper sx={{ bgcolor: "#FFF8F6", border: "1px solid", borderColor: "rgba(217,45,32,0.18)", borderRadius: 2, p: 2 }} variant="outlined">
                    <Typography sx={{ color: "#8B241B", fontSize: 13, fontWeight: 800 }}>Chưa tìm thấy workspace khả dụng</Typography>
                    <Typography sx={{ color: "text.secondary", fontSize: 13, lineHeight: 1.65, mt: 0.5 }}>Vui lòng liên hệ quản trị viên ERG để được gán đúng workspace và capability.</Typography>
                  </Paper>
                )}

                <Divider />
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.25 }}>
                  <Button onClick={loginAgain} startIcon={<PersonRoundedIcon />} sx={{ minHeight: 44, px: 2.25 }} variant="contained">Đăng nhập tài khoản khác</Button>
                  <Button component={Link} startIcon={<HomeRoundedIcon />} sx={{ minHeight: 44, px: 2.25 }} to="/" variant="outlined">Về trang chủ</Button>
                  <Button onClick={() => goBackFromAccessDenied(() => void navigate({ to: "/", replace: true }))} startIcon={<ArrowBackRoundedIcon />} sx={{ color: "text.secondary", minHeight: 44, ml: { sm: "auto" }, px: 1.25 }} variant="text">Quay lại</Button>
                </Box>
                <Typography sx={{ color: "text.disabled", fontSize: 11, lineHeight: 1.6 }}>Trang yêu cầu: {accessDeniedPathLabel(redirect)}</Typography>
              </Stack>
            </Box>
          </Box>
        </Paper>

        <Typography component="footer" sx={{ color: "text.disabled", fontSize: 11, textAlign: "center" }}>Nếu bạn cho rằng đây là nhầm lẫn, hãy gửi email tài khoản và workspace cần truy cập cho quản trị viên ERG.</Typography>
      </Box>
    </Box>
  );
}
