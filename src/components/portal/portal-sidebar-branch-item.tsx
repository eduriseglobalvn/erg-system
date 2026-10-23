import { useId, useState } from "react";
import { Box, List, ListItemButton, ListItemIcon, ListItemText } from "@mui/material";
import KeyboardArrowRightRoundedIcon from "@mui/icons-material/KeyboardArrowRightRounded";
import type { MenuItem } from "./ErgPortalLayout";
import { ErgPortalReportIcon } from "./portal-sidebar-report-icon";
import {
  NAV_ACTIVE_BG,
  NAV_ACTIVE_BORDER,
  NAV_ACTIVE_SHADOW,
  NAV_HOVER_BG,
  NAV_ITEM_COLOR,
  NAV_PREVIEW_BG,
  NAV_PREVIEW_BORDER,
  NAV_PRIMARY,
  NAV_TEXT_COLOR,
  SUBMENU_DISCLOSURE_TRANSITION,
  TREE_CONNECTOR_MASK,
} from "./portal-sidebar-styles";
import {
  isChildBranchActive,
  isReportMenu,
  isStudentLabel,
  pathMatches,
} from "./portal-sidebar-utils";

interface SidebarBranchItemProps {
  item: MenuItem;
  currentPath: string;
  onNavigate: (path: string) => void;
}

export function SidebarBranchItem({
  item,
  currentPath,
  onNavigate,
}: SidebarBranchItemProps) {
  const [manualOpen, setManualOpen] = useState<boolean | null>(null);
  const disclosureId = useId();
  const isActive = pathMatches(item.path, currentPath, true);
  const childActive = isChildBranchActive(item, currentPath);

  const displayIcon = isReportMenu(item.label) ? (
    <ErgPortalReportIcon />
  ) : (
    item.icon
  );

  const isPinnedOpen = item.id === "learning-activities";
  const defaultExpanded = childActive || isPinnedOpen;
  const isExpanded = manualOpen ?? defaultExpanded;
  const isBranchActive = isActive;
  const isPreviewOpen = isExpanded && !childActive;
  const showExpandedChildren = isExpanded;

  return (
    <Box
      component="li"
      className="erg-nav-node"
      sx={{
        display: "flex",
        flexDirection: "column",
        listStyle: "none",
        overflow: "visible",
        position: "relative",
        width: "100%",
      }}
    >
      <ListItemButton
        aria-controls={disclosureId}
        aria-expanded={isExpanded}
        disableRipple
        onClick={() => setManualOpen((value) => !(value ?? defaultExpanded))}
        sx={{
          alignItems: "center",
          background: isBranchActive
            ? NAV_ACTIVE_BG
            : isPreviewOpen
              ? NAV_PREVIEW_BG
              : "transparent",
          border: isBranchActive
            ? `1px solid ${NAV_ACTIVE_BORDER}`
            : isPreviewOpen
              ? `1px solid ${NAV_PREVIEW_BORDER}`
            : "1px solid transparent",
          borderRadius: "8px",
          color: isExpanded ? NAV_TEXT_COLOR : NAV_ITEM_COLOR,
          boxShadow: isBranchActive ? NAV_ACTIVE_SHADOW : "none",
          display: "flex",
          height: 44,
          minHeight: 44,
          overflow: "visible",
          p: "4px 8px 4px 8px",
          transition:
            "background 180ms ease, border-color 180ms ease, color 180ms ease, box-shadow 220ms ease",
          width: "100%",
          "&:hover": {
            background: isBranchActive
              ? NAV_ACTIVE_BG
              : isPreviewOpen
                ? NAV_PREVIEW_BG
                : NAV_HOVER_BG,
            borderColor: isBranchActive
              ? NAV_ACTIVE_BORDER
              : isPreviewOpen
                ? NAV_PREVIEW_BORDER
              : "rgba(145,158,171,0.18)",
            color: NAV_TEXT_COLOR,
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
          primary={item.label}
          slotProps={{
            primary: {
              sx: {
                color: "inherit",
                fontSize: 14,
                fontWeight: isExpanded ? 700 : 600,
                letterSpacing: 0,
                lineHeight: "22px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              },
            },
          }}
          sx={{ m: 0, minWidth: 0 }}
        />
        <KeyboardArrowRightRoundedIcon
          sx={{
            color: "currentColor",
            flexShrink: 0,
            fontSize: 16,
            ml: "6px",
            transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
            transition: `transform ${SUBMENU_DISCLOSURE_TRANSITION}`,
            "@media (prefers-reduced-motion: reduce)": {
              transitionDuration: "1ms",
            },
          }}
        />
      </ListItemButton>

      <Box
        aria-hidden={!showExpandedChildren}
        id={disclosureId}
        sx={{
          display: "grid",
          gridTemplateRows: showExpandedChildren ? "1fr" : "0fr",
          overflow: "hidden",
          pl: 1.5,
          transition: `grid-template-rows ${SUBMENU_DISCLOSURE_TRANSITION}`,
          "@media (prefers-reduced-motion: reduce)": {
            transitionDuration: "1ms",
          },
        }}
      >
        <Box sx={{ minHeight: 0, overflow: "hidden" }}>
        <List
          disablePadding
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 0.5,
            listStyle: "none",
            m: 0,
            overflow: "hidden",
            p: "4px 0 0 10px",
            position: "relative",
            "&::before": {
              bgcolor: "#DCE3EB",
              borderRadius: "2px",
              bottom: 4,
              content: '""',
              left: 0,
              position: "absolute",
              top: 0,
              width: 2,
            },
          }}
        >
          {item.children!.map((child, index) => {
            const isChildActive = pathMatches(child.path, currentPath, false);
            const showChildArrow = Boolean(
              child.children?.length ||
              (isReportMenu(item.label) && isStudentLabel(child.label)),
            );

            return (
              <Box
                key={child.id ?? child.path ?? `${item.label}-${index}`}
                component="li"
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
                  onClick={() => {
                    if (!child.children?.length && child.path) {
                      onNavigate(child.path);
                    }
                  }}
                  sx={{
                    alignItems: "center",
                    background: isChildActive ? NAV_ACTIVE_BG : "transparent",
                    border: isChildActive
                      ? `1px solid ${NAV_ACTIVE_BORDER}`
                      : "1px solid transparent",
                    borderRadius: "8px",
                    color: isChildActive ? NAV_PRIMARY : NAV_ITEM_COLOR,
                    boxShadow: isChildActive ? NAV_ACTIVE_SHADOW : "none",
                    display: "flex",
                    height: 36,
                    minHeight: 36,
                    overflow: "visible",
                    p: "4px 8px 4px 10px",
                    position: "relative",
                    transition:
                      "background 180ms ease, border-color 180ms ease, color 180ms ease, box-shadow 220ms ease",
                    width: "100%",
                    "&::before": {
                      WebkitMask: TREE_CONNECTOR_MASK,
                      bgcolor: "#DCE3EB",
                      content: '""',
                      height: 12,
                      left: 0,
                      mask: TREE_CONNECTOR_MASK,
                      position: "absolute",
                      top: 12,
                      transform: "translate(-12px, -4.8px)",
                      width: 12,
                      zIndex: 1,
                    },
                    "&:hover": {
                      background: isChildActive
                        ? NAV_ACTIVE_BG
                        : NAV_HOVER_BG,
                      borderColor: isChildActive
                        ? NAV_ACTIVE_BORDER
                        : "rgba(145,158,171,0.18)",
                      color: isChildActive ? NAV_PRIMARY : NAV_TEXT_COLOR,
                    },
                  }}
                >
                  <ListItemText
                    primary={child.label}
                    slotProps={{
                      primary: {
                        sx: {
                          color: "inherit",
                          fontSize: 14,
                          fontWeight: isChildActive ? 700 : 600,
                          letterSpacing: 0,
                          lineHeight: "22px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        },
                      },
                    }}
                    sx={{ m: 0, minWidth: 0 }}
                  />
                  {showChildArrow ? (
                    <KeyboardArrowRightRoundedIcon
                      sx={{
                        color: "currentColor",
                        flexShrink: 0,
                        fontSize: 16,
                        ml: "6px",
                      }}
                    />
                  ) : null}
                </ListItemButton>
              </Box>
            );
          })}
        </List>
        </Box>
      </Box>
    </Box>
  );
}
