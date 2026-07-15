import Box from "@mui/material/Box";
import Chip, { type ChipProps } from "@mui/material/Chip";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";

type ErgStatusTone = "success" | "warning" | "error" | "info" | "neutral";

const CHIP_COLOR_BY_TONE: Record<Exclude<ErgStatusTone, "neutral">, ChipProps["color"]> = {
  error: "error",
  info: "info",
  success: "success",
  warning: "warning",
};

type ErgStatusChipProps = Omit<ChipProps, "color"> & {
  tone?: ErgStatusTone;
};

export function ErgStatusChip({ tone = "neutral", variant = "filled", ...props }: ErgStatusChipProps) {
  return (
    <Chip
      color={tone === "neutral" ? undefined : CHIP_COLOR_BY_TONE[tone]}
      size="small"
      variant={variant}
      {...props}
    />
  );
}

type ErgEmptyStateProps = {
  action?: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  title: ReactNode;
};

export function ErgEmptyState({ action, description, icon, title }: ErgEmptyStateProps) {
  return (
    <Box
      sx={{
        alignItems: "center",
        bgcolor: "background.paper",
        border: "1px dashed",
        borderColor: "divider",
        borderRadius: 3,
        display: "flex",
        flexDirection: "column",
        gap: 1.25,
        justifyContent: "center",
        minHeight: 220,
        p: 4,
        textAlign: "center",
      }}
    >
      {icon ? <Box sx={{ color: "primary.main", display: "flex" }}>{icon}</Box> : null}
      <Typography color="text.primary" sx={{ fontWeight: 800 }} variant="h6">
        {title}
      </Typography>
      {description ? (
        <Typography color="text.secondary" sx={{ maxWidth: 460 }} variant="body2">
          {description}
        </Typography>
      ) : null}
      {action ? <Box sx={{ mt: 1 }}>{action}</Box> : null}
    </Box>
  );
}

export function ErgLoadingSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <Box sx={{ display: "grid", gap: 1.25 }}>
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton height={42} key={index} variant="rounded" />
      ))}
    </Box>
  );
}
