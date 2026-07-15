import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { DashboardAccountMenu } from "./dashboard-account-menu";
import { DashboardScopeSelector } from "./dashboard-scope-selector";
import type { DashboardContextBarProps } from "./dashboard-context-bar.types";

export type { DashboardContextBarProps } from "./dashboard-context-bar.types";

export function DashboardContextBar({ onLogout, ...scopeProps }: DashboardContextBarProps) {
  return (
    <Box
      component="header"
      sx={{
        bgcolor: "background.paper",
        borderBottom: "1px solid",
        borderColor: "divider",
        minHeight: 64,
        position: "sticky",
        top: 0,
        zIndex: (theme) => theme.zIndex.appBar,
      }}
    >
      <Stack alignItems="center" direction="row" justifyContent="space-between" spacing={1.5} sx={{ minHeight: 64, px: { xs: 2, md: 3 }, py: 1 }}>
        <DashboardScopeSelector {...scopeProps} />
        <DashboardAccountMenu onLogout={onLogout} />
      </Stack>
    </Box>
  );
}
