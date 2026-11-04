import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { type ReactNode } from "react";
import { appleDesign } from "@/features/employee-management/components/apple-ui-tokens";

export function AppleFieldCard({
  icon,
  label,
  value,
}: {
  icon?: ReactNode;
  label: string;
  value: unknown;
}) {
  const displayValue = String(value || "");
  const isPlaceholder = !value;

  return (
    <Box
      sx={{
        bgcolor: "#FFFFFF",
        border: `1px solid ${appleDesign.colors.border}`,
        borderRadius: "14px",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.02)",
        display: "flex",
        flexDirection: "column",
        gap: 0.5,
        p: 1.75,
        transition: "all 0.15s ease",
        "&:hover": {
          borderColor: appleDesign.colors.borderMedium,
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.04)",
        },
      }}
    >
      <Box sx={{ alignItems: "center", display: "flex", gap: 1, mb: 0.25 }}>
        {icon && (
          <Box
            sx={{
              alignItems: "center",
              bgcolor: "rgba(0, 0, 0, 0.03)",
              borderRadius: "8px",
              display: "flex",
              height: 28,
              justifyContent: "center",
              width: 28,
            }}
          >
            {icon}
          </Box>
        )}
        <Typography
          variant="caption"
          sx={{
            color: appleDesign.colors.textTertiary,
            fontSize: "0.72rem",
            fontWeight: 600,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          {label}
        </Typography>
      </Box>
      <Typography
        variant="body2"
        sx={{
          color: isPlaceholder
            ? appleDesign.colors.textTertiary
            : appleDesign.colors.textPrimary,
          fontSize: "0.875rem",
          fontWeight: isPlaceholder ? 500 : 700,
          pl: icon ? 4.5 : 0,
          wordBreak: "break-word",
        }}
      >
        {isPlaceholder ? "Chưa cập nhật" : displayValue}
      </Typography>
    </Box>
  );
}
