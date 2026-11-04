import LaptopMacRoundedIcon from "@mui/icons-material/LaptopMacRounded";
import PhoneIphoneRoundedIcon from "@mui/icons-material/PhoneIphoneRounded";
import TabletMacRoundedIcon from "@mui/icons-material/TabletMacRounded";
import Avatar, { type AvatarProps } from "@mui/material/Avatar";
import Box, { type BoxProps } from "@mui/material/Box";
import type { ChipProps } from "@mui/material/Chip";
import { ErgStatusChip } from "@/components/erg-mui/erg-feedback";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";
import { alpha } from "@mui/material/styles";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

export const appleDesign = {
  colors: {
    blue: ergEnterpriseTokens.color.primary,
    blueHover: ergEnterpriseTokens.color.primaryHover,
    bluePressed: ergEnterpriseTokens.color.primaryHover,
    blueSoft: alpha(ergEnterpriseTokens.color.primary, 0.08),
    blueSoftBorder: alpha(ergEnterpriseTokens.color.primary, 0.18),
    green: ergEnterpriseTokens.color.success,
    greenSoft: alpha(ergEnterpriseTokens.color.success, 0.12),
    greenText: "#15803D",
    greenDot: ergEnterpriseTokens.color.success,
    amber: ergEnterpriseTokens.color.warning,
    amberSoft: alpha(ergEnterpriseTokens.color.warning, 0.12),
    amberText: "#B45309",
    amberDot: ergEnterpriseTokens.color.warning,
    red: ergEnterpriseTokens.color.danger,
    redSoft: alpha(ergEnterpriseTokens.color.danger, 0.1),
    redText: "#DC2626",
    redDot: ergEnterpriseTokens.color.danger,
    danger: ergEnterpriseTokens.color.danger,
    dangerText: "#DC2626",
    purple: "#AF52DE",
    purpleSoft: "rgba(175, 82, 222, 0.12)",
    purpleText: "#7E22CE",
    surface: "#FFFFFF",
    surfaceSubtle: ergEnterpriseTokens.color.surfaceSubtle,
    surfaceGlass: "rgba(255, 255, 255, 0.88)",
    border: ergEnterpriseTokens.color.border,
    borderMedium: ergEnterpriseTokens.color.border,
    borderHover: ergEnterpriseTokens.color.border,
    borderSubtle: ergEnterpriseTokens.color.border,
    textPrimary: ergEnterpriseTokens.color.text,
    textSecondary: ergEnterpriseTokens.color.textMuted,
    textTertiary: ergEnterpriseTokens.color.textSoft,
  },
  shadows: {
    card: "0 2px 10px rgba(0, 0, 0, 0.03), 0 10px 24px -4px rgba(0, 0, 0, 0.05)",
    cardElevated: "0 4px 16px rgba(0, 0, 0, 0.04), 0 16px 36px -4px rgba(0, 0, 0, 0.08)",
    button: `0 2px 8px ${alpha(ergEnterpriseTokens.color.primary, 0.28)}`,
    buttonHover: `0 4px 14px ${alpha(ergEnterpriseTokens.color.primary, 0.38)}`,
    pill: "0 1px 3px rgba(0, 0, 0, 0.06)",
    sheet: "0 20px 48px rgba(0, 0, 0, 0.12), 0 4px 16px rgba(0, 0, 0, 0.06)",
    popover: "0 12px 36px rgba(0, 0, 0, 0.12), 0 4px 12px rgba(0, 0, 0, 0.06)",
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 9999,
  },
} as const;

export const appleCleanInputSx = {
  width: "100%",
  "& .MuiOutlinedInput-root": {
    backgroundColor: "#FBFBFD",
    borderRadius: `${ergEnterpriseTokens.radius.md}px`,
    fontSize: "0.875rem",
    fontWeight: 500,
    transition: "all 0.15s ease",
    "& fieldset": {
      borderColor: "divider",
      borderRadius: `${ergEnterpriseTokens.radius.md}px`,
    },
    "&:hover": {
      backgroundColor: "#FFFFFF",
      "& fieldset": {
        borderColor: "rgba(0, 0, 0, 0.24)",
      },
    },
    "&.Mui-focused": {
      backgroundColor: "#FFFFFF",
      "& fieldset": {
        borderColor: "primary.main",
        borderWidth: "1.5px",
        boxShadow: `0 0 0 3px ${alpha(ergEnterpriseTokens.color.primary, 0.15)}`,
      },
    },
    "&.Mui-disabled": {
      backgroundColor: "rgba(0, 0, 0, 0.03)",
      "& fieldset": {
        borderColor: "divider",
      },
    },
  },
  "& .MuiOutlinedInput-input": {
    padding: "9px 13px",
    height: "22px",
    color: "text.primary",
    "&::placeholder": {
      color: "text.disabled",
      opacity: 1,
    },
  },
  "& .MuiSelect-select": {
    padding: "9px 13px !important",
    height: "22px !important",
    display: "flex",
    alignItems: "center",
  },
};

export function AppleFormField({
  children,
  label,
  required,
  helperText,
  fullWidth = true,
  sx,
}: {
  children: ReactNode;
  fullWidth?: boolean;
  helperText?: string;
  label?: string;
  required?: boolean;
  sx?: BoxProps["sx"];
}) {
  return (
    <Box
      sx={[
        {
          display: "flex",
          flexDirection: "column",
          gap: 0.65,
          width: fullWidth ? "100%" : "auto",
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {label && (
        <Typography
          sx={{
            color: appleDesign.colors.textPrimary,
            fontSize: "0.8125rem",
            fontWeight: 600,
            letterSpacing: "-0.01em",
            userSelect: "none",
          }}
        >
          {label}
          {required && (
            <Box component="span" sx={{ color: appleDesign.colors.red, ml: 0.4 }}>
              *
            </Box>
          )}
        </Typography>
      )}
      {children}
      {helperText && (
        <Typography
          variant="caption"
          sx={{
            color: appleDesign.colors.textTertiary,
            fontSize: "0.75rem",
            lineHeight: 1.3,
          }}
        >
          {helperText}
        </Typography>
      )}
    </Box>
  );
}

export const appleInputSx = {
  width: "100%",
  "& .MuiInputLabel-root": {
    color: "text.secondary",
    fontSize: "0.85rem",
    fontWeight: 600,
    letterSpacing: "-0.01em",
    "&.Mui-focused": {
      color: "primary.main",
    },
  },
  "& .MuiOutlinedInput-root": {
    backgroundColor: "#FBFBFD",
    borderRadius: `${ergEnterpriseTokens.radius.md}px`,
    fontSize: "0.875rem",
    fontWeight: 500,
    transition: "all 0.15s ease",
    "& fieldset": {
      borderColor: "divider",
      borderRadius: `${ergEnterpriseTokens.radius.md}px`,
    },
    "&:hover": {
      backgroundColor: "#FFFFFF",
      "& fieldset": {
        borderColor: "rgba(0, 0, 0, 0.24)",
      },
    },
    "&.Mui-focused": {
      backgroundColor: "#FFFFFF",
      "& fieldset": {
        borderColor: "primary.main",
        borderWidth: "1.5px",
        boxShadow: `0 0 0 3px ${alpha(ergEnterpriseTokens.color.primary, 0.15)}`,
      },
    },
  },
  "& .MuiOutlinedInput-input": {
    padding: "10px 14px",
    color: "text.primary",
    "&::placeholder": {
      color: "text.disabled",
      opacity: 1,
    },
  },
};

const AVATAR_GRADIENTS = [
  { bg: "linear-gradient(135deg, #E0E7FF 0%, #C7D2FE 100%)", color: "#3730A3" },
  { bg: "linear-gradient(135deg, #E0F2FE 0%, #BAE6FD 100%)", color: "#0369A1" },
  { bg: "linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)", color: "#92400E" },
  { bg: "linear-gradient(135deg, #DCFCE7 0%, #BBF7D0 100%)", color: "#166534" },
  { bg: "linear-gradient(135deg, #FCE7F3 0%, #FBCFE8 100%)", color: "#9D174D" },
  { bg: "linear-gradient(135deg, #EDE9FE 0%, #DDD6FE 100%)", color: "#5B21B6" },
  { bg: "linear-gradient(135deg, #FFEDD5 0%, #FED7AA 100%)", color: "#C2410C" },
];

export function getInitials(name?: string | null) {
  if (!name) return "ERG";
  const trimmed = name.trim();
  if (!trimmed) return "ERG";
  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

export function getAvatarColorStyle(name?: string | null) {
  const safeName = name || "ERG";
  let hash = 0;
  for (let i = 0; i < safeName.length; i++) {
    hash = safeName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[idx];
}

export function AppleAvatar({
  name,
  size = 38,
  sx,
  ...props
}: {
  name?: string | null;
  size?: number;
} & AvatarProps) {
  const style = getAvatarColorStyle(name);
  const initials = getInitials(name);
  return (
    <Avatar
      sx={[
        {
          background: style.bg,
          border: `1.5px solid ${appleDesign.colors.surface}`,
          boxShadow: "0 2px 6px rgba(0, 0, 0, 0.08)",
          color: style.color,
          fontSize: size * 0.4,
          fontWeight: 600,
          height: size,
          letterSpacing: "-0.01em",
          width: size,
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...props}
    >
      {initials}
    </Avatar>
  );
}

export type AppleTone = "success" | "warning" | "danger" | "info" | "neutral" | "purple";

const APPLE_TONE_TO_STATUS = { danger: "error", info: "info", neutral: "neutral", purple: "info", success: "success", warning: "warning" } as const;

export function AppleStatusBadge({
  label,
  tone = "neutral",
  dot = true,
  sx,
}: {
  dot?: boolean;
  label: ReactNode;
  sx?: BoxProps["sx"];
  tone?: AppleTone;
}) {
  return <ErgStatusChip dot={dot} label={label} sx={sx as ChipProps["sx"]} tone={APPLE_TONE_TO_STATUS[tone] ?? "neutral"} />;
}

export function parseDeviceString(rawString?: string, deviceType?: string) {
  const str = rawString || "";
  let os = "Thiết bị không xác định";
  let browser = "";
  let icon: "desktop" | "mobile" | "tablet" = "desktop";

  if (/iPhone/i.test(str)) {
    os = "iPhone";
    icon = "mobile";
    const match = str.match(/OS (\d+[_\d]*)/i);
    if (match) os += ` (iOS ${match[1].replace(/_/g, ".")})`;
  } else if (/iPad/i.test(str)) {
    os = "iPad";
    icon = "tablet";
  } else if (/Android/i.test(str)) {
    os = "Android";
    icon = "mobile";
  } else if (/Windows NT 10\.0/i.test(str) || /Windows/i.test(str)) {
    os = "Windows";
    icon = "desktop";
  } else if (/Macintosh|Mac OS X/i.test(str)) {
    os = "macOS";
    icon = "desktop";
  } else if (/Linux/i.test(str)) {
    os = "Linux";
    icon = "desktop";
  }

  if (deviceType?.toUpperCase() === "MOBILE" || deviceType?.toUpperCase() === "WEB_MOBILE") {
    icon = "mobile";
  }

  if (/Edg\//i.test(str)) {
    browser = "Microsoft Edge";
  } else if (/Chrome\//i.test(str) && !/Edg\//i.test(str)) {
    browser = "Chrome";
  } else if (/Safari\//i.test(str) && !/Chrome\//i.test(str)) {
    browser = "Safari";
  } else if (/Firefox\//i.test(str)) {
    browser = "Firefox";
  }

  const title = browser ? `${browser} trên ${os}` : os;
  return { browser, icon, os, title };
}

export function DeviceIcon({ type, size = "medium" }: { size?: "small" | "medium"; type: "desktop" | "mobile" | "tablet" }) {
  const fontSize = size === "small" ? "small" : "medium";
  switch (type) {
    case "mobile":
      return <PhoneIphoneRoundedIcon fontSize={fontSize} sx={{ color: appleDesign.colors.textSecondary }} />;
    case "tablet":
      return <TabletMacRoundedIcon fontSize={fontSize} sx={{ color: appleDesign.colors.textSecondary }} />;
    case "desktop":
    default:
      return <LaptopMacRoundedIcon fontSize={fontSize} sx={{ color: appleDesign.colors.textSecondary }} />;
  }
}
