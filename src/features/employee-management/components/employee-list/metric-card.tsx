import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { appleDesign } from "@/features/employee-management/components/apple-ui-tokens";

export function MetricCard({
  icon,
  label,
  value,
  subtext,
  tone = "neutral",
}: {
  icon: React.ReactNode;
  label: string;
  subtext: string;
  tone?: "neutral" | "warning";
  value: string;
}) {
  return (
    <Box
      sx={{
        bgcolor: "#FFFFFF",
        border: `1px solid ${
          tone === "warning" ? "rgba(255, 149, 0, 0.3)" : appleDesign.colors.border
        }`,
        borderRadius: "16px",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.02)",
        display: "flex",
        flexDirection: "column",
        gap: 0.75,
        p: 2.25,
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
        "&:hover": {
          boxShadow: "0 4px 16px rgba(0, 0, 0, 0.04)",
          transform: "translateY(-1px)",
        },
      }}
    >
      <Box sx={{ alignItems: "center", display: "flex", justifyContent: "space-between" }}>
        <Typography
          variant="caption"
          sx={{
            color: appleDesign.colors.textTertiary,
            fontWeight: 650,
            letterSpacing: "0.03em",
          }}
        >
          {label}
        </Typography>
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
      </Box>
      <Typography
        variant="h6"
        sx={{
          color: tone === "warning" ? appleDesign.colors.amberText : appleDesign.colors.textPrimary,
          fontWeight: 750,
          letterSpacing: "-0.02em",
        }}
      >
        {value}
      </Typography>
      <Typography variant="caption" sx={{ color: appleDesign.colors.textSecondary }}>
        {subtext}
      </Typography>
    </Box>
  );
}
