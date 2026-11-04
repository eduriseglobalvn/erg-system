import Box from "@mui/material/Box";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import type { MenuItem } from "./ErgPortalLayout";
import { ErgPortalReportIcon } from "./portal-sidebar-report-icon";
import {
  NAV_ACTIVE_BG,
  NAV_ACTIVE_BORDER,
  NAV_ACTIVE_SHADOW,
  NAV_HOVER_BG,
  NAV_ITEM_COLOR,
  NAV_PRIMARY,
  NAV_TEXT_COLOR,
} from "./portal-sidebar-styles";
import { isReportMenu, pathMatches } from "./portal-sidebar-utils";

interface SidebarLeafItemProps {
  item: MenuItem;
  currentPath: string;
  onNavigate: (path: string) => void;
}

export function SidebarLeafItem({
  item,
  currentPath,
  onNavigate,
}: SidebarLeafItemProps) {
  const isActive = pathMatches(item.path, currentPath, true);
  const displayIcon = isReportMenu(item.label) ? (
    <ErgPortalReportIcon />
  ) : (
    item.icon
  );

  return (
    <Box
      component="li"
      className="erg-nav-node"
      sx={{
        display: "flex",
        listStyle: "none",
        overflow: "visible",
        position: "relative",
        width: "100%",
      }}
    >
      <ListItemButton
        disableRipple
        onClick={() => item.path && onNavigate(item.path)}
        selected={isActive}
        sx={{
          alignItems: "center",
          background: isActive ? NAV_ACTIVE_BG : "transparent",
          border: isActive
            ? `1px solid ${NAV_ACTIVE_BORDER}`
            : "1px solid transparent",
          borderRadius: "9px",
          color: isActive ? NAV_PRIMARY : NAV_ITEM_COLOR,
          boxShadow: isActive ? NAV_ACTIVE_SHADOW : "none",
          display: "flex",
          height: 42,
          minHeight: 42,
          overflow: "visible",
          p: "4px 10px",
          transition:
            "background 120ms cubic-bezier(0.16, 1, 0.3, 1), border-color 120ms cubic-bezier(0.16, 1, 0.3, 1), color 120ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 150ms cubic-bezier(0.16, 1, 0.3, 1), transform 80ms ease-out",
          width: "100%",
          "&:active": {
            transform: "scale(0.985)",
            transition: "transform 80ms ease-out",
          },
          "&.Mui-selected": {
            background: NAV_ACTIVE_BG,
            borderColor: NAV_ACTIVE_BORDER,
            boxShadow: NAV_ACTIVE_SHADOW,
            color: NAV_PRIMARY,
          },
          "&.Mui-selected:hover": { background: NAV_ACTIVE_BG },
          "&:hover": {
            background: isActive ? NAV_ACTIVE_BG : NAV_HOVER_BG,
            borderColor: isActive
              ? NAV_ACTIVE_BORDER
              : "transparent",
            color: isActive ? NAV_PRIMARY : NAV_TEXT_COLOR,
          },
        }}
      >
        {displayIcon ? (
          <ListItemIcon
            sx={{
              alignItems: "center",
              color: "currentColor",
              display: "flex",
              flexShrink: 0,
              height: 20,
              justifyContent: "center",
              m: "0 10px 0 0",
              minWidth: 20,
              width: 20,
              "& .MuiSvgIcon-root": {
                color: "currentColor",
                fontSize: 20,
              },
            }}
          >
            {displayIcon}
          </ListItemIcon>
        ) : null}
        <ListItemText
          primary={
            <Box sx={{ alignItems: "center", display: "flex", gap: 1 }}>
              <Box
                sx={{
                  minWidth: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {item.label}
              </Box>
              {item.badge ? (
                <Box
                  component="span"
                  sx={{
                    background: NAV_ACTIVE_BG,
                    border: `1px solid ${NAV_ACTIVE_BORDER}`,
                    borderRadius: "9999px",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.62)",
                    color: NAV_PRIMARY,
                    flexShrink: 0,
                    fontSize: 10.5,
                    fontWeight: 650,
                    letterSpacing: "0.02em",
                    lineHeight: "16px",
                    px: 0.85,
                    py: 0.1,
                  }}
                >
                  {item.badge}
                </Box>
              ) : null}
            </Box>
          }
          slotProps={{
            primary: {
              sx: {
                color: "inherit",
                fontSize: 13.5,
                fontWeight: isActive ? 650 : 500,
                letterSpacing: "-0.01em",
                lineHeight: "20px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              },
            },
          }}
          sx={{ m: 0, minWidth: 0 }}
        />
      </ListItemButton>
    </Box>
  );
}
