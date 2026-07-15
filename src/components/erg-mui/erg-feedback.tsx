import Box from "@mui/material/Box";
import Chip, { type ChipProps } from "@mui/material/Chip";
import Skeleton, { type SkeletonProps } from "@mui/material/Skeleton";
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
  status?: ErgStatusTone;
  tone?: ErgStatusTone;
};

export function ErgStatusChip({ status, tone = "neutral", variant = "filled", ...props }: ErgStatusChipProps) {
  const resolvedTone = status ?? tone;
  return (
    <Chip
      color={resolvedTone === "neutral" ? undefined : CHIP_COLOR_BY_TONE[resolvedTone]}
      size="small"
      variant={variant}
      {...props}
    />
  );
}

type ErgErrorStateProps = {
  action?: ReactNode;
  description: ReactNode;
  title: ReactNode;
};

export function ErgErrorState({ action, description, title }: ErgErrorStateProps) {
  return (
    <Box
      role="alert"
      sx={{
        bgcolor: "error.light",
        border: "1px solid",
        borderColor: "error.main",
        borderRadius: 2,
        color: "error.dark",
        display: "grid",
        gap: 0.75,
        p: 2,
      }}
    >
      <Typography sx={{ fontWeight: 800 }} variant="subtitle2">
        {title}
      </Typography>
      <Typography color="inherit" variant="body2">
        {description}
      </Typography>
      {action ? <Box sx={{ mt: 0.5 }}>{action}</Box> : null}
    </Box>
  );
}

export function ErgSkeleton(props: SkeletonProps) {
  return <Skeleton variant="rounded" {...props} />;
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
        <ErgSkeleton height={42} key={index} />
      ))}
    </Box>
  );
}
