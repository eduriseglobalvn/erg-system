import Box from "@mui/material/Box";
import Chip, { type ChipProps } from "@mui/material/Chip";
import Skeleton, { type SkeletonProps } from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";

import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

type ErgStatusTone = "success" | "warning" | "error" | "info" | "neutral";

type ErgStatusChipProps = Omit<ChipProps, "color"> & {
  dot?: boolean;
  status?: ErgStatusTone;
  tone?: ErgStatusTone;
};

export function ErgStatusChip({ dot = true, label, status, sx, tone = "neutral", variant: _variant, ...props }: ErgStatusChipProps) {
  const resolvedTone = status ?? tone;
  const style = ergEnterpriseTokens.statusTint[resolvedTone] ?? ergEnterpriseTokens.statusTint.neutral;

  return (
    <Chip
      icon={
        dot ? (
          <Box
            component="span"
            sx={{ bgcolor: style.dot, borderRadius: "50%", display: "inline-block", height: 6, ml: "6px !important", mr: "-4px !important", width: 6 }}
          />
        ) : undefined
      }
      label={label}
      size="small"
      sx={[
        {
          bgcolor: style.bg,
          borderRadius: "9999px",
          color: style.color,
          fontSize: 12,
          fontWeight: 500,
          height: 22,
          lineHeight: 1,
          "& .MuiChip-label": { px: 1 },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      variant="filled"
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
        bgcolor: "rgba(255, 59, 48, 0.08)",
        border: "1px solid rgba(255, 59, 48, 0.2)",
        borderRadius: "14px",
        color: "#DC2626",
        display: "grid",
        gap: 0.75,
        p: 2.25,
      }}
    >
      <Typography sx={{ color: "#DC2626", fontSize: "0.95rem", fontWeight: 800 }} variant="subtitle2">
        {title}
      </Typography>
      <Typography color="inherit" sx={{ fontSize: "0.85rem", opacity: 0.9 }} variant="body2">
        {description}
      </Typography>
      {action ? <Box sx={{ mt: 0.5 }}>{action}</Box> : null}
    </Box>
  );
}

export function ErgSkeleton(props: SkeletonProps) {
  return <Skeleton sx={{ borderRadius: "10px" }} variant="rounded" {...props} />;
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
        bgcolor: "#FFFFFF",
        border: "1px dashed rgba(0, 0, 0, 0.12)",
        borderRadius: "16px",
        display: "flex",
        flexDirection: "column",
        gap: 1.25,
        justifyContent: "center",
        minHeight: 220,
        p: 4,
        textAlign: "center",
      }}
    >
      {icon ? <Box sx={{ color: "#0071E3", display: "flex" }}>{icon}</Box> : null}
      <Typography sx={{ color: "#1D1D1F", fontSize: "1.05rem", fontWeight: 800 }}>
        {title}
      </Typography>
      {description ? (
        <Typography sx={{ color: "#86868B", fontSize: "0.85rem", maxWidth: 460 }} variant="body2">
          {description}
        </Typography>
      ) : null}
      {action ? <Box sx={{ mt: 1 }}>{action}</Box> : null}
    </Box>
  );
}

export function ErgLoadingSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <Box sx={{ display: "grid", gap: 1.5 }}>
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton height={36} key={index} sx={{ borderRadius: "8px" }} variant="rounded" />
      ))}
    </Box>
  );
}
