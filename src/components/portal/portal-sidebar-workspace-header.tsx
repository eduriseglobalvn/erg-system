"use client";

import { useState, type ReactNode } from "react";
import AdminPanelSettingsRoundedIcon from "@mui/icons-material/AdminPanelSettingsRounded";
import BusinessRoundedIcon from "@mui/icons-material/BusinessRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import UnfoldMoreRoundedIcon from "@mui/icons-material/UnfoldMoreRounded";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
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
import { workspaceCapabilities, workspacesFromLegacyPortals } from "@/platform/workspaces/workspace-switcher";
import { getAuthScope } from "@/platform/auth/api/auth-storage";
import type { PortalInfo } from "./ErgPortalLayout";
import {
  brandTileSx,
  NAV_BORDER,
  NAV_CARD_SHADOW,
  NAV_FS,
  NAV_FW,
  NAV_HOVER_BG,
  NAV_ICON_SIZE,
  NAV_ITEM_RADIUS,
  NAV_PADDING,
  NAV_PRIMARY,
  NAV_RAISED_RADIUS,
  NAV_TILE_SIZE,
} from "./portal-sidebar-styles";

function workspaceFromPath(
  pathname: string,
  hostname = typeof window === "undefined" ? "" : window.location.hostname,
): Workspace {
  const segment = pathname.split("/").filter(Boolean)[0];
  const host = hostname.toLowerCase();
  if (segment === "admin") return "ADMIN";
  if (segment === "student") return "STUDENT";
  if (host === canonicalCrmWorkspaceHostForRuntime(hostname)) return "CRM";
  if (host === "crm.erg.edu.local" || host === "crm.erg.edu.vn") return "CRM";
  if (host === "lcms.erg.edu.local") return "ADMIN";
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
  { label: string; subtitle: string; icon: ReactNode; localPath: string }
> = {
  ADMIN: { label: "Admin LMS", subtitle: "Quản trị hệ thống", icon: <AdminPanelSettingsRoundedIcon />, localPath: "/admin" },
  TEACHER: { label: "Giáo viên", subtitle: "Không gian giảng dạy", icon: <SchoolRoundedIcon />, localPath: "/teacher/home" },
  STUDENT: { label: "Học sinh", subtitle: "Cổng học tập & bài tập", icon: <MenuBookRoundedIcon />, localPath: "/student" },
  CRM: { label: "CRM Tuyển sinh", subtitle: "Quản lý khách hàng", icon: <BusinessRoundedIcon />, localPath: "/" },
};

function WorkspaceTile({ workspace, size }: { workspace: Workspace; size: number }) {
  return (
    <Box sx={{ ...brandTileSx(size), "& .MuiSvgIcon-root": { fontSize: NAV_ICON_SIZE } }}>
      {WORKSPACE_META[workspace].icon}
    </Box>
  );
}

/**
 * Brand header of the sidebar and the only portal switcher: a solid logo tile plus the current
 * portal name; clicking it opens the list of portals the user can access. Collapsed = tile only.
 */
export function PortalSidebarWorkspaceHeader({
  active = true,
  collapsed,
  fluid = false,
  onNavigate,
  portalInfo,
}: {
  /** When false the header is hidden from assistive tech and focus. */
  active?: boolean;
  collapsed: boolean;
  /** Plain bordered block (no sidebar padding), used by the student dashboard menu. */
  fluid?: boolean;
  onNavigate?: (path: string) => void;
  portalInfo?: PortalInfo;
}) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const pathname = useLocation()?.pathname || "";

  const current = workspaceFromPath(pathname);
  const meta = WORKSPACE_META[current];

  const sessionWorkspaces = typeof window !== "undefined" ? getAuthScope().session?.workspaces : undefined;
  const granted = portalInfo?.workspaceCapabilities?.length
    ? [...portalInfo.workspaceCapabilities]
    : sessionWorkspaces?.length
      ? [...sessionWorkspaces]
      : workspacesFromLegacyPortals(portalInfo?.workspacePortals ?? [], current);
  const capabilities = workspaceCapabilities(granted, current, pathname, {
    originForWorkspace: runtimeOriginForWorkspace,
  });
  const canSwitch = capabilities.length >= 2;
  const triggerProps = {
    "aria-expanded": Boolean(anchorEl),
    "aria-haspopup": canSwitch ? ("menu" as const) : undefined,
    "aria-label": `Không gian làm việc: ${meta.label}`,
    onClick: (event: { currentTarget: HTMLElement }) => canSwitch && setAnchorEl(event.currentTarget),
  };

  const handleSelectWorkspace = (target: Workspace, fallbackHref?: string) => {
    setAnchorEl(null);
    window.localStorage?.setItem("erg_last_workspace", target);
    const targetPath = WORKSPACE_META[target]?.localPath ?? fallbackHref ?? "/";
    if (onNavigate) onNavigate(targetPath);
    else window.location.assign(targetPath);
  };

  return (
    <Box
      aria-hidden={!active}
      inert={!active}
      sx={{
        display: "flex",
        justifyContent: collapsed ? "center" : "flex-start",
        ...(fluid ? {} : { pb: 1, pt: `${NAV_PADDING}px`, px: `${NAV_PADDING}px` }),
      }}
    >
      {collapsed ? (
        <Tooltip placement="right" title={`${meta.label} • ${meta.subtitle}`}>
          <ButtonBase {...triggerProps} sx={{ borderRadius: NAV_ITEM_RADIUS, cursor: canSwitch ? "pointer" : "default" }}>
            <WorkspaceTile size={NAV_TILE_SIZE} workspace={current} />
          </ButtonBase>
        </Tooltip>
      ) : (
        <ButtonBase
          {...triggerProps}
          sx={{
            alignItems: "center",
            bgcolor: anchorEl ? NAV_HOVER_BG : "transparent",
            border: fluid ? `1px solid ${NAV_BORDER}` : "none",
            borderRadius: NAV_ITEM_RADIUS,
            cursor: canSwitch ? "pointer" : "default",
            gap: "12px",
            justifyContent: "flex-start",
            p: fluid ? "6px" : "0 8px 0 0",
            textAlign: "left",
            transition: "background-color 200ms",
            width: "100%",
            "&:hover": canSwitch ? { bgcolor: NAV_HOVER_BG } : {},
          }}
        >
          <WorkspaceTile size={NAV_TILE_SIZE} workspace={current} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography noWrap sx={{ color: "text.primary", fontSize: NAV_FS.title, fontWeight: NAV_FW.semi, lineHeight: 1.3 }}>
              {meta.label}
            </Typography>
            <Typography noWrap sx={{ color: "text.secondary", fontSize: NAV_FS.caption, lineHeight: 1.3 }}>
              {meta.subtitle}
            </Typography>
          </Box>
          {canSwitch ? <UnfoldMoreRoundedIcon sx={{ color: "text.secondary", flexShrink: 0, fontSize: NAV_ICON_SIZE }} /> : null}
        </ButtonBase>
      )}

      {canSwitch ? (
        <Menu
          anchorEl={anchorEl}
          anchorOrigin={collapsed ? { horizontal: "right", vertical: "top" } : { horizontal: "left", vertical: "bottom" }}
          onClose={() => setAnchorEl(null)}
          open={Boolean(anchorEl)}
          slotProps={{
            paper: {
              sx: {
                border: `1px solid ${NAV_BORDER}`,
                borderRadius: NAV_RAISED_RADIUS,
                boxShadow: NAV_CARD_SHADOW,
                ml: collapsed ? 1.5 : 0,
                minWidth: 248,
                mt: collapsed ? 0 : 0.75,
                p: "6px",
              },
            },
            root: { sx: { zIndex: 1400 } },
          }}
          transformOrigin={{ horizontal: "left", vertical: "top" }}
        >
          <Typography
            component="div"
            sx={{ color: "text.secondary", fontSize: NAV_FS.caption, fontWeight: NAV_FW.semi, px: "10px", py: "6px" }}
          >
            Không gian làm việc
          </Typography>
          {capabilities.map((cap) => {
            const isCurrent = cap.workspace === current;
            const target = WORKSPACE_META[cap.workspace] ?? WORKSPACE_META.TEACHER;
            return (
              <MenuItem
                key={cap.workspace}
                onClick={() => handleSelectWorkspace(cap.workspace, cap.href)}
                selected={isCurrent}
                sx={{ borderRadius: NAV_ITEM_RADIUS, gap: "12px", my: "2px", py: "6px" }}
              >
                <WorkspaceTile size={32} workspace={cap.workspace} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography noWrap sx={{ color: "text.primary", fontSize: NAV_FS.label, fontWeight: NAV_FW.semi, lineHeight: 1.3 }}>
                    {target.label}
                  </Typography>
                  <Typography noWrap sx={{ color: "text.secondary", fontSize: NAV_FS.caption, lineHeight: 1.3 }}>
                    {target.subtitle}
                  </Typography>
                </Box>
                {isCurrent ? <CheckRoundedIcon aria-label="Đang chọn" sx={{ color: NAV_PRIMARY, flexShrink: 0, fontSize: NAV_ICON_SIZE }} /> : null}
              </MenuItem>
            );
          })}
        </Menu>
      ) : null}
    </Box>
  );
}
