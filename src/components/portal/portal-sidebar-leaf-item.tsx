import Box from "@mui/material/Box";
import ListItemButton from "@mui/material/ListItemButton";
import type { MenuItem } from "./ErgPortalLayout";
import { menuItemIcon, NavBadge, NavLabel } from "./portal-sidebar-parts";
import { NAV_ICON_SIZE, NAV_PADDING, navRowSx } from "./portal-sidebar-styles";
import { pathMatches } from "./portal-sidebar-utils";

interface SidebarLeafItemProps {
  item: MenuItem;
  currentPath: string;
  onNavigate: (path: string) => void;
  /** Draw the accent bar on the card edge (only inside the floating sidebar card). */
  accentBar?: boolean;
}

export function SidebarLeafItem({ item, currentPath, onNavigate, accentBar = false }: SidebarLeafItemProps) {
  const isActive = pathMatches(item.path, currentPath, true);
  const icon = menuItemIcon(item);

  return (
    <Box component="li" className="erg-nav-node" sx={{ display: "flex", listStyle: "none", position: "relative", width: "100%" }}>
      <ListItemButton
        aria-current={isActive ? "page" : undefined}
        disableRipple
        onClick={() => item.path && onNavigate(item.path)}
        sx={{ ...navRowSx(isActive, { bar: accentBar ? NAV_PADDING : undefined }), gap: "12px" }}
      >
        {icon ? (
          <Box sx={{ display: "flex", flexShrink: 0, "& .MuiSvgIcon-root": { fontSize: NAV_ICON_SIZE } }}>{icon}</Box>
        ) : null}
        <NavLabel>{item.label}</NavLabel>
        {item.badge ? <NavBadge active={isActive}>{item.badge}</NavBadge> : null}
      </ListItemButton>
    </Box>
  );
}
