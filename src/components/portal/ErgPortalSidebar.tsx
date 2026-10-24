"use client";

import { Box, Drawer, IconButton } from "@mui/material";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import { useLocation } from "@tanstack/react-router";
import type { MenuGroup, PortalInfo } from "./ErgPortalLayout";
import {
  NAV_ACTIVE_BG,
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
          backdropFilter: "none",
          WebkitBackdropFilter: "none",
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
          zIndex: 1301,
          "&::before": {
            background: "none",
            content: '""',
            inset: 0,
            pointerEvents: "none",
            position: "absolute",
          },
          "&::after": {
            background: "none",
            content: '""',
            inset: 0,
            opacity: 0,
            pointerEvents: "none",
            position: "absolute",
          },
        },
      }}
    >
      {!mobile ? <IconButton
        aria-label={collapsed ? "Mo rong menu" : "Thu gon menu"}
        disableRipple
        onClick={() => onCollapsedChange(!collapsed)}
        size="small"
        sx={{
          background: NAV_BUTTON_BG,
          border: `1px solid ${NAV_ACTIVE_BORDER}`,
          boxShadow:
            "0 8px 16px rgba(94,108,187,0.1), inset 0 1px 0 rgba(255,255,255,0.78)",
          color: NAV_ITEM_COLOR,
          height: 26,
          position: "absolute",
          right: -13,
          top: 20,
          width: 26,
          zIndex: 1300,
          "&:hover": {
            background: NAV_ACTIVE_BG,
            borderColor: NAV_ACTIVE_BORDER,
            color: NAV_PRIMARY,
          },
        }}
      >
        <ChevronLeftRoundedIcon
          sx={{
            fontSize: 18,
            transform: collapsed ? "rotate(180deg)" : "rotate(0deg)",
            transition: `transform ${SIDEBAR_MOTION_CURVE}`,
            "@media (prefers-reduced-motion: reduce)": {
              transition: "none",
            },
          }}
        />
      </IconButton> : null}

      <Box
        sx={{
          boxSizing: "border-box",
          height: 68,
          position: "relative",
          zIndex: 1,
        }}
      >
        <SidebarLogo collapsed={false} active={!collapsed} onNavigate={onNavigate} />
        <SidebarLogo collapsed active={collapsed} onNavigate={onNavigate} />
      </Box>

      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
          position: "relative",
          width: "100%",
          zIndex: 1,
        }}
      >
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
