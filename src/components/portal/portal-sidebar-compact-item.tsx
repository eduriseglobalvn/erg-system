import Box from "@mui/material/Box";
import ClickAwayListener from "@mui/material/ClickAwayListener";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import Paper from "@mui/material/Paper";
import Popper from "@mui/material/Popper";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import type { MenuItem } from "./ErgPortalLayout";
import { menuItemIcon, NavBadge, NavLabel } from "./portal-sidebar-parts";
import {
  NAV_CHILD_HEIGHT,
  NAV_FS,
  NAV_FW,
  NAV_HOVER_BG,
  NAV_ICON_SIZE,
  NAV_ON_PRIMARY,
  NAV_PADDING,
  NAV_PRIMARY,
  navRowSx,
  raisedCardSx,
} from "./portal-sidebar-styles";
import { isChildBranchActive, pathMatches } from "./portal-sidebar-utils";
import { useCollapsedFlyout } from "./use-collapsed-flyout";

const COMPACT_SIZE = 44;
// Button is centred in the 54px nav content box, so the card edge is 5px further out.
const COMPACT_BAR_OFFSET = NAV_PADDING + 5;

interface SidebarCompactItemProps {
  item: MenuItem;
  currentPath: string;
  onNavigate: (path: string) => void;
}

/** Collapsed-mode item: 44px icon button with a right tooltip; branches open a flyout card. */
export function SidebarCompactItem({ item, currentPath, onNavigate }: SidebarCompactItemProps) {
  const flyout = useCollapsedFlyout();
  const hasChildren = Boolean(item.children?.length);
  const active = hasChildren ? isChildBranchActive(item, currentPath) : pathMatches(item.path, currentPath, true);
  const flyoutOpen = hasChildren && Boolean(flyout.anchor);

  return (
    <Box component="li" className="erg-nav-node" sx={{ display: "flex", justifyContent: "center", listStyle: "none", width: "100%" }}>
      <Tooltip arrow={false} placement="right" title={flyoutOpen ? "" : item.label}>
        <ListItemButton
          aria-current={!hasChildren && active ? "page" : undefined}
          aria-expanded={hasChildren ? flyoutOpen : undefined}
          aria-haspopup={hasChildren ? "true" : undefined}
          aria-label={item.label}
          disableRipple
          onClick={(event) => {
            if (!hasChildren) return item.path && onNavigate(item.path);
            // Open only: hover has usually opened it already, so a toggle would close it on the click.
            flyout.open(event.currentTarget);
          }}
          onFocus={(event) => hasChildren && event.target === event.currentTarget && flyout.open(event.currentTarget)}
          onKeyDown={(event) => event.key === "Escape" && flyout.close()}
          onMouseEnter={(event) => hasChildren && flyout.open(event.currentTarget)}
          onMouseLeave={() => hasChildren && flyout.scheduleClose()}
          sx={{
            ...navRowSx(active, { bar: COMPACT_BAR_OFFSET, height: COMPACT_SIZE }),
            ...(flyoutOpen && !active ? { bgcolor: NAV_HOVER_BG, color: NAV_PRIMARY } : {}),
            flexGrow: 0, // ListItemButton grows by default; keep the 44px square
            justifyContent: "center",
            minWidth: COMPACT_SIZE,
            px: 0,
            width: COMPACT_SIZE,
          }}
        >
          <Box sx={{ display: "flex", "& .MuiSvgIcon-root": { fontSize: NAV_ICON_SIZE } }}>{menuItemIcon(item)}</Box>
          {item.badge ? (
            <Box
              aria-hidden
              sx={{
                bgcolor: active ? NAV_ON_PRIMARY : NAV_PRIMARY,
                borderRadius: "50%",
                height: 8,
                position: "absolute",
                right: 10,
                top: 10,
                width: 8,
              }}
            />
          ) : null}
        </ListItemButton>
      </Tooltip>

      {hasChildren ? (
        <Popper
          anchorEl={flyout.anchor}
          modifiers={[{ name: "offset", options: { offset: [0, 16] } }]}
          open={flyoutOpen}
          placement="right-start"
          sx={{ zIndex: 1500 }}
        >
          <ClickAwayListener onClickAway={flyout.close}>
            <Paper
              elevation={0}
              onMouseEnter={flyout.cancelClose}
              onMouseLeave={flyout.scheduleClose}
              sx={{ ...raisedCardSx, backgroundImage: "none", minWidth: 220 }}
            >
              <Typography
                component="div"
                sx={{ color: "text.secondary", fontSize: NAV_FS.caption, fontWeight: NAV_FW.semi, px: "12px", py: "8px" }}
              >
                {item.label}
              </Typography>
              <List disablePadding sx={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                {item.children!.map((child, index) => {
                  const childActive = pathMatches(child.path, currentPath, false);
                  return (
                    <ListItemButton
                      aria-current={childActive ? "page" : undefined}
                      disableRipple
                      key={child.id ?? child.path ?? `${item.label}-flyout-${index}`}
                      onClick={() => {
                        if (child.path) onNavigate(child.path);
                        flyout.close();
                      }}
                      sx={{ ...navRowSx(childActive, { height: NAV_CHILD_HEIGHT }), gap: "12px" }}
                    >
                      <NavLabel>{child.label}</NavLabel>
                      {child.badge ? <NavBadge active={childActive}>{child.badge}</NavBadge> : null}
                    </ListItemButton>
                  );
                })}
              </List>
            </Paper>
          </ClickAwayListener>
        </Popper>
      ) : null}
    </Box>
  );
}
