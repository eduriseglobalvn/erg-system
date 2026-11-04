import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import List from "@mui/material/List";
import Typography from "@mui/material/Typography";
import type { MenuGroup, MenuItem, PortalInfo } from "./ErgPortalLayout";
import { NAV_BORDER, NAV_FS, NAV_FW, NAV_PADDING } from "./portal-sidebar-styles";
import { SidebarBottom } from "./portal-sidebar-bottom";
import { SidebarBranchItem } from "./portal-sidebar-branch-item";
import { SidebarCompactItem } from "./portal-sidebar-compact-item";
import { SidebarLeafItem } from "./portal-sidebar-leaf-item";

function SidebarItem({
  collapsed,
  currentPath,
  item,
  onNavigate,
}: {
  collapsed: boolean;
  currentPath: string;
  item: MenuItem;
  onNavigate: (path: string) => void;
}) {
  if (collapsed) return <SidebarCompactItem currentPath={currentPath} item={item} onNavigate={onNavigate} />;
  if (item.children?.length) return <SidebarBranchItem currentPath={currentPath} item={item} onNavigate={onNavigate} />;
  return <SidebarLeafItem accentBar currentPath={currentPath} item={item} onNavigate={onNavigate} />;
}

/** Scrollable menu groups plus the pinned bottom (search + user card). */
export function SidebarNavigationLayer({
  collapsed,
  currentPath,
  menuGroups,
  notificationCount = 0,
  onNavigate,
  onSignOut,
  portalInfo,
}: {
  collapsed: boolean;
  currentPath: string;
  menuGroups: MenuGroup[];
  notificationCount?: number;
  onNavigate: (path: string) => void;
  onSignOut?: () => void;
  portalInfo?: PortalInfo;
}) {
  return (
    <>
      <Box
        aria-label="Điều hướng chính"
        component="nav"
        sx={{
          flex: 1,
          minHeight: 0,
          overflowX: "hidden",
          overflowY: "auto",
          pb: 2,
          pl: `${NAV_PADDING}px`,
          ...(collapsed
            ? // Icon column stays centred: no visible scrollbar (wheel/keyboard still scroll).
              { pr: `${NAV_PADDING}px`, scrollbarWidth: "none" }
            : // Thin scrollbar in a reserved right gutter, shown on hover, so rows never change width.
              {
                pr: "4px",
                scrollbarColor: "transparent transparent",
                scrollbarGutter: "stable",
                scrollbarWidth: "thin",
                "&:hover, &:focus-within": { scrollbarColor: `${NAV_BORDER} transparent` },
              }),
        }}
      >
        {menuGroups.map((group, groupIndex) => (
          <Box key={groupIndex} sx={{ width: "100%" }}>
            {groupIndex > 0 && collapsed ? <Divider sx={{ mx: 1, my: 1 }} /> : null}
            {group.label && !collapsed ? (
              <Typography
                component="div"
                noWrap
                sx={{ color: "text.secondary", fontSize: NAV_FS.caption, fontWeight: NAV_FW.semi, mt: groupIndex > 0 ? 2 : 0, px: "12px", py: "4px" }}
              >
                {group.label}
              </Typography>
            ) : null}
            <List disablePadding sx={{ display: "flex", flexDirection: "column", gap: "4px", listStyle: "none", m: 0 }}>
              {group.items.map((item, itemIndex) => (
                <SidebarItem
                  key={item.id ?? item.path ?? `${groupIndex}-${itemIndex}`}
                  collapsed={collapsed}
                  currentPath={currentPath}
                  item={item}
                  onNavigate={onNavigate}
                />
              ))}
            </List>
          </Box>
        ))}
      </Box>
      <SidebarBottom
        collapsed={collapsed}
        notificationCount={notificationCount}
        onNavigate={onNavigate}
        onSignOut={onSignOut}
        portalInfo={portalInfo}
      />
    </>
  );
}
