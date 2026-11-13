"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Box from "@mui/material/Box";
import useMediaQuery from "@mui/material/useMediaQuery";
import type { DashboardLeafVariant } from "@/layouts/dashboard/types/dashboard-types";
import { useNavigate } from "@tanstack/react-router";
import { ERG_FULL_VIEWPORT_FALLBACK, ErgMobileDock, ergMobileDockClearance, type ErgMobileDockItem } from "./erg-mobile-dock";
import { OfflineShellStatus } from "@/components/erg-mui/offline";
import { PwaInstallBanner } from "@/components/pwa/pwa-install-banner";
import ErgPortalHeader from "./ErgPortalHeader";
import ErgPortalSidebar from "./ErgPortalSidebar";
import {
  COLLAPSED_SIDEBAR_WIDTH,
  EXPANDED_SIDEBAR_WIDTH,
  PORTAL_SIDEBAR_TRANSITION,
  SIDEBAR_GUTTER,
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

/** Phone navigation: a bottom dock replaces the hamburger + drawer below `md`. */
export interface PortalMobileDock<TId extends string = string> {
  ariaLabel: string;
  items: ReadonlyArray<ErgMobileDockItem<TId>>;
  activeId: TId | null;
  /** Renders the sheet the dock item with `opensSheet` opens. */
  renderSheet: (sheet: { open: boolean; onClose: () => void; onNavigate: (path: string) => void }) => ReactNode;
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
  mobileDock?: PortalMobileDock;
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
  mobileDock,
}: ErgPortalLayoutProps) {
  const navigate = useNavigate();
  const isCompact = useMediaQuery("(max-width:1279px)");
  const isPhone = useMediaQuery("(max-width:899px)");
  const dock = mobileDock && isPhone ? mobileDock : undefined;
  const [allOpen, setAllOpen] = useState(false);
  // Leaving phone width closes the sheet (adjusting state while rendering, not in an effect).
  if (!isPhone && allOpen) setAllOpen(false);
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
        bgcolor: "background.default",
        display: "grid",
        gridTemplateColumns: isCompact ? "minmax(0, 1fr)" : `${sidebarWidth + SIDEBAR_GUTTER * 2}px minmax(0, 1fr)`,
        // Pin the row to the viewport so a long menu scrolls inside the card instead of growing it.
        gridTemplateRows: "minmax(0, 1fr)",
        height: "100dvh",
        maxWidth: "100vw",
        minHeight: "100dvh",
        ...ERG_FULL_VIEWPORT_FALLBACK,
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
        // With a dock the phone has no sidebar at all: the sheet replaces the drawer.
        dock ? null : (
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
        )
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
          onMenuOpen={dock ? undefined : () => setMobileNavigationOpen(true)}
          hideIdentity={hideHeaderIdentity}
          hideNotifications={Boolean(dock?.items.some((item) => item.id === "inbox"))}
          headerTrailingControls={headerTrailingControls}
          portalPlan={portalInfo?.plan}
          portalName={portalInfo?.name}
          notificationCount={notificationCount}
          scrolled={headerScrolled}
          userName={portalInfo?.userName}
          userEmail={portalInfo?.userEmail}
          workspaceCapabilities={portalInfo?.workspaceCapabilities}
          workspacePortals={portalInfo?.workspacePortals}
          onNavigate={(path) => void navigate({ href: path })}
        />
        {/* Below lg the header shows its own "Mất kết nối" chip; from lg that chip is hidden, so say it here. */}
        <Box sx={{ display: { xs: "none", lg: "block" }, flexShrink: 0 }}><OfflineShellStatus /></Box>
        <Box
          component="main"
          ref={mainRef}
          sx={{
            flex: 1,
            minHeight: 0,
            overflow: contentMode === "flush" ? "hidden" : "auto",
            overflowX: "hidden",
            p: contentMode === "flush" ? 0 : { xs: 1.5, sm: 2, md: 3 },
            // Keep the last row clear of the floating dock (hidden from md). Responsive like `p`, or p's xs media rule wins.
            ...(dock ? { pb: { xs: ergMobileDockClearance(), md: contentMode === "flush" ? 0 : 3 } } : {}),
            width: "100%",
            bgcolor: '#FFFFFF',
          }}
        >
          {children}
        </Box>
      </Box>
      {dock ? (
        <>
          <ErgMobileDock
            activeId={dock.activeId}
            ariaLabel={dock.ariaLabel}
            hideAt="md"
            items={dock.items}
            onNavigate={(path) => void navigate({ href: path })}
            onOpenSheet={() => setAllOpen(true)}
          />
          <PwaInstallBanner />
          {dock.renderSheet({ open: allOpen, onClose: () => setAllOpen(false), onNavigate: (path) => void navigate({ href: path }) })}
        </>
      ) : null}
    </Box>
  );
}
