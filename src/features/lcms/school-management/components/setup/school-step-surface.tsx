import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";

export function SchoolStepSurface({ action, children, description, eyebrow, title }: {
  action?: ReactNode;
  children: ReactNode;
  description: string;
  eyebrow: string;
  title: string;
}) {
  return <Paper variant="outlined" sx={{ overflow: "hidden" }}>
    <Box sx={{ alignItems: { xs: "flex-start", sm: "center" }, borderBottom: "1px solid", borderColor: "divider", display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 1.5, justifyContent: "space-between", px: { xs: 2, md: 2.5 }, py: 2 }}>
      <Box>
        <Typography color="primary.main" sx={{ fontSize: 11, fontWeight: 900, letterSpacing: 0.5, textTransform: "uppercase" }}>{eyebrow}</Typography>
        <Typography sx={{ fontSize: 19, fontWeight: 900, mt: 0.25 }}>{title}</Typography>
        <Typography color="text.secondary" variant="body2">{description}</Typography>
      </Box>
      {action}
    </Box>
    <Box sx={{ p: { xs: 2, md: 2.5 } }}>{children}</Box>
  </Paper>;
}
