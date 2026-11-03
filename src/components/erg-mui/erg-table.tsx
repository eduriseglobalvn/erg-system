import Box from "@mui/material/Box";
import Paper, { type PaperProps } from "@mui/material/Paper";
import Table, { type TableProps } from "@mui/material/Table";
import TableContainer from "@mui/material/TableContainer";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";

type ErgDataTableShellProps = PaperProps & {
  footer?: ReactNode;
  toolbar?: ReactNode;
};

export function ErgDataTableShell({ children, footer, toolbar, sx, ...props }: ErgDataTableShellProps) {
  return (
    <Paper
      elevation={0}
      sx={[
        {
          bgcolor: "#FFFFFF",
          border: "1px solid rgba(0, 0, 0, 0.06)",
          borderColor: "rgba(0, 0, 0, 0.06)",
          borderRadius: "16px",
          boxShadow: "0 2px 10px rgba(0, 0, 0, 0.02), 0 10px 28px -4px rgba(0, 0, 0, 0.04)",
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
      <TableContainer sx={{ minHeight: 0 }}>{children}</TableContainer>
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
        bgcolor: "#FFFFFF",
        borderBottom: "1px solid rgba(0, 0, 0, 0.06)",
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        gap: 1.5,
        justifyContent: "space-between",
        p: 2,
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        {title ? (
          <Typography
            sx={{
              color: "#1D1D1F",
              fontSize: "1.05rem",
              fontWeight: 800,
              letterSpacing: "-0.015em",
            }}
            variant="subtitle1"
          >
            {title}
          </Typography>
        ) : null}
        {meta ? (
          <Typography
            sx={{
              color: "#86868B",
              fontSize: "0.8rem",
              fontWeight: 500,
              mt: 0.25,
            }}
            variant="body2"
          >
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

export function ErgTable({ sx, ...props }: TableProps) {
  return (
    <Table
      size="small"
      stickyHeader
      sx={[
        {
          "& .MuiTableCell-head": {
            bgcolor: "rgba(250, 250, 252, 0.96)",
            borderBottom: "1px solid rgba(0, 0, 0, 0.06)",
            color: "#86868B",
            fontSize: "0.72rem",
            fontWeight: 700,
            letterSpacing: "0.04em",
            py: 1.35,
            textTransform: "uppercase",
          },
          "& .MuiTableCell-body": {
            borderBottom: "1px solid rgba(0, 0, 0, 0.04)",
            color: "#1D1D1F",
            fontSize: "0.85rem",
            py: 1.35,
          },
          "& .MuiTableRow-hover": {
            transition: "background-color 0.12s ease",
            "&:hover": {
              bgcolor: "rgba(0, 113, 227, 0.035) !important",
            },
          },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...props}
    />
  );
}
