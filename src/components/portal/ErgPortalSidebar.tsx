"use client";

import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import { useLocation } from "@tanstack/react-router";
import type { MenuGroup, PortalInfo } from "./ErgPortalLayout";
import { EXPANDED_SIDEBAR_WIDTH, PORTAL_SIDEBAR_TRANSITION, SIDEBAR_GUTTER } from "./portal-sidebar-motion";
import {
  NAV_BORDER,
  NAV_CARD_RADIUS,
  NAV_CARD_SHADOW,
  NAV_HOVER_BG,
  NAV_ICON_SIZE,
  NAV_PRIMARY,
  REDUCED_MOTION,
} from "./portal-sidebar-styles";
import { PortalSidebarWorkspaceHeader } from "./portal-sidebar-workspace-header";
import { SidebarNavigationLayer } from "./portal-sidebar-nav-layer";

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

/** Premium sidebar: one floating white card (desktop) or a full-height temporary drawer (mobile). */
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
  const currentPath = useLocation().pathname;

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
          backgroundColor: "background.paper",
          backgroundImage: "none",
          border: mobile ? "none" : `1px solid ${NAV_BORDER}`,
          borderRadius: mobile ? 0 : NAV_CARD_RADIUS,
          boxShadow: NAV_CARD_SHADOW,
          boxSizing: "border-box",
          color: "text.primary",
          display: "flex",
          flexDirection: "column",
          overflow: "visible",
          transition: "none",
          ...(mobile
            ? { width: EXPANDED_SIDEBAR_WIDTH }
            : {
                height: `calc(100% - ${SIDEBAR_GUTTER * 2}px)`,
                m: `${SIDEBAR_GUTTER}px`,
                position: "relative",
                width: `calc(100% - ${SIDEBAR_GUTTER * 2}px)`,
                zIndex: 1,
              }),
        },
      }}
    >
      {!mobile ? (
        <IconButton
          aria-label={collapsed ? "Mở rộng menu" : "Thu gọn menu"}
          onClick={() => onCollapsedChange(!collapsed)}
          sx={{
            bgcolor: "background.paper",
            border: `1px solid ${NAV_BORDER}`,
            boxShadow: NAV_CARD_SHADOW,
            color: "text.secondary",
            height: 28,
            position: "absolute",
            right: -14,
            top: 18,
            width: 28,
            zIndex: 2,
            "&:hover": { bgcolor: NAV_HOVER_BG, color: NAV_PRIMARY },
          }}
        >
          <ChevronLeftRoundedIcon
            sx={{
              fontSize: NAV_ICON_SIZE,
              transform: collapsed ? "rotate(180deg)" : "none",
              transition: `transform ${PORTAL_SIDEBAR_TRANSITION}`,
              ...REDUCED_MOTION,
            }}
          />
        </IconButton>
      ) : null}

      <Box sx={{ borderRadius: "inherit", display: "flex", flex: 1, flexDirection: "column", minHeight: 0, overflow: "hidden" }}>
        <PortalSidebarWorkspaceHeader collapsed={collapsed} onNavigate={onNavigate} portalInfo={portalInfo} />
        <SidebarNavigationLayer
          collapsed={collapsed}
          currentPath={currentPath}
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
