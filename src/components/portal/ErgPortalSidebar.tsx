"use client";

import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Drawer from "@mui/material/Drawer";
import Tooltip from "@mui/material/Tooltip";
import { useLocation } from "@tanstack/react-router";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";
import type { MenuGroup, PortalInfo } from "./ErgPortalLayout";
import { EXPANDED_SIDEBAR_WIDTH, PORTAL_SIDEBAR_TRANSITION, SIDEBAR_GUTTER } from "./portal-sidebar-motion";
import {
  NAV_BORDER,
  NAV_CARD_RADIUS,
  NAV_CARD_SHADOW,
  NAV_CHILD_ICON_SIZE,
  NAV_ON_PRIMARY,
  NAV_PRIMARY,
  NAV_TRANSITION,
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
        <Tooltip placement="right" title={collapsed ? "Mở rộng menu" : "Thu gọn menu"}>
          <ButtonBase
            aria-label={collapsed ? "Mở rộng menu" : "Thu gọn menu"}
            onClick={() => onCollapsedChange(!collapsed)}
            sx={{
              // Round handle straddling the card's right edge, vertically centred.
              alignItems: "center",
              bgcolor: "background.paper",
              border: `1px solid ${NAV_BORDER}`,
              borderRadius: "50%",
              boxShadow: ergEnterpriseTokens.shadow.xs,
              color: "text.secondary",
              display: "flex",
              height: 24,
              justifyContent: "center",
              position: "absolute",
              right: -SIDEBAR_GUTTER,
              top: "50%",
              transform: "translateY(-50%)",
              transition: NAV_TRANSITION,
              width: 24,
              zIndex: 2,
              "&:hover": { bgcolor: NAV_PRIMARY, borderColor: NAV_PRIMARY, color: NAV_ON_PRIMARY },
              "&.Mui-focusVisible": { outline: `2px solid ${NAV_PRIMARY}`, outlineOffset: 2 },
              ...REDUCED_MOTION,
            }}
          >
            <ChevronLeftRoundedIcon
              sx={{
                flexShrink: 0,
                fontSize: NAV_CHILD_ICON_SIZE,
                transform: collapsed ? "rotate(180deg)" : "none",
                transition: `transform ${PORTAL_SIDEBAR_TRANSITION}`,
                ...REDUCED_MOTION,
              }}
            />
          </ButtonBase>
        </Tooltip>
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
