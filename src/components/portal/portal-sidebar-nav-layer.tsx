import { Box, List, Typography } from "@mui/material";
import type { MenuGroup, MenuItem, PortalInfo } from "./ErgPortalLayout";
import {
  COLLAPSED_SIDEBAR_WIDTH,
  EXPANDED_SIDEBAR_WIDTH,
} from "./portal-sidebar-motion";
import {
  NAV_MUTED_COLOR,
  SIDEBAR_FADE_EASING,
  SIDEBAR_MOTION_CURVE,
} from "./portal-sidebar-styles";
import { SidebarBottom } from "./portal-sidebar-bottom";
import { SidebarBranchItem } from "./portal-sidebar-branch-item";
import { SidebarCompactItem } from "./portal-sidebar-compact-item";
import { SidebarLeafItem } from "./portal-sidebar-leaf-item";

function SidebarItem({
  collapsed,
  item,
  currentPath,
  onNavigate,
  sidebarActive,
}: {
  collapsed: boolean;
  item: MenuItem;
  currentPath: string;
  onNavigate: (path: string) => void;
  sidebarActive: boolean;
}) {
  if (collapsed) {
    return (
      <SidebarCompactItem
        currentPath={currentPath}
        item={item}
        onNavigate={onNavigate}
        sidebarActive={sidebarActive}
      />
    );
  }

  if (item.children?.length) {
    return (
      <SidebarBranchItem
        currentPath={currentPath}
        item={item}
        onNavigate={onNavigate}
      />
    );
  }

  return (
    <SidebarLeafItem
      currentPath={currentPath}
      item={item}
      onNavigate={onNavigate}
    />
  );
}

export function SidebarNavigationLayer({
  active,
  collapsed,
  currentPath,
  hideSidebarBottom,
  menuGroups,
  notificationCount = 0,
  onNavigate,
  onSignOut,
  portalInfo,
}: {
  active: boolean;
  collapsed: boolean;
  currentPath: string;
  hideSidebarBottom: boolean;
  menuGroups: MenuGroup[];
  notificationCount?: number;
  onNavigate: (path: string) => void;
  onSignOut?: () => void;
  portalInfo?: PortalInfo;
}) {
  return (
    <Box
      aria-hidden={!active}
      inert={!active}
      sx={{
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        inset: 0,
        opacity: active ? 1 : 0,
        overflow: "hidden",
        pointerEvents: active ? "auto" : "none",
        position: "absolute",
        transform: active
          ? "translate3d(0, 0, 0)"
          : `translate3d(${collapsed ? -6 : 6}px, 0, 0)`,
        transition: `opacity ${SIDEBAR_FADE_EASING}, transform ${SIDEBAR_MOTION_CURVE}`,
        width: collapsed ? COLLAPSED_SIDEBAR_WIDTH : EXPANDED_SIDEBAR_WIDTH,
        "@media (prefers-reduced-motion: reduce)": {
          transition: "none",
        },
      }}
    >
      <Box
        component="nav"
        sx={{
          display: "flex",
          flex: 1,
          flexDirection: "column",
          minHeight: 0,
          overflowX: "hidden",
          overflowY: "auto",
          pb: 2,
          px: collapsed ? 0.45 : 1.15,
          scrollbarColor: "#AAB3BE transparent",
          scrollbarWidth: "thin",
          width: "100%",
          "&::-webkit-scrollbar": { width: 6 },
          "&::-webkit-scrollbar-track": { bgcolor: "transparent" },
          "&::-webkit-scrollbar-thumb": {
            bgcolor: "#AAB3BE",
            borderRadius: 8,
          },
          "& > .erg-nav-group + .erg-nav-group": {
            mt: collapsed ? 1 : 0.5,
          },
        }}
      >
        {menuGroups.map((group, groupIndex) => (
          <Box key={groupIndex} className="erg-nav-group" sx={{ width: "100%" }}>
            {group.label && !collapsed ? (
              <Box sx={{ height: 42, overflow: "hidden" }}>
                <Typography
                  component="div"
                  sx={{
                    alignItems: "center",
                    color: NAV_MUTED_COLOR,
                    display: "inline-flex",
                    fontSize: 12,
                    fontWeight: 800,
                    height: 42,
                    letterSpacing: 0,
                    lineHeight: "18px",
                    p: "16px 8px 8px 12px",
                    textTransform: "uppercase",
                  }}
                >
                  {group.label}
                </Typography>
              </Box>
            ) : null}
            <List
              disablePadding
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: collapsed ? 0.75 : 0.5,
                listStyle: "none",
                m: 0,
                overflow: "visible",
                p: 0,
                width: "100%",
              }}
            >
              {group.items.map((item, itemIndex) => (
                <SidebarItem
                  key={item.id ?? item.path ?? `${groupIndex}-${itemIndex}`}
                  collapsed={collapsed}
                  currentPath={currentPath}
                  item={item}
                  onNavigate={onNavigate}
                  sidebarActive={active}
                />
              ))}
            </List>
          </Box>
        ))}
      </Box>

      {!hideSidebarBottom ? (
        <SidebarBottom
          collapsed={collapsed}
          notificationCount={notificationCount}
          onNavigate={onNavigate}
          onSignOut={onSignOut}
          portalInfo={portalInfo}
        />
      ) : null}
    </Box>
  );
}
