import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import Box, { type BoxProps } from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import InputAdornment from "@mui/material/InputAdornment";
import NativeSelect, { type NativeSelectProps } from "@mui/material/NativeSelect";
import Paper, { type PaperProps } from "@mui/material/Paper";
import Table, { type TableProps } from "@mui/material/Table";
import TableCell, { type TableCellProps } from "@mui/material/TableCell";
import TextField, { type TextFieldProps } from "@mui/material/TextField";
import Typography, { type TypographyProps } from "@mui/material/Typography";
import type { ReactNode } from "react";

export function LmsPageShell(props: BoxProps) {
  return <Box sx={{ bgcolor: "background.default", color: "text.primary", display: "flex", flex: 1, flexDirection: "column", gap: 1, minHeight: 0, p: { xs: 1, xl: 1.5 } }} {...props} />;
}

export function LmsToolbar(props: PaperProps) {
  return <Paper sx={{ border: "1px solid", borderColor: "divider", flexShrink: 0, px: 1.25, py: 1 }} {...props} />;
}

export function LmsPanel(props: PaperProps) {
  return <Paper component="section" sx={{ border: "1px solid", borderColor: "divider", overflow: "hidden" }} {...props} />;
}

export function LmsSectionTitle(props: TypographyProps) {
  return <Typography component="h2" sx={{ fontSize: 14, fontWeight: 750, lineHeight: 1.45 }} {...props} />;
}

export function LmsSelect(props: NativeSelectProps) {
  return <NativeSelect fullWidth sx={{ bgcolor: "background.paper", borderRadius: 2, fontSize: 14, fontWeight: 700, minHeight: 40, px: 1.25 }} {...props} />;
}

type LmsSearchInputProps = Omit<TextFieldProps, "variant"> & { inputClassName?: string };

export function LmsSearchInput({ inputClassName, slotProps, ...props }: LmsSearchInputProps) {
  return (
    <TextField
      fullWidth
      placeholder="Tìm kiếm"
      slotProps={{
        ...slotProps,
        input: {
          ...(slotProps?.input as object | undefined),
          startAdornment: <InputAdornment position="start"><SearchRoundedIcon color="primary" sx={{ fontSize: 18 }} /></InputAdornment>,
        },
        htmlInput: {
          ...(slotProps?.htmlInput as object | undefined),
          className: inputClassName,
        },
      }}
      sx={{ maxWidth: { xl: 340 }, minWidth: 220 }}
      {...props}
    />
  );
}

type LmsBadgeTone = "default" | "blue" | "green" | "amber" | "red" | "slate";
const toneColor = { blue: "info", green: "success", amber: "warning", red: "error" } as const;

export function LmsBadge({ children, tone = "default" }: { children: ReactNode; className?: string; tone?: LmsBadgeTone }) {
  const color = tone in toneColor ? toneColor[tone as keyof typeof toneColor] : "default";
  return <Chip color={color} label={children} size="small" variant={tone === "default" || tone === "slate" ? "outlined" : "filled"} />;
}

export function LmsStatusPill(props: { children: ReactNode; className?: string; tone?: LmsBadgeTone }) {
  return <LmsBadge {...props} />;
}

export function LmsTable(props: TableProps) {
  return <Table className="erg-data-table" size="small" stickyHeader {...props} />;
}

export function LmsTableHeadCell(props: TableCellProps) {
  return <TableCell align="center" sx={{ bgcolor: "background.default", fontSize: 13, fontWeight: 750, height: 40 }} {...props} />;
}
