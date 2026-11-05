"use client";

import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Toolbar from "@mui/material/Toolbar";
import { useState, type ReactNode } from "react";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";

import { PortalHeaderActions } from "./portal-header-actions";
import { PortalHeaderIdentity } from "./portal-header-identity";
import type { PortalNotificationTab } from "./portal-header-notification-data";
import { PortalHeaderNotifications } from "./portal-header-notifications";
import { portalHeaderAppBarSx } from "./portal-header-styles";
import { notificationPortalFromPath, usePortalNotifications } from "./use-portal-notifications";

import type { Workspace } from "@/platform/workspaces/workspace-domain";

interface HeaderProps {
  centerName?: string;
  headerControls?: ReactNode;
  headerTrailingControls?: ReactNode;
  hideIdentity?: boolean;
  portalPlan?: string;
  portalName?: string;
  notificationCount?: number;
  scrolled?: boolean;
  userName?: string;
  userEmail?: string;
  workspaceCapabilities?: readonly Workspace[];
  workspacePortals?: string[];
  onMenuOpen?: () => void;
  onNavigate?: (path: string) => void;
  onSignOut?: () => void;
}

export default function ErgPortalHeader({
  centerName,
  headerControls,
  headerTrailingControls,
  hideIdentity = false,
  portalPlan,
  portalName,
  notificationCount = 0,
  scrolled = false,
  userName,
  userEmail,
  workspaceCapabilities,
  workspacePortals,
  onMenuOpen,
  onNavigate,
  onSignOut,
}: HeaderProps) {
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<PortalNotificationTab>("all");
  const { notifications, unreadCount } = usePortalNotifications(
    notificationPortalFromPath(typeof window === "undefined" ? "" : window.location.pathname),
    activeTab,
    notificationOpen,
  );

  return (
    <>
      <AppBar position="sticky" sx={portalHeaderAppBarSx(scrolled)}>
        <Toolbar sx={{ gap: { xs: 0.5, sm: 1 }, minHeight: { xs: "46px !important", md: "50px !important" }, px: { xs: "12px !important", sm: "16px !important", md: "24px !important" }, position: "relative", zIndex: 1 }}>
          {onMenuOpen ? (
            <IconButton
              aria-label="Mở menu"
              onClick={onMenuOpen}
              size="small"
              sx={{ display: { xs: "inline-flex", lg: "none" }, flexShrink: 0, height: { xs: 44, md: "auto" }, mr: 0.25, width: { xs: 44, md: "auto" } }}
            >
              <MenuRoundedIcon sx={{ fontSize: 20 }} />
            </IconButton>
          ) : null}
          <PortalHeaderIdentity
            centerName={centerName}
            headerControls={headerControls}
            headerTrailingControls={headerTrailingControls}
            hideIdentity={hideIdentity}
            portalName={portalName}
            portalPlan={portalPlan}
          />
          <Box sx={{ flex: 1, minWidth: 8 }} />
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Box sx={{ display: { xs: "inline-flex", lg: "none" } }}>
              <PortalHeaderActions
                notificationCount={unreadCount ?? notificationCount}
                onOpenNotifications={() => setNotificationOpen(true)}
                userName={userName}
                userEmail={userEmail}
                onNavigate={onNavigate}
                onSignOut={onSignOut}
                workspaceCapabilities={workspaceCapabilities}
                workspacePortals={workspacePortals}
              />
            </Box>
          </Box>
        </Toolbar>
      </AppBar>
      <PortalHeaderNotifications
        activeTab={activeTab}
        notifications={notifications}
        onClose={() => setNotificationOpen(false)}
        onTabChange={setActiveTab}
        open={notificationOpen}
      />
    </>
  );
}
