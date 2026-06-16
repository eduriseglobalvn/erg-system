/**
 * CenterUp PageLayout — Complete layout with sidebar + header + content
 * EXACT CenterUp pixel match
 *
 * Sidebar: 280px, #1C252E
 * Header: 64px, white, border-bottom
 * Content: flex-1, overflow-auto
 *
 * Usage:
 *   <CenterUpLayout menuGroups={LCMS_MENU}>
 *     <Outlet />
 *   </CenterUpLayout>
 */
"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Box } from "@mui/material";
import type { DashboardLeafVariant } from "@/layouts/dashboard/types/dashboard-types";
import { useNavigate } from "@/routes/router-compat";
import CenterUpHeader from "./CenterUpHeader";
import CenterUpSidebar from "./CenterUpSidebar";

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
}

interface CenterUpLayoutProps {
  menuGroups: MenuGroup[];
  children: ReactNode;
  contentMode?: "flush" | "padded";
  headerControls?: ReactNode;
  hideHeaderIdentity?: boolean;
  headerTrailingControls?: ReactNode;
  portalInfo?: PortalInfo;
  notificationCount?: number;
}

export default function CenterUpLayout({
  menuGroups,
  children,
  contentMode = "padded",
  headerControls,
  hideHeaderIdentity = false,
  headerTrailingControls,
  portalInfo,
  notificationCount,
}: CenterUpLayoutProps) {
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const mainRef = useRef<HTMLElement | null>(null);

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
      sx={{
        bgcolor: "#FFFFFF",
        display: "flex",
        height: "100vh",
        maxWidth: "100vw",
        minWidth: 0,
        overflow: "hidden",
        width: "100vw",
      }}
    >
      <CenterUpSidebar
        collapsed={sidebarCollapsed}
        menuGroups={menuGroups}
        portalInfo={portalInfo}
        onCollapsedChange={setSidebarCollapsed}
        onNavigate={(path) => navigate(path)}
      />
      <Box
        sx={{
          display: "flex",
          flex: "1 1 auto",
          flexDirection: "column",
          minWidth: 0,
          overflow: "hidden",
          width: 0,
        }}
      >
        <CenterUpHeader
          centerName={portalInfo?.centerName}
          headerControls={headerControls}
          hideIdentity={hideHeaderIdentity}
          headerTrailingControls={headerTrailingControls}
          portalPlan={portalInfo?.plan}
          portalName={portalInfo?.name}
          notificationCount={notificationCount}
          scrolled={headerScrolled}
          userName={portalInfo?.userName}
        />
        <Box
          component="main"
          ref={mainRef}
          sx={{
            flex: 1,
            minHeight: 0,
            overflow: contentMode === "flush" ? "hidden" : "auto",
            overflowX: "hidden",
            p: contentMode === "flush" ? 0 : 3,
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
