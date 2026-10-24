"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Box } from "@mui/material";
import useMediaQuery from "@mui/material/useMediaQuery";
import type { DashboardLeafVariant } from "@/layouts/dashboard/types/dashboard-types";
import { useNavigate } from "@tanstack/react-router";
import ErgPortalHeader from "./ErgPortalHeader";
import ErgPortalSidebar from "./ErgPortalSidebar";
import {
  COLLAPSED_SIDEBAR_WIDTH,
  EXPANDED_SIDEBAR_WIDTH,
  PORTAL_SIDEBAR_TRANSITION,
} from "./portal-sidebar-motion";
import type { Workspace } from "@/platform/workspaces/workspace-domain";

export interface MenuItem {
  id?: string;
  label: string;
  icon?: ReactNode;
  path?: string;
  children?: MenuItem[];
  badge?: string;
  description?: string;
  section?: string;
  variant?: DashboardLeafVariant;
}

export interface MenuGroup {
  label: string;
  items: MenuItem[];
}

export interface PortalInfo {
  name: string;
  plan?: string;
  centerName?: string;
  userName?: string;
  userEmail?: string;
  workspaceCapabilities?: readonly Workspace[];
  workspacePortals?: string[];
}

interface ErgPortalLayoutProps {
  menuGroups: MenuGroup[];
  children: ReactNode;
  contentMode?: "flush" | "padded";
  headerControls?: ReactNode;
  hideHeaderIdentity?: boolean;
  headerTrailingControls?: ReactNode;
  portalInfo?: PortalInfo;
  notificationCount?: number;
}

export default function ErgPortalLayout({
  menuGroups,
  children,
  contentMode = "padded",
  headerControls,
  hideHeaderIdentity = false,
  headerTrailingControls,
  portalInfo,
  notificationCount,
}: ErgPortalLayoutProps) {
  const navigate = useNavigate();
  const isCompact = useMediaQuery("(max-width:1279px)");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const mainRef = useRef<HTMLElement | null>(null);
  const sidebarWidth = sidebarCollapsed
    ? COLLAPSED_SIDEBAR_WIDTH
    : EXPANDED_SIDEBAR_WIDTH;

  useEffect(() => {
    const mainElement = mainRef.current;
    if (!mainElement || contentMode === "flush") {
      setHeaderScrolled(false);
      return;
    }

    const handleScroll = () => {
      setHeaderScrolled(mainElement.scrollTop > 12);
    };

    handleScroll();
    mainElement.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      mainElement.removeEventListener("scroll", handleScroll);
    };
  }, [contentMode, children]);

  return (
    <Box
      data-sidebar-width={sidebarWidth}
      data-testid="erg-portal-shell"
      sx={{
        bgcolor: "#FFFFFF",
        display: "grid",
        gridTemplateColumns: isCompact ? "minmax(0, 1fr)" : `${sidebarWidth}px minmax(0, 1fr)`,
        height: "100dvh",
        maxWidth: "100vw",
        minHeight: "100dvh",
        minWidth: 0,
        overflow: "hidden",
        transition: `grid-template-columns ${PORTAL_SIDEBAR_TRANSITION}`,
        width: "100vw",
        "@media (prefers-reduced-motion: reduce)": {
          transition: "none",
        },
      }}
    >
      {isCompact ? (
        <ErgPortalSidebar
          collapsed={false}
          menuGroups={menuGroups}
          mobile
          onClose={() => setMobileNavigationOpen(false)}
          onCollapsedChange={setSidebarCollapsed}
          onNavigate={(path) => {
            setMobileNavigationOpen(false);
            void navigate({ href: path });
          }}
          open={mobileNavigationOpen}
          portalInfo={portalInfo}
          notificationCount={notificationCount}
        />
      ) : (
        <ErgPortalSidebar
          collapsed={sidebarCollapsed}
          menuGroups={menuGroups}
          onCollapsedChange={setSidebarCollapsed}
          onNavigate={(path) => void navigate({ href: path })}
          portalInfo={portalInfo}
          notificationCount={notificationCount}
        />
      )}
      <Box
        data-sidebar-collapsed={sidebarCollapsed}
        data-testid="erg-portal-main"
        sx={{
          display: "flex",
          flex: "1 1 auto",
          flexDirection: "column",
          minWidth: 0,
          overflow: "hidden",
          width: "100%",
        }}
      >
        <ErgPortalHeader
          centerName={portalInfo?.centerName}
          headerControls={headerControls}
          onMenuOpen={() => setMobileNavigationOpen(true)}
          hideIdentity={hideHeaderIdentity}
          headerTrailingControls={headerTrailingControls}
          portalPlan={portalInfo?.plan}
          portalName={portalInfo?.name}
          notificationCount={notificationCount}
          scrolled={headerScrolled}
          userName={portalInfo?.userName}
          userEmail={portalInfo?.userEmail}
          workspaceCapabilities={portalInfo?.workspaceCapabilities}
          workspacePortals={portalInfo?.workspacePortals}
        />
        <Box
          component="main"
          ref={mainRef}
          sx={{
            flex: 1,
            minHeight: 0,
            overflow: contentMode === "flush" ? "hidden" : "auto",
            overflowX: "hidden",
            p: contentMode === "flush" ? 0 : { xs: 1.5, sm: 2, md: 3 },
            width: "100%",
            bgcolor: '#FFFFFF',
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}
