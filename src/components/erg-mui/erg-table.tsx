import Box from "@mui/material/Box";
import Paper, { type PaperProps } from "@mui/material/Paper";
import Table, { type TableProps } from "@mui/material/Table";
import TableContainer from "@mui/material/TableContainer";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";
import { ergEnterpriseTokens as t } from "@/themes/erg-enterprise-tokens";

type ErgDataTableShellProps = PaperProps & {
  footer?: ReactNode;
  toolbar?: ReactNode;
  /** Names the horizontally scrolling area and makes it keyboard-focusable (arrow keys scroll). */
  scrollLabel?: string;
};

/** Card around a table: 1px border, no shadow at rest (design system: shadow only on floating surfaces). */
export function ErgDataTableShell({ children, footer, scrollLabel, toolbar, sx, ...props }: ErgDataTableShellProps) {
  return (
    <Paper
      elevation={0}
      sx={[
        {
          bgcolor: "background.paper",
          border: `1px solid ${t.color.border}`,
          borderRadius: `${t.radius.sm}px`,
          boxShadow: "none",
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          overflow: "hidden",
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...props}
    >
      {toolbar}
      <TableContainer {...(scrollLabel ? { "aria-label": scrollLabel, role: "region", tabIndex: 0 } : {})} sx={{ minHeight: 0 }}>{children}</TableContainer>
      {footer}
    </Paper>
  );
}

type ErgTableToolbarProps = {
  actions?: ReactNode;
  meta?: ReactNode;
  title?: ReactNode;
};

export function ErgTableToolbar({ actions, meta, title }: ErgTableToolbarProps) {
  return (
    <Box
      sx={{
        alignItems: { xs: "flex-start", sm: "center" },
        borderBottom: `1px solid ${t.color.border}`,
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        gap: 1.5,
        justifyContent: "space-between",
        p: 2,
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        {title ? (
          <Typography sx={{ color: "text.primary" }} variant="subtitle1">
            {title}
          </Typography>
        ) : null}
        {meta ? (
          <Typography sx={{ color: "text.secondary", mt: 0.25 }} variant="body2">
            {meta}
          </Typography>
        ) : null}
      </Box>
      {actions ? (
        <Box sx={{ alignItems: "center", display: "flex", flexDirection: "row", flexWrap: "wrap", gap: 1 }}>
          {actions}
        </Box>
      ) : null}
    </Box>
  );
}

/** Header, padding and row rules come from the theme's MuiTableCell; numbers line up digit for digit. */
export function ErgTable({ sx, ...props }: TableProps) {
  return (
    <Table
      stickyHeader
      sx={[{ fontVariantNumeric: "tabular-nums", "& .MuiTableCell-root": { fontVariantNumeric: "tabular-nums" } }, ...(Array.isArray(sx) ? sx : [sx])]}
      {...props}
    />
  );
}
