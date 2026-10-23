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
      sx={[
        {
          borderColor: "divider",
          borderRadius: 3,
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
        borderBottom: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        gap: 1.5,
        justifyContent: "space-between",
        p: 2,
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        {title ? (
          <Typography sx={{ fontWeight: 850 }} variant="subtitle1">
            {title}
          </Typography>
        ) : null}
        {meta ? (
          <Typography color="text.secondary" variant="body2">
            {meta}
          </Typography>
        ) : null}
      </Box>
      {actions ? <Box sx={{ display: "flex", flexDirection: "row", flexWrap: "wrap", gap: 1 }}>{actions}</Box> : null}
    </Box>
  );
}

export function ErgTable(props: TableProps) {
  return <Table stickyHeader size="small" {...props} />;
}
