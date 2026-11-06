import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import type { MenuItem } from "./ErgPortalLayout";
import { ErgPortalReportIcon } from "./portal-sidebar-report-icon";
import { NAV_FS, NAV_FW, NAV_ON_PRIMARY, NAV_PRIMARY } from "./portal-sidebar-styles";
import { isReportMenu } from "./portal-sidebar-utils";

export function menuItemIcon(item: MenuItem) {
  return isReportMenu(item.label) ? <ErgPortalReportIcon /> : item.icon;
}

/** Solid primary pill (white on an active gradient row). */
export function NavBadge({ active, children }: { active: boolean; children: ReactNode }) {
  return (
    <Box
      component="span"
      sx={{
        alignItems: "center",
        bgcolor: active ? NAV_ON_PRIMARY : NAV_PRIMARY,
        borderRadius: "11px",
        color: active ? NAV_PRIMARY : NAV_ON_PRIMARY,
        display: "inline-flex",
        flexShrink: 0,
        fontSize: NAV_FS.caption,
        fontWeight: NAV_FW.semi,
        height: 22,
        justifyContent: "center",
        lineHeight: 1,
        minWidth: 22,
        ml: "auto",
        px: "7px",
      }}
    >
      {children}
    </Box>
  );
}

/** Label with the 14/500 sidebar type style and ellipsis. */
export function NavLabel({ children, strong = false }: { children: ReactNode; strong?: boolean }) {
  return (
    <Box
      component="span"
      sx={{
        color: "inherit",
        flex: "0 1 auto",
        fontSize: NAV_FS.label,
        fontWeight: strong ? NAV_FW.semi : NAV_FW.medium,
        lineHeight: "20px",
        minWidth: 0,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </Box>
  );
}
