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
      elevation={0}
      sx={[
        {
          bgcolor: "#FFFFFF",
          border: "1px solid rgba(0, 0, 0, 0.06)",
          borderColor: "rgba(0, 0, 0, 0.06)",
          borderRadius: "16px",
          boxShadow: "0 2px 10px rgba(0, 0, 0, 0.02), 0 8px 24px -4px rgba(0, 0, 0, 0.04)",
          minHeight: 0,
          overflow: "hidden",
          p: flush ? 0 : { xs: 2.5, md: 3 },
          transition: "box-shadow 0.2s ease",
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
          <Typography
            sx={{
              color: "text.secondary",
              fontSize: "0.72rem",
              fontWeight: 600,
              letterSpacing: "0.06em",
              mb: 0.5,
              textTransform: "uppercase",
            }}
            variant="caption"
          >
            {eyebrow}
          </Typography>
        ) : null}
        <Typography
          sx={{
            color: "text.primary",
            fontSize: { xs: "1.25rem", md: "1.45rem" },
            fontWeight: 600,
            letterSpacing: "-0.025em",
            lineHeight: 1.2,
          }}
          variant="h5"
        >
          {title}
        </Typography>
        {description ? (
          <Typography
            sx={{
              color: "text.secondary",
              fontSize: "0.85rem",
              fontWeight: 500,
              mt: 0.35,
            }}
            variant="body2"
          >
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
          p: { xs: 2.5, md: 3.5 },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...props}
    />
  );
}

export function ErgDivider() {
  return <Divider sx={{ borderColor: "rgba(0, 0, 0, 0.06)", my: 2 }} />;
}
