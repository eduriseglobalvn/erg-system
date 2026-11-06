import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";

export function TargetCardShell({ children, clip = false }: { children: ReactNode; clip?: boolean }) {
  return (
    <Box
      component="section"
      sx={{
        position: clip ? undefined : "relative",
        display: "flex",
        minHeight: 0,
        flex: 1,
        flexDirection: "column",
        overflow: clip ? "hidden" : "visible",
        borderRadius: 1,
        border: 1,
        borderColor: "divider",
        bgcolor: "background.paper",
        boxShadow: 1,
      }}
    >
      {children}
    </Box>
  );
}

export function TargetCardHeader({ aside, select, selectedLabel }: { aside: ReactNode; select: ReactNode; selectedLabel: string }) {
  return (
    <Box sx={{ px: 3, py: 1.75, borderBottom: 1, borderColor: "divider", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 2, flexShrink: 0 }}>
      <Box sx={{ display: "flex", minWidth: 0, flexWrap: "wrap", alignItems: "flex-end", gap: 1.5 }}>
        {select}
        <Box sx={{ borderRadius: 1, border: 1, borderColor: "primary.main", bgcolor: "info.light", px: 1.5, py: 1, color: "primary.main" }}>
          <Typography variant="body2" sx={{ fontWeight: "fontWeightBold" }}>Đã chọn</Typography>
          <Typography variant="body2" sx={{ mt: 0.25, fontWeight: "fontWeightMedium" }}>{selectedLabel}</Typography>
        </Box>
      </Box>
      {aside}
    </Box>
  );
}

export function TargetPreviewPanel({
  actions,
  children,
  meta,
  search,
  title,
}: {
  actions: ReactNode;
  children: ReactNode;
  meta: string;
  search: ReactNode;
  title: string;
}) {
  return (
    <Paper
      elevation={3}
      onClick={(event) => event.stopPropagation()}
      sx={{
        position: "fixed",
        left: "50%",
        top: "50%",
        zIndex: 50,
        display: "flex",
        height: "min(680px, calc(100vh - 48px))",
        width: "min(1120px, calc(100vw - 32px))",
        transform: "translate(-50%, -50%)",
        flexDirection: "column",
        overflow: "hidden",
        borderRadius: 1,
        border: 1,
        borderColor: "divider",
      }}
    >
      <Box sx={{ flexShrink: 0, px: 2.5, py: 1.5 }}>
        <Box sx={{ mb: 1.5, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1.5 }}>
          <Box>
            <Typography component="h4" variant="subtitle1" sx={{ fontWeight: "fontWeightBold" }}>{title}</Typography>
            <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: "fontWeightMedium" }}>{meta}</Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>{actions}</Box>
        </Box>
        {search}
      </Box>
      {children}
    </Paper>
  );
}
