import type { ReactNode } from "react";

import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Paper from "@mui/material/Paper";

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
    <Box component="nav" sx={{ bottom: 0, left: 0, px: 2, pb: "calc(env(safe-area-inset-bottom, 0px) + 0.7rem)", position: "fixed", right: 0, zIndex: 40 }}>
      <Paper elevation={0} sx={{ bgcolor: "#f6f8fb", border: "1px solid #d7e0ec", boxShadow: "0 -2px 10px rgba(15,23,42,0.08)", mx: "auto", maxWidth: 448, p: 0.75 }}>
        <Box sx={{ display: "grid", gap: 0.25, gridTemplateColumns: "repeat(5, minmax(0, 1fr))" }}>
          {items.map((item) => {
            const active = activePage === item.key;

            return (
              <ButtonBase
                key={item.key}
                sx={{
                  border: "1px solid",
                  borderColor: active ? "rgba(105,108,255,0.24)" : "transparent",
                  borderRadius: 1,
                  boxShadow: active ? 1 : 0,
                  color: active ? "#696CFF" : "text.secondary",
                  display: "grid",
                  fontWeight: 600,
                  minHeight: 54,
                  p: "6px 4px",
                  placeItems: "center",
                  position: "relative",
                  textAlign: "center",
                  transition: "background-color 160ms ease, color 160ms ease, box-shadow 160ms ease",
                  ...(active
                    ? { bgcolor: "background.paper", "&::after": { bgcolor: "#696CFF", borderRadius: 999, bottom: 4, content: '\"\"', height: 2, left: 16, position: "absolute", right: 16 } }
                    : { "&:hover": { bgcolor: "background.paper", color: "text.primary" } }),
                }}
                onClick={() => onPageChange(item.key)}
              >
                <Box component="span" sx={{ display: "grid", height: 16, placeItems: "center", "& svg": { fontSize: 17, height: 17, width: 17 } }}>{item.icon}</Box>
                <Box component="span" sx={{ fontSize: 10, fontWeight: 600, lineHeight: "14px", mt: 0.5 }}>{item.label}</Box>
              </ButtonBase>
            );
          })}
        </Box>
      </Paper>
    </Box>
  );
}
