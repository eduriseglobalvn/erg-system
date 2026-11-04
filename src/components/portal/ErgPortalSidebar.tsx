"use client";

import { Box, Drawer, IconButton } from "@mui/material";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import { alpha } from "@mui/material/styles";
import { useLocation } from "@tanstack/react-router";
import type { MenuGroup, PortalInfo } from "./ErgPortalLayout";
import {
  NAV_ACTIVE_BORDER,
  NAV_BUTTON_BG,
  NAV_ITEM_COLOR,
  NAV_PANEL_BORDER,
  NAV_PANEL_SHADOW,
  NAV_PRIMARY,
  NAV_SURFACE_BG,
  SIDEBAR_MOTION_CURVE,
} from "./portal-sidebar-styles";
import { normalizedLabel } from "./portal-sidebar-utils";
import { PortalSidebarWorkspaceHeader } from "./portal-sidebar-workspace-header";
import { SidebarLogo } from "./portal-sidebar-logo";
import { SidebarNavigationLayer } from "./portal-sidebar-nav-layer";
import { EXPANDED_SIDEBAR_WIDTH } from "./portal-sidebar-motion";

interface SidebarProps {
  collapsed: boolean;
  menuGroups: MenuGroup[];
  mobile?: boolean;
  onClose?: () => void;
  portalInfo?: PortalInfo;
  notificationCount?: number;
  onCollapsedChange: (collapsed: boolean) => void;
  onNavigate: (path: string) => void;
  onSignOut?: () => void;
  open?: boolean;
}

export default function ErgPortalSidebar({
  collapsed,
  menuGroups,
  mobile = false,
  onClose,
  portalInfo,
  notificationCount = 0,
  onCollapsedChange,
  onNavigate,
  onSignOut,
  open = true,
}: SidebarProps) {
  const location = useLocation();
  const currentPath = location.pathname;
  const hideSidebarBottom = false;
  void normalizedLabel(portalInfo?.name ?? "");
  void SidebarLogo;

  return (
    <Drawer
      ModalProps={{ keepMounted: true }}
      onClose={onClose}
      open={open}
      variant={mobile ? "temporary" : "permanent"}
      sx={{
        flexShrink: 0,
        minWidth: 0,
        width: mobile ? EXPANDED_SIDEBAR_WIDTH : "100%",
        "& .MuiDrawer-paper": {
          backgroundColor: NAV_SURFACE_BG,
          backgroundImage: "none",
          backdropFilter: "blur(20px) saturate(190%)",
          WebkitBackdropFilter: "blur(20px) saturate(190%)",
          border: "none",
          borderRadius: 0,
          borderRight: `1px solid ${NAV_PANEL_BORDER}`,
          boxSizing: "border-box",
          boxShadow: NAV_PANEL_SHADOW,
          color: NAV_ITEM_COLOR,
          display: "flex",
          flexDirection: "column",
          overflow: "visible",
          position: mobile ? "fixed" : "relative",
          transition: "none",
          width: mobile ? EXPANDED_SIDEBAR_WIDTH : "100%",
          zIndex: mobile ? 1250 : 1,
        },
      }}
    >
      {!mobile ? (
        <IconButton
          aria-label={collapsed ? "Mo rong menu" : "Thu gon menu"}
          disableRipple
          onClick={() => onCollapsedChange(!collapsed)}
          size="small"
          sx={{
            background: NAV_BUTTON_BG,
            backdropFilter: "blur(12px)",
            border: `1px solid ${NAV_ACTIVE_BORDER}`,
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255,255,255,0.8)",
            color: NAV_ITEM_COLOR,
            height: 26,
            position: "absolute",
            right: -13,
            top: 51,
            transition: "all 120ms cubic-bezier(0.16, 1, 0.3, 1)",
            width: 26,
            zIndex: 1300,
            "&:active": { transform: "scale(0.92)", transition: "transform 80ms ease-out" },
            "&:hover": {
              background: "#FFFFFF",
              borderColor: alpha(NAV_PRIMARY, 0.35),
              boxShadow: `0 3px 10px ${alpha(NAV_PRIMARY, 0.18)}`,
              color: NAV_PRIMARY,
            },
          }}
        >
          <ChevronLeftRoundedIcon
            sx={{
              fontSize: 18,
              transform: collapsed ? "rotate(180deg)" : "rotate(0deg)",
              transition: `transform ${SIDEBAR_MOTION_CURVE}`,
              "@media (prefers-reduced-motion: reduce)": { transition: "none" },
            }}
          />
        </IconButton>
      ) : null}

      <Box sx={{ boxSizing: "border-box", height: 64, position: "relative", zIndex: 1 }}>
        <PortalSidebarWorkspaceHeader
          active={!collapsed}
          collapsed={false}
          mobile={mobile}
          onNavigate={onNavigate}
          portalInfo={portalInfo}
        />
        <PortalSidebarWorkspaceHeader
          active={collapsed}
          collapsed
          mobile={mobile}
          onNavigate={onNavigate}
          portalInfo={portalInfo}
        />
      </Box>

      <Box sx={{ flex: 1, minHeight: 0, overflow: "hidden", position: "relative", width: "100%", zIndex: 1 }}>
        <SidebarNavigationLayer
          active={!collapsed}
          collapsed={false}
          currentPath={currentPath}
          hideSidebarBottom={hideSidebarBottom}
          menuGroups={menuGroups}
          notificationCount={notificationCount}
          onNavigate={onNavigate}
          onSignOut={onSignOut}
          portalInfo={portalInfo}
        />
        <SidebarNavigationLayer
          active={collapsed}
          collapsed
          currentPath={currentPath}
          hideSidebarBottom={hideSidebarBottom}
          menuGroups={menuGroups}
          notificationCount={notificationCount}
          onNavigate={onNavigate}
          onSignOut={onSignOut}
          portalInfo={portalInfo}
        />
      </Box>
    </Drawer>
  );
}
