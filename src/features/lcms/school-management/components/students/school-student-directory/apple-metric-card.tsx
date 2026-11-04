import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { type ReactNode } from "react";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

export function AppleMetricCard({
  icon,
  iconBg,
  iconColor,
  label,
  subtext,
  value,
}: {
  icon: ReactNode;
  iconBg: string;
  iconColor: string;
  label: string;
  subtext: string;
  value: number | string;
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        bgcolor: "#FFFFFF",
        borderRadius: "16px",
        border: `1px solid ${ergEnterpriseTokens.color.border}`,
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.02), 0 8px 18px -4px rgba(0, 0, 0, 0.03)",
        p: 2,
        transition: "all 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
        "&:hover": {
          boxShadow: "0 4px 14px rgba(0, 0, 0, 0.04), 0 12px 24px -4px rgba(0, 0, 0, 0.06)",
          transform: "translateY(-1px)",
        },
      }}
    >
      <Box sx={{ alignItems: "center", display: "flex", justifyContent: "space-between", mb: 1 }}>
        <Typography sx={{ color: ergEnterpriseTokens.color.textMuted, fontSize: "0.78rem", fontWeight: 600 }}>
          {label}
        </Typography>
        <Box
          sx={{
            alignItems: "center",
            bgcolor: iconBg,
            borderRadius: "10px",
            color: iconColor,
            display: "flex",
            height: 32,
            justifyContent: "center",
            width: 32,
          }}
        >
          {icon}
        </Box>
      </Box>
      <Typography sx={{ color: ergEnterpriseTokens.color.text, fontSize: "1.65rem", fontWeight: 600, letterSpacing: "-0.025em", lineHeight: 1.1 }}>
        {value}
      </Typography>
      <Typography sx={{ color: ergEnterpriseTokens.color.textMuted, fontSize: "0.72rem", fontWeight: 500, mt: 0.5 }}>
        {subtext}
      </Typography>
    </Paper>
  );
}
