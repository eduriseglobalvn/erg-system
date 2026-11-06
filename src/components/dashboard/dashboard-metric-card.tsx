import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import { alpha } from "@mui/material/styles";
import { ergEnterpriseTokens as tk } from "@/themes/erg-enterprise-tokens";

type DashboardMetricCardProps = {
  label: string;
  value: ReactNode;
  detail: string;
  delta?: string;
  icon?: ReactNode;
  tone?: "blue" | "amber" | "emerald" | "rose" | "violet";
};

const toneStyles = {
  amber: {
    bg: alpha(tk.color.warning, 0.12),
    border: alpha(tk.color.warning, 0.22),
    color: tk.statusTint.warning.color,
    dot: tk.statusTint.warning.dot,
  },
  blue: {
    bg: tk.color.primarySoft,
    border: alpha(tk.color.primary, 0.18),
    color: tk.color.primary,
    dot: tk.color.primary,
  },
  emerald: {
    bg: alpha(tk.color.success, 0.12),
    border: alpha(tk.color.success, 0.22),
    color: tk.statusTint.success.color,
    dot: tk.statusTint.success.dot,
  },
  rose: {
    bg: alpha(tk.color.danger, 0.12),
    border: alpha(tk.color.danger, 0.22),
    color: tk.statusTint.error.color,
    dot: tk.statusTint.error.dot,
  },
  violet: {
    bg: "rgba(175, 82, 222, 0.12)",
    border: "rgba(175, 82, 222, 0.22)",
    color: "#7E22CE",
    dot: "#AF52DE",
  },
} as const;

export function DashboardMetricCard({
  delta,
  detail,
  icon,
  label,
  tone = "blue",
  value,
}: DashboardMetricCardProps) {
  const toneStyle = toneStyles[tone];

  return (
    <Card
      elevation={0}
      sx={{
        bgcolor: "#FFFFFF",
        border: "1px solid rgba(0, 0, 0, 0.06)",
        borderRadius: "16px",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.02), 0 8px 18px -4px rgba(0, 0, 0, 0.03)",
        overflow: "hidden",
        transition: "all 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
        "&:hover": {
          boxShadow: "0 4px 14px rgba(0, 0, 0, 0.04), 0 12px 24px -4px rgba(0, 0, 0, 0.06)",
          transform: "translateY(-1px)",
        },
      }}
    >
      <div className="flex items-start justify-between gap-4 p-5">
        <div className="min-w-0">
          <Box className="text-xs font-semibold tracking-normal" sx={{ color: "text.secondary" }}>{label}</Box>
          <Box className="mt-1.5 text-2xl font-semibold tracking-tight sm:text-[1.75rem]" sx={{ color: "text.primary" }}>{value}</Box>
          <Box className="mt-1 text-xs" sx={{ color: "text.secondary" }}>{detail}</Box>
        </div>
        {icon ? (
          <Box
            sx={{
              alignItems: "center",
              bgcolor: toneStyle.bg,
              borderRadius: "10px",
              color: toneStyle.color,
              display: "flex",
              flexShrink: 0,
              height: 38,
              justifyContent: "center",
              width: 38,
            }}
          >
            {icon}
          </Box>
        ) : null}
      </div>
      {delta ? (
        <div className="border-t border-[rgba(0,0,0,0.05)] bg-[#FBFBFD] px-5 py-2.5">
          <Box
            sx={{
              alignItems: "center",
              bgcolor: toneStyle.bg,
              border: `1px solid ${toneStyle.border}`,
              borderRadius: "9999px",
              color: toneStyle.color,
              display: "inline-flex",
              fontSize: "0.72rem",
              fontWeight: 600,
              lineHeight: 1,
              px: 1.25,
              py: 0.4,
            }}
          >
            {delta}
          </Box>
        </div>
      ) : null}
    </Card>
  );
}
