import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";
import { alpha } from "@mui/material/styles";
import { nameInitials } from "@/domain/formatters/format-initials";

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
  return nameInitials(name) || "HS";
}

export function getAvatarStyle(name?: string | null) {
  const safeName = name || "HS";
  let hash = 0;
  for (let i = 0; i < safeName.length; i++) {
    hash = safeName.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
}

export const statusMeta = {
  studying: {
    bg: alpha(ergEnterpriseTokens.color.success, 0.12),
    border: alpha(ergEnterpriseTokens.color.success, 0.22),
    color: "#15803D",
    dot: ergEnterpriseTokens.color.success,
    label: "Đang học",
  },
  "at-risk": {
    bg: alpha(ergEnterpriseTokens.color.warning, 0.12),
    border: alpha(ergEnterpriseTokens.color.warning, 0.22),
    color: "#B45309",
    dot: ergEnterpriseTokens.color.warning,
    label: "Cần hỗ trợ",
  },
  inactive: {
    bg: "rgba(0, 0, 0, 0.05)",
    border: "rgba(0, 0, 0, 0.1)",
    color: ergEnterpriseTokens.color.textMuted,
    dot: ergEnterpriseTokens.color.textMuted,
    label: "Ngừng học",
  },
} as const;
