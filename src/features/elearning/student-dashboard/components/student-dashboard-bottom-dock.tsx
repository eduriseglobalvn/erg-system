import type { ReactNode } from "react";

import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";

import type { StudentDockPageKey } from "@/features/elearning/student-dashboard/types/dashboard-view-types";

export function StudentDashboardBottomDock({
  activePage,
  items,
  onPageChange,
}: {
  activePage: string;
  items: Array<{ key: StudentDockPageKey; label: string; icon: ReactNode }>;
  onPageChange: (page: StudentDockPageKey) => void;
}) {
  return (
    <Box aria-label="Điều hướng Student Workspace" component="nav" sx={{ bottom: 0, left: 0, px: 1.5, pb: "calc(env(safe-area-inset-bottom, 0px) + 8px)", position: "fixed", right: 0, zIndex: (theme) => theme.zIndex.appBar, "@media (max-width:360px)": { px: 1 } }}>
      <Paper sx={{ border: "1px solid", borderColor: "divider", borderRadius: "26px", boxShadow: "0 18px 40px rgba(15,23,42,0.16)", display: "grid", gridTemplateColumns: `repeat(${Math.max(items.length, 1)}, minmax(0, 1fr))`, height: 88, mx: "auto", maxWidth: 430, p: 1.25, "@media (max-width:360px)": { p: 0.75 } }}>
        {items.map((item) => {
          const active = activePage === item.key;

          return (
            <ButtonBase
              aria-current={active ? "page" : undefined}
              aria-label={item.label}
              data-selected={active ? "true" : undefined}
              key={item.key}
              onClick={() => onPageChange(item.key)}
              sx={{
                bgcolor: active ? "rgba(15,108,189,0.08)" : "transparent",
                border: "1px solid",
                borderColor: active ? "rgba(15,108,189,0.14)" : "transparent",
                borderRadius: "18px",
                boxShadow: active ? "0 6px 16px rgba(15,108,189,0.08)" : "none",
                color: active ? "primary.main" : "text.secondary",
                display: "flex",
                flexDirection: "column",
                gap: 0.5,
                minHeight: 62,
                minWidth: 0,
                px: 0.25,
                "&:active": { transform: "scale(0.97)" },
                "&:focus-visible": { outline: "3px solid rgba(15,108,189,0.24)", outlineOffset: 2 },
                "&:hover": { bgcolor: active ? "rgba(15,108,189,0.08)" : "action.hover" },
              }}
            >
              <Box component="span" sx={{ alignItems: "center", bgcolor: active ? "primary.main" : "transparent", borderRadius: "50%", color: active ? "primary.contrastText" : "text.primary", display: "flex", height: 32, justifyContent: "center", width: 32, "& svg": { fontSize: 20, height: 20, width: 20 } }}>{item.icon}</Box>
              <Typography color="inherit" noWrap sx={{ fontSize: 10.5, fontWeight: 800, lineHeight: 1, maxWidth: "100%", px: 0.2, "@media (max-width:360px)": { fontSize: 9.5, px: 0 } }}>{item.label}</Typography>
            </ButtonBase>
          );
        })}
      </Paper>
    </Box>
  );
}
