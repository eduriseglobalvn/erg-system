import {
  Box,
  ClickAwayListener,
  List,
  ListItemButton,
  Paper,
  Popper,
  Typography,
} from "@mui/material";
import KeyboardArrowRightRoundedIcon from "@mui/icons-material/KeyboardArrowRightRounded";
import type { MenuItem } from "./ErgPortalLayout";
import { ErgPortalReportIcon } from "./portal-sidebar-report-icon";
import {
  NAV_ACTIVE_BG,
  NAV_ACTIVE_BORDER,
  NAV_ACTIVE_SHADOW,
  NAV_HOVER_BG,
  NAV_ITEM_COLOR,
  NAV_PRIMARY,
  NAV_SURFACE_BG,
  NAV_TEXT_COLOR,
  SIDEBAR_FADE_EASING,
  SUBMENU_MOTION_EASING,
} from "./portal-sidebar-styles";
import {
  getCollapsedLabel,
  isReportMenu,
  pathMatches,
} from "./portal-sidebar-utils";
import { useCollapsedFlyout } from "./use-collapsed-flyout";

interface SidebarCompactItemProps {
  item: MenuItem;
  currentPath: string;
  onNavigate: (path: string) => void;
  sidebarActive: boolean;
}

export function SidebarCompactItem({
  item,
  currentPath,
  onNavigate,
  sidebarActive,
}: SidebarCompactItemProps) {
  const flyout = useCollapsedFlyout(true, sidebarActive);
  const hasChildren = Boolean(item.children?.length);
  const isActive = pathMatches(item.path, currentPath, true);

  const childActive = Boolean(
    item.children?.some((child) => {
      return (
        pathMatches(child.path, currentPath, false) ||
        child.children?.some((grandChild) => {
          return pathMatches(grandChild.path, currentPath, false);
        })
      );
    }),
  );

  const displayIcon = isReportMenu(item.label) ? (
    <ErgPortalReportIcon />
  ) : (
    item.icon
  );

  const flyoutOpen =
    sidebarActive && hasChildren && Boolean(flyout.anchor);
  const miniSelected = hasChildren ? childActive || flyoutOpen : isActive;

  return (
    <Box
      component="li"
      className="erg-nav-node"
      sx={{
        display: "flex",
        justifyContent: "center",
        listStyle: "none",
        px: 0.5,
        width: "100%",
      }}
    >
      <ListItemButton
        disableRipple
        onMouseEnter={(event) => {
          if (hasChildren) {
            flyout.open(event.currentTarget);
          }
        }}
        onMouseLeave={() => {
          if (hasChildren) {
            flyout.scheduleClose();
          }
        }}
        onClick={(event) => {
          if (hasChildren) {
            if (flyoutOpen) {
              flyout.close();
              return;
            }
            flyout.open(event.currentTarget);
            return;
          }
          if (item.path) {
            onNavigate(item.path);
          }
        }}
        onFocus={(event) => {
          if (hasChildren) {
            flyout.open(event.currentTarget);
          }
        }}
        selected={miniSelected}
        sx={{
          alignItems: "center",
          background: miniSelected ? NAV_ACTIVE_BG : "transparent",
          border: miniSelected
            ? `1px solid ${NAV_ACTIVE_BORDER}`
            : "1px solid transparent",
          borderRadius: "12px",
          color: miniSelected ? NAV_PRIMARY : NAV_ITEM_COLOR,
          boxShadow: miniSelected ? NAV_ACTIVE_SHADOW : "none",
          display: "flex",
          flexDirection: "column",
          gap: 0.625,
          justifyContent: "center",
          minHeight: 58,
          px: 0.5,
          py: 1,
          position: "relative",
          textAlign: "center",
          transition:
            "background 180ms ease, border-color 180ms ease, color 180ms ease, box-shadow 220ms ease, transform 220ms cubic-bezier(0.22, 1, 0.36, 1)",
          width: "100%",
          "&.Mui-selected": {
            background: NAV_ACTIVE_BG,
            borderColor: NAV_ACTIVE_BORDER,
            boxShadow: NAV_ACTIVE_SHADOW,
            color: NAV_PRIMARY,
          },
          "&.Mui-selected:hover": { background: NAV_ACTIVE_BG },
          "&:hover": {
            background: miniSelected ? NAV_ACTIVE_BG : NAV_HOVER_BG,
            borderColor: miniSelected
              ? NAV_ACTIVE_BORDER
              : "rgba(145,158,171,0.18)",
            color: miniSelected ? NAV_PRIMARY : NAV_TEXT_COLOR,
          },
        }}
      >
        {hasChildren ? (
          <KeyboardArrowRightRoundedIcon
            sx={{
              color: "currentColor",
              fontSize: 15,
              position: "absolute",
              right: 6,
              top: "50%",
              transform: "translateY(-50%)",
            }}
          />
        ) : null}
        {displayIcon ? (
          <Box
            sx={{
              alignItems: "center",
              color: "currentColor",
              display: "flex",
              height: 22,
              justifyContent: "center",
              width: 22,
              "& .MuiSvgIcon-root": {
                color: "currentColor",
                fontSize: 22,
              },
            }}
          >
            {displayIcon}
          </Box>
        ) : null}
        <Typography
          sx={{
            color: "inherit",
            fontSize: 11,
            fontWeight: miniSelected ? 600 : 500,
            lineHeight: "14px",
            maxWidth: "100%",
            overflow: "hidden",
            px: 0.25,
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {getCollapsedLabel(item.label)}
        </Typography>
      </ListItemButton>

      {hasChildren ? (
        <Popper
          anchorEl={flyout.anchor}
          modifiers={[
            {
              name: "offset",
              options: {
                offset: [0, 20],
              },
            },
          ]}
          open={flyoutOpen}
          placement="right"
          sx={{ zIndex: 1500 }}
        >
          <ClickAwayListener onClickAway={flyout.close}>
            <Paper
              elevation={0}
              onMouseEnter={flyout.cancelClose}
              onMouseLeave={flyout.scheduleClose}
              sx={{
                backgroundColor: NAV_SURFACE_BG,
                backgroundImage: "none",
                backdropFilter: "none",
                WebkitBackdropFilter: "none",
                border: `1px solid ${NAV_ACTIVE_BORDER}`,
                borderRadius: "14px",
                boxShadow:
                  "0 10px 24px rgba(103, 114, 182, 0.1), inset 0 1px 0 rgba(255,255,255,0.78)",
                marginLeft: 1.5,
                maxWidth: 192,
                minWidth: 192,
                overflow: "hidden",
                py: 0.375,
                transition: `opacity ${SIDEBAR_FADE_EASING}, transform ${SUBMENU_MOTION_EASING}`,
              }}
            >
              <List
                disablePadding
                sx={{ maxWidth: 192, minWidth: 192, p: 0 }}
              >
                {item.children!.map((child, index) => {
                  const isChildActive = pathMatches(
                    child.path,
                    currentPath,
                    false,
                  );

                  return (
                    <ListItemButton
                      disableRipple
                      key={
                        child.id ??
                        child.path ??
                        `${item.label}-collapsed-${index}`
                      }
                      onClick={() => {
                        if (child.path) {
                          onNavigate(child.path);
                        }
                        flyout.close();
                      }}
                      sx={{
                        alignItems: "center",
                        background: isChildActive
                          ? NAV_ACTIVE_BG
                          : "transparent",
                        color: isChildActive ? NAV_PRIMARY : NAV_ITEM_COLOR,
                        height: 36,
                        maxHeight: 36,
                        minHeight: 36,
                        px: 1.5,
                        py: 0,
                        "&:hover": {
                          background: isChildActive
                            ? NAV_ACTIVE_BG
                            : NAV_HOVER_BG,
                          color: isChildActive ? NAV_PRIMARY : NAV_TEXT_COLOR,
                        },
                      }}
                    >
                      <Typography
                        component="span"
                        sx={{
                          color: "inherit",
                          display: "block",
                          fontSize: 13.5,
                          fontWeight: isChildActive ? 600 : 500,
                          letterSpacing: 0,
                          lineHeight: "20px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {child.label}
                      </Typography>
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
