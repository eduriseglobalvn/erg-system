import Box from "@mui/material/Box";
import ClickAwayListener from "@mui/material/ClickAwayListener";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import Paper from "@mui/material/Paper";
import Popper from "@mui/material/Popper";
import Typography from "@mui/material/Typography";
import KeyboardArrowRightRoundedIcon from "@mui/icons-material/KeyboardArrowRightRounded";
import type { MenuItem } from "./ErgPortalLayout";
import { ErgPortalReportIcon } from "./portal-sidebar-report-icon";
import {
  NAV_ACTIVE_BG,
  NAV_ACTIVE_BORDER,
  NAV_ACTIVE_TEXT,
  NAV_ACTIVE_SHADOW,
  NAV_HOVER_BG,
  NAV_ITEM_COLOR,
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
          borderRadius: "11px",
          color: miniSelected ? NAV_ACTIVE_TEXT : NAV_ITEM_COLOR,
          boxShadow: miniSelected ? NAV_ACTIVE_SHADOW : "none",
          display: "flex",
          flexDirection: "column",
          gap: 0.625,
          justifyContent: "center",
          minHeight: 56,
          px: 0.5,
          py: 0.85,
          position: "relative",
          textAlign: "center",
          transition:
            "background 120ms cubic-bezier(0.16, 1, 0.3, 1), border-color 120ms cubic-bezier(0.16, 1, 0.3, 1), color 120ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 150ms cubic-bezier(0.16, 1, 0.3, 1), transform 80ms ease-out",
          width: "100%",
          "&:active": {
            transform: "scale(0.95)",
            transition: "transform 80ms ease-out",
          },
          "&.Mui-selected": {
            background: NAV_ACTIVE_BG,
            borderColor: NAV_ACTIVE_BORDER,
            boxShadow: NAV_ACTIVE_SHADOW,
            color: NAV_ACTIVE_TEXT,
          },
          "&.Mui-selected:hover": { background: NAV_ACTIVE_BG },
          "&:hover": {
            background: miniSelected ? NAV_ACTIVE_BG : NAV_HOVER_BG,
            borderColor: miniSelected
              ? NAV_ACTIVE_BORDER
              : "transparent",
            color: miniSelected ? NAV_ACTIVE_TEXT : NAV_TEXT_COLOR,
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
            fontWeight: miniSelected ? 650 : 500,
            letterSpacing: "-0.01em",
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
                offset: [0, 16],
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
                backgroundColor: "rgba(255, 255, 255, 0.92)",
                backgroundImage: "none",
                backdropFilter: "blur(20px) saturate(190%)",
                WebkitBackdropFilter: "blur(20px) saturate(190%)",
                border: "1px solid rgba(0, 0, 0, 0.08)",
                borderRadius: "14px",
                boxShadow:
                  "0 12px 32px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.8)",
                marginLeft: 1.5,
                maxWidth: 196,
                minWidth: 196,
                overflow: "hidden",
                p: 0.5,
                transition: `opacity ${SIDEBAR_FADE_EASING}, transform ${SUBMENU_MOTION_EASING}`,
              }}
            >
              <List
                disablePadding
                sx={{ maxWidth: 196, minWidth: 196, p: 0 }}
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
                        borderRadius: "8px",
                        color: isChildActive ? NAV_ACTIVE_TEXT : NAV_ITEM_COLOR,
                        height: 36,
                        maxHeight: 36,
                        minHeight: 36,
                        px: 1.25,
                        py: 0,
                        transition: "all 120ms cubic-bezier(0.16, 1, 0.3, 1)",
                        "&:active": {
                          transform: "scale(0.98)",
                        },
                        "&:hover": {
                          background: isChildActive
                            ? NAV_ACTIVE_BG
                            : NAV_HOVER_BG,
                          color: isChildActive ? NAV_ACTIVE_TEXT : NAV_TEXT_COLOR,
                        },
                      }}
                    >
                      <Typography
                        component="span"
                        sx={{
                          color: "inherit",
                          display: "block",
                          fontSize: 13,
                          fontWeight: isChildActive ? 650 : 500,
                          letterSpacing: "-0.01em",
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
