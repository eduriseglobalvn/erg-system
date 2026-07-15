import Box, { type BoxProps } from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Paper, { type PaperProps } from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";

type ErgPageSurfaceProps = PaperProps & {
  flush?: boolean;
};

export function ErgPageSurface({ children, flush = false, sx, ...props }: ErgPageSurfaceProps) {
  return (
    <Paper
      sx={[
        {
          bgcolor: "background.paper",
          borderColor: "divider",
          borderRadius: 3,
          minHeight: 0,
          overflow: "hidden",
          p: flush ? 0 : { xs: 2, md: 3 },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...props}
    >
      {children}
    </Paper>
  );
}

type ErgSectionHeaderProps = {
  action?: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  title: ReactNode;
};

export function ErgSectionHeader({ action, description, eyebrow, title }: ErgSectionHeaderProps) {
  return (
    <Box
      sx={{
        alignItems: { xs: "flex-start", sm: "center" },
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        gap: 2,
        justifyContent: "space-between",
        mb: 2.5,
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        {eyebrow ? (
          <Typography color="text.secondary" sx={{ fontWeight: 800, mb: 0.5, textTransform: "uppercase" }} variant="caption">
            {eyebrow}
          </Typography>
        ) : null}
        <Typography color="text.primary" sx={{ fontWeight: 850 }} variant="h5">
          {title}
        </Typography>
        {description ? (
          <Typography color="text.secondary" sx={{ mt: 0.5 }} variant="body2">
            {description}
          </Typography>
        ) : null}
      </Box>
      {action ? <Box sx={{ flexShrink: 0 }}>{action}</Box> : null}
    </Box>
  );
}

export function ErgContentBand({ sx, ...props }: BoxProps) {
  return (
    <Box
      sx={[
        {
          bgcolor: "background.default",
          minHeight: "100%",
          p: { xs: 2, md: 3 },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...props}
    />
  );
}

export function ErgDivider() {
  return <Divider sx={{ borderColor: "divider", my: 2 }} />;
}
