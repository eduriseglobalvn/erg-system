"use client";

import { useState, type ReactNode } from "react";
import AdminPanelSettingsRoundedIcon from "@mui/icons-material/AdminPanelSettingsRounded";
import BusinessRoundedIcon from "@mui/icons-material/BusinessRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useLocation } from "@tanstack/react-router";

import type { Workspace } from "@/platform/workspaces/workspace-domain";
import {
  canonicalCrmWorkspaceHostForRuntime,
  canonicalLmsWorkspaceHostForRuntime,
} from "@/platform/workspaces/workspace-route";
import {
  workspaceCapabilities,
  workspacesFromLegacyPortals,
} from "@/platform/workspaces/workspace-switcher";
import { readStoredAuthSession } from "@/platform/auth/api/auth-token-storage";
import { ERG_ASSETS } from "@/config/seo";
import type { PortalInfo } from "./ErgPortalLayout";
import {
  COLLAPSED_SIDEBAR_WIDTH,
  EXPANDED_SIDEBAR_WIDTH,
} from "./portal-sidebar-motion";
import {
  NAV_PANEL_BORDER,
  SIDEBAR_FADE_EASING,
  SIDEBAR_MOTION_CURVE,
} from "./portal-sidebar-styles";

function workspaceFromPath(
  pathname: string,
  hostname = typeof window === "undefined" ? "" : window.location.hostname,
): Workspace {
  const segment = pathname.split("/").filter(Boolean)[0];
  if (segment === "admin") return "ADMIN";
  if (segment === "student") return "STUDENT";
  if (hostname.toLowerCase() === canonicalCrmWorkspaceHostForRuntime(hostname)) return "CRM";
  if (hostname.toLowerCase() === "crm.erg.edu.local" || hostname.toLowerCase() === "crm.erg.edu.vn") return "CRM";
  const legacyAdminDomain = "lcms.erg.edu.local";
  if (hostname.toLowerCase() === legacyAdminDomain) return "ADMIN";
  if (segment === "crm") return "CRM";
  return "TEACHER";
}

function runtimeOriginForWorkspace(workspace: Workspace) {
  if (typeof window === "undefined") return undefined;
  const host =
    workspace === "CRM"
      ? canonicalCrmWorkspaceHostForRuntime(window.location.hostname)
      : canonicalLmsWorkspaceHostForRuntime(window.location.hostname);
  const port = window.location.port;
  const hostWithPort = port && port !== "80" && port !== "443" ? `${host}:${port}` : host;
  return `${window.location.protocol}//${hostWithPort}`;
}

export const WORKSPACE_META: Record<
  Workspace,
  {
    label: string;
    subtitle: string;
    icon: ReactNode;
    themeColor: string;
    gradient: string;
    shadow: string;
    localPath: string;
  }
> = {
  ADMIN: {
    label: "Admin LMS",
    subtitle: "Quản trị hệ thống",
    icon: <AdminPanelSettingsRoundedIcon sx={{ fontSize: 20, color: "#FFFFFF" }} />,
    themeColor: "#4F46E5",
    gradient: "linear-gradient(135deg, #4F46E5 0%, #6366F1 50%, #7C3AED 100%)",
    shadow: "0 3px 10px rgba(79, 70, 229, 0.32)",
    localPath: "/admin",
  },
  TEACHER: {
    label: "Giáo viên",
    subtitle: "Không gian giảng dạy",
    icon: <SchoolRoundedIcon sx={{ fontSize: 20, color: "#FFFFFF" }} />,
    themeColor: "#059669",
    gradient: "linear-gradient(135deg, #059669 0%, #10B981 50%, #0D9488 100%)",
    shadow: "0 3px 10px rgba(16, 185, 129, 0.32)",
    localPath: "/teacher/home",
  },
  STUDENT: {
    label: "Học sinh",
    subtitle: "Cổng học tập & bài tập",
    icon: <MenuBookRoundedIcon sx={{ fontSize: 20, color: "#FFFFFF" }} />,
    themeColor: "#0284C7",
    gradient: "linear-gradient(135deg, #0284C7 0%, #0EA5E9 50%, #38BDF8 100%)",
    shadow: "0 3px 10px rgba(2, 132, 199, 0.32)",
    localPath: "/student",
  },
  CRM: {
    label: "CRM Tuyển sinh",
    subtitle: "Quản lý khách hàng",
    icon: <BusinessRoundedIcon sx={{ fontSize: 20, color: "#FFFFFF" }} />,
    themeColor: "#D97706",
    gradient: "linear-gradient(135deg, #D97706 0%, #F59E0B 50%, #F97316 100%)",
    shadow: "0 3px 10px rgba(217, 119, 6, 0.32)",
    localPath: "/",
  },
};

export function PortalSidebarWorkspaceHeader({
  active,
  collapsed,
  mobile = false,
  portalInfo,
  onNavigate,
  fluid = false,
}: {
  active: boolean;
  collapsed: boolean;
  mobile?: boolean;
  portalInfo?: PortalInfo;
  onNavigate?: (path: string) => void;
  fluid?: boolean;
}) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  void mobile;
  let pathname = "";
  try {
     
    const location = useLocation();
    pathname = location?.pathname || "";
  } catch {
    if (typeof window !== "undefined") {
      pathname = window.location.pathname || "";
    }
  }

  const current = workspaceFromPath(pathname);
  const meta = WORKSPACE_META[current] ?? WORKSPACE_META.TEACHER;

  const sessionWorkspaces = typeof window !== "undefined" ? readStoredAuthSession()?.workspaces : undefined;
  const granted = portalInfo?.workspaceCapabilities?.length
    ? [...portalInfo.workspaceCapabilities]
    : sessionWorkspaces?.length
      ? [...sessionWorkspaces]
      : workspacesFromLegacyPortals(portalInfo?.workspacePortals ?? [], current);

  const capabilities = workspaceCapabilities(granted, current, pathname, {
    originForWorkspace: runtimeOriginForWorkspace,
  });

  const canSwitch = capabilities.length >= 2;

  const handleSelectWorkspace = (targetWorkspace: Workspace, fallbackHref?: string) => {
    setAnchorEl(null);
    if (typeof window !== "undefined") {
      window.localStorage?.setItem("erg_last_workspace", targetWorkspace);
    }
    const targetPath = WORKSPACE_META[targetWorkspace]?.localPath ?? fallbackHref ?? "/";
    if (onNavigate) {
      onNavigate(targetPath);
    } else if (typeof window !== "undefined") {
      window.location.assign(targetPath);
    }
  };

  return (
    <Box
      aria-hidden={!active}
      inert={!active}
      sx={{
        alignItems: "center",
        boxSizing: "border-box",
        borderBottom: fluid ? "none" : `1px solid ${NAV_PANEL_BORDER}`,
        display: "flex",
        height: fluid ? "auto" : 64,
        justifyContent: collapsed ? "center" : "flex-start",
        left: 0,
        opacity: active ? 1 : 0,
        px: collapsed ? 0 : (fluid ? 0 : "10px"),
        pointerEvents: active ? "auto" : "none",
        position: fluid ? "relative" : "absolute",
        top: 0,
        transform: fluid ? "none" : (active ? "translate3d(0, 0, 0)" : `translate3d(${collapsed ? -6 : 6}px, 0, 0)`),
        transition: fluid ? "none" : `opacity ${SIDEBAR_FADE_EASING}, transform ${SIDEBAR_MOTION_CURVE}`,
        width: fluid ? "100%" : (collapsed ? COLLAPSED_SIDEBAR_WIDTH : EXPANDED_SIDEBAR_WIDTH),
        zIndex: 2,
        "@media (prefers-reduced-motion: reduce)": {
          transition: "none",
        },
      }}
    >
      <Box
        component="img"
        alt="ERG"
        src={collapsed ? ERG_ASSETS.mobileLogo : ERG_ASSETS.logo}
        sx={{ width: 0, height: 0, opacity: 0, position: "absolute", pointerEvents: "none" }}
      />
      {collapsed ? (
        <Tooltip
          title={`${meta.label} • ${meta.subtitle}${canSwitch ? " (Nhấn để chuyển)" : ""}`}
          placement="right"
          arrow
        >
          <span>
            <IconButton
              aria-label={`Không gian làm việc: ${meta.label}`}
              onClick={(e) => canSwitch && setAnchorEl(e.currentTarget)}
              sx={{
                background: meta.gradient,
                borderRadius: "9px",
                boxShadow: meta.shadow,
                cursor: canSwitch ? "pointer" : "default",
                height: 36,
                p: 0,
                transition: "all 0.18s cubic-bezier(0.2, 0, 0, 1)",
                width: 36,
                "&:hover": canSwitch
                  ? {
                      transform: "scale(1.06)",
                      boxShadow: meta.shadow,
                    }
                  : {},
              }}
            >
              {meta.icon}
            </IconButton>
          </span>
        </Tooltip>
      ) : (
        <ButtonBase
          aria-label={`Không gian làm việc: ${meta.label}`}
          onClick={(e) => canSwitch && setAnchorEl(e.currentTarget)}
          sx={{
            alignItems: "center",
            bgcolor: anchorEl ? "rgba(54, 89, 187, 0.08)" : (fluid ? "#F8FAFC" : "transparent"),
            border: fluid ? "1px solid #E2E8F0" : "none",
            borderRadius: fluid ? "12px" : "10px",
            boxSizing: "border-box",
            cursor: canSwitch ? "pointer" : "default",
            display: "flex",
            justifyContent: "space-between",
            p: fluid ? "7px 9px" : "6px 8px",
            textAlign: "left",
            transition: "all 0.18s cubic-bezier(0.2, 0, 0, 1)",
            width: "100%",
            "&:hover": canSwitch
              ? {
                  bgcolor: fluid ? "#F1F5F9" : "rgba(54, 89, 187, 0.06)",
                  borderColor: fluid ? "#CBD5E1" : undefined,
                }
              : {},
          }}
        >
          <Box sx={{ alignItems: "center", display: "flex", gap: 1.25, minWidth: 0 }}>
            <Box
              sx={{
                alignItems: "center",
                background: meta.gradient,
                borderRadius: "9px",
                boxShadow: meta.shadow,
                display: "flex",
                flexShrink: 0,
                height: 35,
                justifyContent: "center",
                transition: "transform 0.18s ease",
                width: 35,
                "&:hover": {
                  transform: canSwitch ? "scale(1.04)" : "none",
                },
              }}
            >
              {meta.icon}
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                noWrap
                sx={{
                  color: "#1C252E",
                  fontSize: 13.5,
                  fontWeight: 750,
                  letterSpacing: "-0.015em",
                  lineHeight: 1.25,
                }}
              >
                {meta.label}
              </Typography>
              <Typography
                noWrap
                sx={{
                  color: "#667789",
                  fontSize: 11,
                  fontWeight: 500,
                  lineHeight: 1.2,
                  mt: 0.25,
                }}
              >
                {meta.subtitle}
              </Typography>
            </Box>
          </Box>
          {canSwitch ? (
            <KeyboardArrowDownRoundedIcon
              sx={{
                color: anchorEl ? meta.themeColor : "#8898AA",
                flexShrink: 0,
                fontSize: 18,
                transform: anchorEl ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.2s cubic-bezier(0.2, 0, 0, 1), color 0.15s ease",
              }}
            />
          ) : null}
        </ButtonBase>
      )}

      {canSwitch ? (
        <Menu
          anchorEl={anchorEl}
          anchorOrigin={{ horizontal: "left", vertical: "bottom" }}
          onClose={() => setAnchorEl(null)}
          open={Boolean(anchorEl)}
          sx={{ zIndex: 1400 }}
          slotProps={{
            root: {
              sx: { zIndex: 1400 },
            },
            paper: {
              sx: {
                bgcolor: "#FFFFFF",
                border: "1px solid rgba(136, 145, 188, 0.2)",
                borderRadius: "14px",
                boxShadow: "0 16px 40px rgba(15, 23, 42, 0.12), 0 4px 12px rgba(15, 23, 42, 0.04)",
                minWidth: 236,
                mt: 0.75,
                p: 0.75,
                zIndex: 1400,
              },
            },
          }}
          transformOrigin={{ horizontal: "left", vertical: "top" }}
        >
          <Box sx={{ borderBottom: "1px solid rgba(241, 245, 249, 1)", mb: 0.5, px: 1.5, py: 0.75 }}>
            <Typography
              variant="caption"
              sx={{
                color: "#8898AA",
                fontSize: 10.5,
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              Không gian làm việc
            </Typography>
          </Box>
          {capabilities.map((cap) => {
            const isCurrent = cap.workspace === current;
            const targetMeta = WORKSPACE_META[cap.workspace] ?? WORKSPACE_META.TEACHER;
            return (
              <MenuItem
                key={cap.workspace}
                onClick={() => handleSelectWorkspace(cap.workspace, cap.href)}
                sx={{
                  alignItems: "center",
                  bgcolor: isCurrent ? "rgba(54, 89, 187, 0.07)" : "transparent",
                  borderRadius: "10px",
                  display: "flex",
                  gap: 1.25,
                  my: 0.25,
                  px: 1.25,
                  py: 0.85,
                  transition: "all 0.15s ease",
                  "&:hover": {
                    bgcolor: isCurrent ? "rgba(54, 89, 187, 0.1)" : "rgba(241, 245, 249, 0.8)",
                  },
                }}
              >
                <Box
                  sx={{
                    alignItems: "center",
                    background: targetMeta.gradient,
                    borderRadius: "8px",
                    boxShadow: targetMeta.shadow,
                    display: "flex",
                    flexShrink: 0,
                    height: 32,
                    justifyContent: "center",
                    width: 32,
                  }}
                >
                  {targetMeta.icon}
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    noWrap
                    sx={{
                      color: "#1C252E",
                      fontSize: 13,
                      fontWeight: isCurrent ? 750 : 600,
                      lineHeight: 1.2,
                    }}
                  >
                    {targetMeta.label}
                  </Typography>
                  <Typography
                    noWrap
                    sx={{
                      color: "#667789",
                      fontSize: 11,
                      fontWeight: 400,
                      lineHeight: 1.2,
                      mt: 0.25,
                    }}
                  >
                    {targetMeta.subtitle}
                  </Typography>
                </Box>
                {isCurrent ? (
                  <CheckCircleRoundedIcon
                    sx={{
                      color: targetMeta.themeColor,
                      flexShrink: 0,
                      fontSize: 18,
                    }}
                  />
                ) : null}
              </MenuItem>
            );
          })}
        </Menu>
      ) : null}
    </Box>
  );
}
