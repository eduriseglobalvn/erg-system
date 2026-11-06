import { useId, useState } from "react";
import Box from "@mui/material/Box";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import KeyboardArrowRightRoundedIcon from "@mui/icons-material/KeyboardArrowRightRounded";
import type { MenuItem } from "./ErgPortalLayout";
import { menuItemIcon, NavBadge, NavLabel } from "./portal-sidebar-parts";
import {
  NAV_BORDER,
  NAV_BRANCH_INSET,
  NAV_CHILD_HEIGHT,
  NAV_CHILD_ICON_SIZE,
  NAV_EASE,
  NAV_ICON_SIZE,
  NAV_PADDING,
  NAV_RAISED_RADIUS,
  NAV_GROUP_BG,
  NAV_TRANSITION,
  navRowSx,
  REDUCED_MOTION,
} from "./portal-sidebar-styles";
import { isChildBranchActive, isReportMenu, isStudentLabel, pathMatches } from "./portal-sidebar-utils";

interface SidebarBranchItemProps {
  item: MenuItem;
  currentPath: string;
  onNavigate: (path: string) => void;
}

/** Expandable group: while open, the parent row and its children sit in one raised card. */
export function SidebarBranchItem({ item, currentPath, onNavigate }: SidebarBranchItemProps) {
  const [manualOpen, setManualOpen] = useState<boolean | null>(null);
  const disclosureId = useId();
  const childActive = isChildBranchActive(item, currentPath);
  const isExpanded = manualOpen ?? (childActive || item.id === "learning-activities");
  // Parent stays plain while a child is the active page (only the child is the gradient pill).
  const parentActive = pathMatches(item.path, currentPath, true) && !childActive;
  const icon = menuItemIcon(item);
  const bar = isExpanded ? NAV_PADDING + NAV_BRANCH_INSET : NAV_PADDING;

  return (
    <Box component="li" className="erg-nav-node" sx={{ listStyle: "none", width: "100%" }}>
      <Box
        sx={{
          bgcolor: isExpanded ? NAV_GROUP_BG : "transparent",
          border: `1px solid ${isExpanded ? NAV_BORDER : "transparent"}`,
          borderRadius: NAV_RAISED_RADIUS,
          m: isExpanded ? 0 : `-${NAV_BRANCH_INSET}px`,
          p: "6px",
          transition: `${NAV_TRANSITION}, border-color ${NAV_EASE}, margin ${NAV_EASE}`,
          ...REDUCED_MOTION,
        }}
      >
        <ListItemButton
          aria-controls={disclosureId}
          aria-expanded={isExpanded}
          disableRipple
          onClick={() => setManualOpen(!isExpanded)}
          sx={{ ...navRowSx(parentActive, { bar, open: isExpanded }), gap: "12px" }}
        >
          {icon ? <Box sx={{ display: "flex", flexShrink: 0, "& .MuiSvgIcon-root": { fontSize: NAV_ICON_SIZE } }}>{icon}</Box> : null}
          <NavLabel>{item.label}</NavLabel>
          {item.badge ? <NavBadge active={parentActive}>{item.badge}</NavBadge> : null}
          <KeyboardArrowDownRoundedIcon
            sx={{
              flexShrink: 0,
              ml: item.badge ? 0 : "auto",
              transform: isExpanded ? "rotate(180deg)" : "none",
              transition: `transform ${NAV_EASE}`,
              ...REDUCED_MOTION,
            }}
          />
        </ListItemButton>

        <Box
          aria-hidden={!isExpanded}
          id={disclosureId}
          inert={!isExpanded}
          sx={{
            display: "grid",
            gridTemplateRows: isExpanded ? "1fr" : "0fr",
            transition: `grid-template-rows ${NAV_EASE}`,
            ...REDUCED_MOTION,
          }}
        >
          {/* Visible while open so the active child's accent bar can reach the card edge. */}
          <Box sx={{ minHeight: 0, overflow: isExpanded ? "visible" : "hidden" }}>
            <List disablePadding sx={{ display: "flex", flexDirection: "column", gap: "4px", m: 0, pt: "4px" }}>
              {item.children!.map((child, index) => {
                const active = pathMatches(child.path, currentPath, false);
                const hasArrow = Boolean(child.children?.length || (isReportMenu(item.label) && isStudentLabel(child.label)));
                return (
                  <Box key={child.id ?? child.path ?? `${item.label}-${index}`} component="li" sx={{ display: "flex", listStyle: "none", width: "100%" }}>
                    <ListItemButton
                      aria-current={active ? "page" : undefined}
                      disableRipple
                      onClick={() => !child.children?.length && child.path && onNavigate(child.path)}
                      sx={{ ...navRowSx(active, { bar, height: NAV_CHILD_HEIGHT }), gap: "12px" }}
                    >
                      <Box sx={{ alignItems: "center", display: "flex", flexShrink: 0, justifyContent: "center", width: 16, "& .MuiSvgIcon-root": { fontSize: NAV_CHILD_ICON_SIZE } }}>
                        {child.icon ?? <Box sx={{ bgcolor: "currentColor", borderRadius: "50%", height: 6, opacity: 0.6, width: 6 }} />}
                      </Box>
                      <NavLabel>{child.label}</NavLabel>
                      {child.badge ? <NavBadge active={active}>{child.badge}</NavBadge> : null}
                      {hasArrow ? <KeyboardArrowRightRoundedIcon sx={{ flexShrink: 0, ml: "auto" }} /> : null}
                    </ListItemButton>
                  </Box>
                );
              })}
            </List>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
